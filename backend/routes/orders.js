const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Create new order
router.post('/', protect, async (req, res) => {
    try {
        const { items, campus, dorm, roomNumber, phone, paymentMethod } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }
        
        const deliveryFees = { '4kilo': 10, '5kilo': 15, '6kilo': 20 };
        const deliveryFee = deliveryFees[campus] || 10;
        
        let subtotal = 0;
        const orderItems = [];
        
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
            }
            
            if (product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
            }
            
            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;
            
            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity
            });
            
            product.stock -= item.quantity;
            await product.save();
        }
        
        const totalAmount = subtotal + deliveryFee;
        
        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            subtotal,
            deliveryFee,
            totalAmount,
            campus,
            dorm,
            roomNumber,
            phone,
            paymentMethod,
            status: 'pending',
            paymentStatus: 'pending'
        });
        
        const pointsEarned = Math.floor(totalAmount / 10);
        req.user.points = (req.user.points || 0) + pointsEarned;
        await req.user.save();
        
        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'name email phone');
        
        // Emit socket event for new order
        const io = req.app.get('io');
        if (io) {
            io.emit('new-order', { orderId: order._id, order: populatedOrder });
        }
        
        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            data: populatedOrder,
            pointsEarned
        });
        
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update order status (with socket emit)
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id).populate('user', 'name email phone');
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        const oldStatus = order.status;
        order.status = status;
        order.updatedAt = Date.now();
        await order.save();
        
        // Emit real-time update via socket
        const io = req.app.get('io');
        if (io) {
            // Notify the specific order room
            io.to(`order-${order._id}`).emit('order-status-update', {
                orderId: order._id,
                oldStatus,
                newStatus: status,
                timestamp: new Date().toISOString(),
                order: {
                    _id: order._id,
                    status: order.status,
                    updatedAt: order.updatedAt
                }
            });
            
            // Send push notification to user
            const statusMessages = {
                confirmed: '✅ Your order has been confirmed!',
                preparing: '🍳 Your order is being prepared!',
                ready: '🛵 Your order is ready for delivery!',
                delivered: '📦 Your order has been delivered! Enjoy!',
                cancelled: '❌ Your order has been cancelled.'
            };
            
            if (statusMessages[status]) {
                io.to(`user-${order.user._id}`).emit('notification', {
                    title: 'Order Update',
                    message: statusMessages[status],
                    orderId: order._id,
                    status: status,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        res.json({ success: true, message: `Order status updated to ${status}`, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get user's orders (with socket registration)
router.get('/my-orders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
        
        // Emit that user is online for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${req.user._id}`).emit('user-online', { userId: req.user._id });
        }
        
        res.json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;