const mongoose = require('mongoose');

const flashSaleSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 1,
        max: 90
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    maxQuantity: {
        type: Number,
        default: 50
    },
    soldQuantity: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Check if flash sale is currently active
flashSaleSchema.methods.isCurrentlyActive = function() {
    const now = new Date();
    return this.isActive && now >= this.startTime && now <= this.endTime && this.soldQuantity < this.maxQuantity;
};

// Get discounted price
flashSaleSchema.methods.getDiscountedPrice = function(originalPrice) {
    const discount = (originalPrice * this.discountPercentage) / 100;
    return originalPrice - discount;
};

const FlashSale = mongoose.model('FlashSale', flashSaleSchema);
module.exports = FlashSale;