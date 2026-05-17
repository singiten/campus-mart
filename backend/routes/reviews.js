const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/reviews/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
    try {
        const { sort = 'newest', rating } = req.query;
        let query = { product: req.params.productId };
        
        if (rating && rating !== 'all') {
            query.rating = parseInt(rating);
        }
        
        let sortOption = {};
        switch (sort) {
            case 'newest':
                sortOption = { createdAt: -1 };
                break;
            case 'oldest':
                sortOption = { createdAt: 1 };
                break;
            case 'highest':
                sortOption = { rating: -1 };
                break;
            case 'lowest':
                sortOption = { rating: 1 };
                break;
            case 'helpful':
                sortOption = { 'helpful.count': -1 };
                break;
            default:
                sortOption = { createdAt: -1 };
        }
        
        const reviews = await Review.find(query)
            .populate('user', 'name')
            .sort(sortOption);
        
        const total = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = reviews.length > 0 ? total / reviews.length : 0;
        
        const ratingBreakdown = {
            5: reviews.filter(r => r.rating === 5).length,
            4: reviews.filter(r => r.rating === 4).length,
            3: reviews.filter(r => r.rating === 3).length,
            2: reviews.filter(r => r.rating === 2).length,
            1: reviews.filter(r => r.rating === 1).length
        };
        
        res.json({
            success: true,
            data: reviews,
            averageRating,
            totalReviews: reviews.length,
            ratingBreakdown
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Check if user can review a product
router.get('/can-review/:productId', protect, async (req, res) => {
    try {
        const { productId } = req.params;
        
        const order = await Order.findOne({
            user: req.user._id,
            status: 'delivered',
            'items.product': productId
        });
        
        if (!order) {
            return res.json({ success: true, canReview: false, message: 'No delivered order found' });
        }
        
        const existingReview = await Review.findOne({
            product: productId,
            user: req.user._id,
            order: order._id
        });
        
        res.json({
            success: true,
            canReview: !existingReview,
            orderId: order._id,
            alreadyReviewed: !!existingReview
        });
    } catch (error) {
        console.error('Can review error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add review with images
router.post('/', protect, upload.array('images', 5), async (req, res) => {
    try {
        const { productId, orderId, rating, comment } = req.body;
        
        const order = await Order.findOne({
            _id: orderId,
            user: req.user._id,
            status: 'delivered',
            'items.product': productId
        });
        
        if (!order) {
            return res.status(403).json({
                success: false,
                message: 'You can only review products you have purchased and received'
            });
        }
        
        const existingReview = await Review.findOne({
            product: productId,
            user: req.user._id,
            order: orderId
        });
        
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product'
            });
        }
        
        const images = req.files ? req.files.map(f => `/uploads/reviews/${f.filename}`) : [];
        
        const review = await Review.create({
            product: productId,
            user: req.user._id,
            order: orderId,
            rating: parseInt(rating),
            comment,
            images,
            isVerifiedPurchase: true,
            helpful: { count: 0, users: [] }
        });
        
        const allReviews = await Review.find({ product: productId });
        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / allReviews.length;
        
        await Product.findByIdAndUpdate(productId, {
            averageRating,
            numberOfReviews: allReviews.length
        });
        
        const populatedReview = await Review.findById(review._id)
            .populate('user', 'name');
        
        res.status(201).json({
            success: true,
            message: 'Review added successfully!',
            data: populatedReview
        });
    } catch (error) {
        console.error('Review creation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mark review as helpful
router.post('/:reviewId/helpful', protect, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        
        const alreadyVoted = review.helpful.users.includes(req.user._id);
        
        if (alreadyVoted) {
            return res.status(400).json({ success: false, message: 'You already marked this as helpful' });
        }
        
        review.helpful.count += 1;
        review.helpful.users.push(req.user._id);
        await review.save();
        
        res.json({ success: true, message: 'Thanks for your feedback!', helpfulCount: review.helpful.count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Admin only reply to reviews
router.post('/:reviewId/reply', protect, async (req, res) => {
    try {
        const { comment } = req.body;
        
        // Only admin can reply to reviews
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only admin can reply to reviews' });
        }
        
        const review = await Review.findById(req.params.reviewId);
        
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        
        review.vendorReply = {
            comment,
            repliedAt: new Date(),
            repliedBy: req.user._id
        };
        
        await review.save();
        
        const populatedReview = await Review.findById(review._id)
            .populate('user', 'name')
            .populate('vendorReply.repliedBy', 'name');
        
        res.json({ success: true, message: 'Reply added!', data: populatedReview });
    } catch (error) {
        console.error('Reply error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete review
router.delete('/:reviewId', protect, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        
        if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        await review.deleteOne();
        
        const allReviews = await Review.find({ product: review.product });
        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
        
        await Product.findByIdAndUpdate(review.product, {
            averageRating,
            numberOfReviews: allReviews.length
        });
        
        res.json({ success: true, message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;