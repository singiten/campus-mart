const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Order = require('../models/Order');
const Campus = require('../models/Campus');
const { protect } = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

router.use(protect, isAdmin);

// ========== DASHBOARD STATS ==========
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalVendors = await Vendor.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        
        const revenueResult = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;
        
        const recentOrders = await Order.find()
            .sort('-createdAt')
            .limit(5)
            .populate('user', 'name email');
        
        // Orders needing assignment
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        
        res.json({
            success: true,
            data: {
                totalUsers,
                totalVendors,
                totalProducts,
                totalOrders,
                totalRevenue,
                pendingOrders,
                recentOrders
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== ANALYTICS ENDPOINTS ==========

// Get analytics data
router.get('/analytics', async (req, res) => {
    try {
        // 1. Revenue over time (last 7 days)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 1);
            
            const revenueResult = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: date, $lt: nextDate },
                        status: 'delivered'
                    }
                },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]);
            
            const orderCount = await Order.countDocuments({ 
                createdAt: { $gte: date, $lt: nextDate }
            });
            
            last7Days.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                revenue: revenueResult[0]?.total || 0,
                orders: orderCount
            });
        }
        
        // 2. Top selling products
        const topProducts = await Order.aggregate([
            { $unwind: "$items" },
            { $group: { 
                _id: "$items.product", 
                name: { $first: "$items.name" },
                totalSold: { $sum: "$items.quantity" },
                revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
            }},
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);
        
        // 3. Orders by campus
        const ordersByCampus = await Order.aggregate([
            { $group: { _id: "$campus", count: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } }
        ]);
        
        // 4. Order status distribution
        const orderStatus = await Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        
        // 5. User growth (last 7 days)
        const userGrowth = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 1);
            
            const users = await User.countDocuments({
                createdAt: { $gte: date, $lt: nextDate }
            });
            
            userGrowth.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                users: users
            });
        }
        
        // 6. Category distribution
        const categoryStats = await Product.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);
        
        // 7. Vendor performance
        const topVendors = await Vendor.aggregate([
            { $lookup: { from: 'products', localField: '_id', foreignField: 'vendor', as: 'products' } },
            { $project: { 
                businessName: 1, 
                productCount: { $size: "$products" }, 
                rating: { $ifNull: ["$rating", 0] } 
            }},
            { $sort: { rating: -1 } },
            { $limit: 5 }
        ]);
        
        console.log('User growth data:', userGrowth);
        
        res.json({
            success: true,
            data: {
                revenueTrend: last7Days,
                topProducts,
                ordersByCampus,
                orderStatus,
                userGrowth,
                categoryStats,
                topVendors
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== USER MANAGEMENT ==========
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().sort('-createdAt');
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE user role - Auto creates/deletes vendor profile
router.put('/users/:userId/role', async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const oldRole = user.role;
        
        // Update user role
        user.role = role;
        await user.save();
        
        // If promoting to vendor, create vendor profile automatically
        if (role === 'vendor' && oldRole !== 'vendor') {
            const existingVendor = await Vendor.findOne({ user: user._id });
            if (!existingVendor) {
                await Vendor.create({
                    user: user._id,
                    businessName: `${user.name}'s Store`,
                    description: 'Vendor store',
                    campuses: user.campus ? [user.campus] : ['4kilo', '5kilo', '6kilo'],
                    isActive: true
                });
                console.log(`✅ Vendor profile created for ${user.name}`);
            }
        }
        
        // If removing vendor role, delete vendor profile
        if (oldRole === 'vendor' && role !== 'vendor') {
            await Vendor.findOneAndDelete({ user: user._id });
            console.log(`🗑️ Vendor profile deleted for ${user.name}`);
        }
        
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/users/:userId', async (req, res) => {
    try {
        // Delete associated vendor profile if exists
        await Vendor.findOneAndDelete({ user: req.params.userId });
        await User.findByIdAndDelete(req.params.userId);
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== VENDOR MANAGEMENT ==========
router.get('/vendors', async (req, res) => {
    try {
        const vendors = await Vendor.find().populate('user', 'name email phone');
        res.json({ success: true, data: vendors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// CREATE vendor (admin only - after external registration)
router.post('/vendors', async (req, res) => {
    try {
        const { 
            userId, 
            businessName, 
            description, 
            campus, 
            availabilityType,
            partTimeHours,
            phone
        } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const existingVendor = await Vendor.findOne({ user: userId });
        if (existingVendor) {
            return res.status(400).json({ success: false, message: 'User already has a vendor profile' });
        }
        
        // Only update phone if provided
        if (phone && phone.trim()) {
            user.phone = phone;
        }
        user.role = 'vendor';
        await user.save();
        
        const vendorData = {
            user: userId,
            businessName,
            description: description || '',
            campus,
            availability: {
                type: availabilityType,
                isCurrentlyActive: true
            }
        };
        
        if (availabilityType === 'part-time' && partTimeHours) {
            vendorData.availability.partTimeHours = {
                days: partTimeHours,
                isCustomSchedule: true
            };
        }
        
        const vendor = await Vendor.create(vendorData);
        
        res.status(201).json({ success: true, data: vendor });
    } catch (error) {
        console.error('Create vendor error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/vendors/:vendorId/status', async (req, res) => {
    try {
        const { isActive } = req.body;
        const vendor = await Vendor.findByIdAndUpdate(
            req.params.vendorId,
            { isActive },
            { new: true }
        );
        res.json({ success: true, data: vendor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/vendors/:vendorId/availability', async (req, res) => {
    try {
        const { isCurrentlyActive } = req.body;
        const vendor = await Vendor.findByIdAndUpdate(
            req.params.vendorId,
            { 'availability.isCurrentlyActive': isCurrentlyActive },
            { new: true }
        );
        res.json({ success: true, data: vendor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== ORDER MANAGEMENT & ASSIGNMENT ==========
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email phone')
            .populate('items.product', 'name')
            .populate('assignedVendor', 'businessName')
            .sort('-createdAt');
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get unassigned orders (pending)
router.get('/orders/unassigned', async (req, res) => {
    try {
        const orders = await Order.find({ status: 'pending' })
            .populate('user', 'name email phone dorm')
            .populate('items.product', 'name price');
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get available vendors for assignment (based on campus and availability)
router.get('/vendors/available/:campus', async (req, res) => {
    try {
        const vendors = await Vendor.find({
            campus: req.params.campus,
            isActive: true,
            'availability.isCurrentlyActive': true
        }).populate('user', 'name phone');
        
        // Filter by current availability (full-time vs part-time hours)
        const availableVendors = vendors.filter(v => v.isAvailableNow());
        
        res.json({ success: true, data: availableVendors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Assign order to vendor
router.put('/orders/:orderId/assign', async (req, res) => {
    try {
        const { vendorId } = req.body;
        
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        if (order.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Order already assigned or processed' });
        }
        
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }
        
        order.assignedVendor = vendorId;
        order.assignedAt = Date.now();
        order.status = 'assigned';
        await order.save();
        
        // Add to vendor's assigned orders
        vendor.assignedOrders.push(order._id);
        await vendor.save();
        
        res.json({ success: true, message: 'Order assigned to vendor', data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update order delivery status
router.put('/orders/:orderId/delivery-status', async (req, res) => {
    try {
        const { status } = req.body; // picked_up, in_transit, delivered
        const order = await Order.findById(req.params.orderId);
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        if (status === 'picked_up') {
            order.pickedUpAt = Date.now();
        } else if (status === 'delivered') {
            order.deliveredAt = Date.now();
            
            // Update vendor statistics
            if (order.assignedVendor) {
                await Vendor.findByIdAndUpdate(order.assignedVendor, {
                    $inc: { completedDeliveries: 1, totalEarnings: order.deliveryFee }
                });
            }
        }
        
        order.status = status;
        order.updatedAt = Date.now();
        await order.save();
        
        res.json({ success: true, message: `Order status updated to ${status}`, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== PRODUCT MANAGEMENT ==========
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find().populate('vendor', 'businessName');
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/products', async (req, res) => {
    try {
        const { name, description, category, subcategory, price, stock, imageUrl, vendorId, availableCampuses } = req.body;
        
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ success: false, message: 'Vendor not found' });
        }
        
        const product = await Product.create({
            name,
            description: description || '',
            category,
            subcategory,
            price: parseFloat(price),
            stock: parseInt(stock),
            imageUrl: imageUrl || 'https://picsum.photos/id/26/200/200',
            availableCampuses: availableCampuses || [vendor.campus],
            vendor: vendorId,
            isAvailable: true
        });
        
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        console.error('Admin create product error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/products/:productId', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.productId,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/products/:productId', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.productId);
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== CAMPUS MANAGEMENT ==========
router.get('/campuses', async (req, res) => {
    try {
        const campuses = await Campus.find();
        res.json({ success: true, data: campuses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/campuses/:campusId/fee', async (req, res) => {
    try {
        const { deliveryFee } = req.body;
        const campus = await Campus.findByIdAndUpdate(
            req.params.campusId,
            { deliveryFee },
            { new: true }
        );
        res.json({ success: true, data: campus });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;