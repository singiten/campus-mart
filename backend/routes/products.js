const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

// GET all products (public - for students to browse)
router.get('/', async (req, res) => {
    try {
        const { category, campus, search, minPrice, maxPrice } = req.query;
        
        let query = { isAvailable: true };
        
        // Filter by category
        if (category) {
            query.category = category;
        }
        
        // Filter by campus availability
        if (campus) {
            query.availableCampuses = campus;
        }
        
        // Search by name
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        
        // Price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }
        
        const products = await Product.find(query)
            .populate('vendor', 'businessName rating')
            .sort('-createdAt');
        
        res.json({
            success: true,
            count: products.length,
            data: products
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('vendor', 'businessName rating operatingHours');
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        res.json({ success: true, data: product });
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE product (vendor only)
router.post('/', async (req, res) => {
    try {
        const { name, description, category, subcategory, price, vendorId, imageUrl, stock, availableCampuses } = req.body;
        
        // Check if vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }
        
        const product = await Product.create({
            name,
            description,
            category,
            subcategory,
            price,
            vendor: vendorId,
            imageUrl,
            stock,
            availableCampuses: availableCampuses || ['4kilo', '5kilo', '6kilo']
        });
        
        res.status(201).json({ success: true, data: product });
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE product (vendor only)
router.put('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        res.json({ success: true, data: product });
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE product (vendor only)
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        res.json({ success: true, message: 'Product deleted' });
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;