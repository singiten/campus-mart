const express = require('express');
const router = express.Router();
const Campus = require('../models/Campus');

// GET all campuses
router.get('/', async (req, res) => {
    try {
        const campuses = await Campus.find({ isActive: true });
        res.json({
            success: true,
            data: campuses
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET single campus
router.get('/:name', async (req, res) => {
    try {
        const campus = await Campus.findOne({ name: req.params.name });
        if (!campus) {
            return res.status(404).json({ success: false, message: 'Campus not found' });
        }
        res.json({ success: true, data: campus });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;