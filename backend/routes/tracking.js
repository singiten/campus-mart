const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const { protect } = require('../middleware/auth');

// Vendor: Update location (called periodically)
router.post('/vendor/location', protect, async (req, res) => {
    try {
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ success: false, message: 'Only vendors can update location' });
        }
        
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }
        
        const { lat, lng } = req.body;
        
        vendor.currentLocation = {
            lat,
            lng,
            updatedAt: new Date()
        };
        await vendor.save();
        
        // If vendor has an active assignment, update order location too
        if (vendor.currentAssignment) {
            const order = await Order.findById(vendor.currentAssignment);
            if (order && order.status !== 'delivered') {
                order.vendorLocation = { lat, lng, updatedAt: new Date() };
                await order.save();
                
                // Emit real-time update to student
                const io = req.app.get('io');
                if (io) {
                    io.to(`order-${order._id}`).emit('vendor-location-update', {
                        lat,
                        lng,
                        updatedAt: new Date()
                    });
                }
            }
        }
        
        res.json({ success: true, message: 'Location updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Vendor: Accept assignment
router.post('/orders/:orderId/accept', protect, async (req, res) => {
    try {
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ success: false, message: 'Only vendors can accept orders' });
        }
        
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }
        
        const order = await Order.findById(req.params.orderId).populate('user', 'name phone');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        if (order.assignedVendor.toString() !== vendor._id.toString()) {
            return res.status(403).json({ success: false, message: 'This order is not assigned to you' });
        }
        
        if (order.vendorAccepted) {
            return res.status(400).json({ success: false, message: 'Order already accepted' });
        }
        
        order.vendorAccepted = true;
        order.acceptedAt = new Date();
        order.vendorPhone = vendor.user?.phone || vendor.phone;
        order.status = 'assigned';
        await order.save();
        
        vendor.currentAssignment = order._id;
        vendor.isOnline = true;
        await vendor.save();
        
        // Notify student
        const io = req.app.get('io');
        if (io) {
            io.to(`order-${order._id}`).emit('vendor-accepted', {
                vendorName: vendor.businessName,
                vendorPhone: order.vendorPhone,
                message: 'A vendor has accepted your order and will start delivery soon!'
            });
        }
        
        res.json({
            success: true,
            message: 'Order accepted successfully',
            data: {
                orderId: order._id,
                vendorPhone: order.vendorPhone,
                status: order.status
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Vendor: Reject assignment
router.post('/orders/:orderId/reject', protect, async (req, res) => {
    try {
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ success: false, message: 'Only vendors can reject orders' });
        }
        
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }
        
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        if (order.assignedVendor.toString() !== vendor._id.toString()) {
            return res.status(403).json({ success: false, message: 'This order is not assigned to you' });
        }
        
        order.cancelledByVendor = true;
        order.cancellationReason = req.body.reason || 'Vendor rejected assignment';
        order.status = 'pending';
        order.assignedVendor = null;
        await order.save();
        
        vendor.currentAssignment = null;
        await vendor.save();
        
        // Notify admin to reassign
        const io = req.app.get('io');
        if (io) {
            io.emit('order-needs-reassignment', { orderId: order._id });
        }
        
        res.json({ success: true, message: 'Order rejected. Admin will reassign.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Student: Get order tracking info
router.get('/orders/:orderId/tracking', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('assignedVendor', 'businessName user');
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        // Check if user owns this order
        if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        
        // Get vendor details
        let vendorData = null;
        if (order.assignedVendor && order.vendorAccepted) {
            const vendor = await Vendor.findById(order.assignedVendor._id);
            vendorData = {
                name: vendor.businessName,
                phone: order.vendorPhone,
                location: vendor.currentLocation,
                isOnline: vendor.isOnline
            };
        }
        
        res.json({
            success: true,
            data: {
                orderId: order._id,
                status: order.status,
                vendorAccepted: order.vendorAccepted,
                vendor: vendorData,
                pickedUpAt: order.pickedUpAt,
                deliveredAt: order.deliveredAt,
                vendorLocation: order.vendorLocation
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Vendor: Update delivery status
router.put('/orders/:orderId/status', protect, async (req, res) => {
    try {
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ success: false, message: 'Only vendors can update status' });
        }
        
        const { status } = req.body; // picked_up, in_transit, delivered
        const vendor = await Vendor.findOne({ user: req.user._id });
        
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        if (order.assignedVendor.toString() !== vendor._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not your order' });
        }
        
        if (status === 'picked_up') {
            order.pickedUpAt = new Date();
            order.status = 'in_transit';
        } else if (status === 'delivered') {
            order.deliveredAt = new Date();
            order.status = 'delivered';
            vendor.currentAssignment = null;
            vendor.totalEarnings += order.deliveryFee;
            await vendor.save();
        } else {
            order.status = status;
        }
        
        await order.save();
        
        // Notify student
        const io = req.app.get('io');
        if (io) {
            const statusMessages = {
                picked_up: '📦 Your order has been picked up by the vendor!',
                in_transit: '🚚 Your order is on the way!',
                delivered: '✅ Your order has been delivered! Enjoy!'
            };
            
            if (statusMessages[status]) {
                io.to(`order-${order._id}`).emit('order-status-update', {
                    orderId: order._id,
                    status: order.status,
                    message: statusMessages[status],
                    timestamp: new Date()
                });
            }
        }
        
        res.json({ success: true, message: `Order status updated to ${status}`, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Admin: Get available vendors for assignment
router.get('/vendors/available/:campus', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        
        const vendors = await Vendor.find({
            campus: req.params.campus,
            isActive: true,
            isOnline: true,
            currentAssignment: null
        }).populate('user', 'name phone');
        
        res.json({ success: true, data: vendors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;