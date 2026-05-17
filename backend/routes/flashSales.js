const express = require('express');
const router = express.Router();
const FlashSale = require('../models/FlashSale');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// Get all active flash sales
router.get('/active', async (req, res) => {
    try {
        const now = new Date();
        
        const flashSales = await FlashSale.find({
            isActive: true,
            startTime: { $lte: now },
            endTime: { $gte: now }
        }).populate('product');
        
        const activeSales = [];
        
        for (const sale of flashSales) {
            if (!sale.product) continue;
            
            const discountedPrice = sale.product.price - (sale.product.price * sale.discountPercentage / 100);
            const remainingQuantity = sale.maxQuantity - sale.soldQuantity;
            
            activeSales.push({
                _id: sale._id,
                product: {
                    _id: sale.product._id,
                    name: sale.product.name,
                    originalPrice: sale.product.price,
                    discountedPrice: discountedPrice,
                    imageUrl: sale.product.imageUrl,
                    category: sale.product.category
                },
                discountPercentage: sale.discountPercentage,
                endTime: sale.endTime,
                remainingQuantity: remainingQuantity
            });
        }
        
        res.json({ success: true, data: activeSales });
    } catch (error) {
        console.error('Get flash sales error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;