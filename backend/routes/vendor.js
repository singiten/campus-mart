const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// Get vendor profile
router.get('/profile', protect, async (req, res) => {
    try {
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ success: false, message: 'Not a vendor account' });
        }
        
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor profile not found' });
        }
        
        res.json({ success: true, data: vendor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get assigned orders (only orders assigned to this vendor)
router.get('/orders', protect, async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }
        
        const orders = await Order.find({ assignedVendor: vendor._id })
            .populate('user', 'name phone dorm')
            .populate('items.product', 'name price')
            .sort('-createdAt');
        
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Get vendor orders error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single order details
router.get('/orders/:orderId', protect, async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }
        
        const order = await Order.findOne({ 
            _id: req.params.orderId, 
            assignedVendor: vendor._id 
        }).populate('user', 'name phone dorm roomNumber');
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update delivery status (vendor can update pickup and delivery)
router.put('/orders/:orderId/delivery-status', protect, async (req, res) => {
    try {
        const { status } = req.body; // picked_up, in_transit, delivered
        
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }
        
        const order = await Order.findOne({ 
            _id: req.params.orderId, 
            assignedVendor: vendor._id 
        });
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        // Validate status transition
        const validTransitions = {
            'assigned': ['picked_up'],
            'picked_up': ['in_transit'],
            'in_transit': ['delivered']
        };
        
        if (!validTransitions[order.status]?.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid status transition from ${order.status} to ${status}` 
            });
        }
        
        if (status === 'picked_up') {
            order.pickedUpAt = Date.now();
        } else if (status === 'delivered') {
            order.deliveredAt = Date.now();
            
            // Update vendor statistics
            vendor.completedDeliveries += 1;
            vendor.totalEarnings += order.deliveryFee;
            await vendor.save();
        }
        
        order.status = status;
        order.updatedAt = Date.now();
        await order.save();
        
        res.json({ success: true, message: `Delivery status updated to ${status}`, data: order });
    } catch (error) {
        console.error('Update delivery status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get vendor statistics
router.get('/stats', protect, async (req, res) => {
    try {
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }
        
        const totalAssigned = await Order.countDocuments({ assignedVendor: vendor._id });
        const completedDeliveries = vendor.completedDeliveries;
        const totalEarnings = vendor.totalEarnings;
        
        // Get current assigned order count
        const currentAssigned = await Order.countDocuments({
            assignedVendor: vendor._id,
            status: { $in: ['assigned', 'picked_up', 'in_transit'] }
        });
        
        res.json({
            success: true,
            data: {
                totalAssigned,
                completedDeliveries,
                totalEarnings,
                currentAssigned,
                isActive: vendor.availability.isCurrentlyActive,
                campus: vendor.campus
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Toggle vendor availability
router.put('/availability', protect, async (req, res) => {
    try {
        const { isCurrentlyActive } = req.body;
        
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }
        
        vendor.availability.isCurrentlyActive = isCurrentlyActive;
        await vendor.save();
        
        res.json({ 
            success: true, 
            message: `You are now ${isCurrentlyActive ? 'available' : 'unavailable'} for deliveries`,
            data: vendor 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;