const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        maxlength: 500
    },
    images: [{
        type: String,
        default: []
    }],
    helpful: {
        count: { type: Number, default: 0 },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },
    vendorReply: {
        comment: { type: String, default: '' },
        repliedAt: { type: Date },
        repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

reviewSchema.index({ product: 1, user: 1, order: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;