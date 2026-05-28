const express = require('express');
const router = express.Router();
const FlashSale = require('../models/FlashSale');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// Get all active flash sales
router.get('/active', async (req, res) => {
    try {
        const now = new Date();
        
        // Find all flash sales that are active and within time range
        const flashSales = await FlashSale.find({
            isActive: true,
            startTime: { $lte: now },
            endTime: { $gte: now }
        }).populate('product', 'name price imageUrl category');
        
        const activeSales = [];
        for (const sale of flashSales) {
            // Only include if still has remaining quantity
            if (sale.soldQuantity < sale.maxQuantity && sale.isCurrentlyActive()) {
                const product = sale.product;

                // FIX: Check if the product actually exists in the database.
                // If the product was deleted but the flash sale still exists, skip it gracefully.
                if (!product) {
                    continue; 
                }

                activeSales.push({
                    _id: sale._id,
                    product: {
                        _id: product._id,
                        name: product.name,
                        originalPrice: product.price,
                        discountedPrice: sale.getDiscountedPrice(product.price),
                        imageUrl: product.imageUrl,
                        category: product.category
                    },
                    discountPercentage: sale.discountPercentage,
                    endTime: sale.endTime,
                    remainingQuantity: sale.maxQuantity - sale.soldQuantity,
                    isActive: sale.isCurrentlyActive()
                });
            }
        }
        
        res.json({ success: true, data: activeSales });
    } catch (error) {
        console.error('Get flash sales error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get flash sale for a specific product
router.get('/product/:productId', async (req, res) => {
    try {
        const now = new Date();
        const flashSale = await FlashSale.findOne({
            product: req.params.productId,
            isActive: true,
            startTime: { $lte: now },
            endTime: { $gte: now }
        });
        
        if (!flashSale) {
            return res.json({ success: true, hasFlashSale: false });
        }
        
        const product = await Product.findById(req.params.productId);
        
        // Defensive Check: Ensure the product is valid before querying its price
        if (!product) {
            return res.status(404).json({ success: false, message: 'Associated product not found' });
        }
        
        res.json({
            success: true,
            hasFlashSale: true,
            data: {
                discountPercentage: flashSale.discountPercentage,
                discountedPrice: flashSale.getDiscountedPrice(product.price),
                originalPrice: product.price,
                endTime: flashSale.endTime,
                remainingQuantity: flashSale.maxQuantity - flashSale.soldQuantity
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create flash sale (admin only)
router.post('/', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        
        const { productId, discountPercentage, startTime, endTime, maxQuantity } = req.body;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        const existingSale = await FlashSale.findOne({
            product: productId,
            isActive: true,
            endTime: { $gt: new Date() }
        });
        
        if (existingSale) {
            return res.status(400).json({ success: false, message: 'Product already has an active flash sale' });
        }
        
        const flashSale = await FlashSale.create({
            product: productId,
            discountPercentage,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            maxQuantity: maxQuantity || 50,
            soldQuantity: 0,
            isActive: true
        });
        
        res.status(201).json({ success: true, data: flashSale });
    } catch (error) {
        console.error('Create flash sale error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update flash sale (admin only)
router.put('/:id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        
        const flashSale = await FlashSale.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        
        res.json({ success: true, data: flashSale });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete flash sale (admin only)
router.delete('/:id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        
        await FlashSale.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Flash sale deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Increment sold quantity
router.post('/:id/increment', protect, async (req, res) => {
    try {
        const flashSale = await FlashSale.findById(req.params.id);
        if (!flashSale) {
            return res.status(404).json({ success: false, message: 'Flash sale not found' });
        }
        
        if (flashSale.soldQuantity >= flashSale.maxQuantity) {
            return res.status(400).json({ success: false, message: 'Flash sale limit reached' });
        }
        
        flashSale.soldQuantity += 1;
        await flashSale.save();
        
        res.json({ success: true, soldQuantity: flashSale.soldQuantity });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;