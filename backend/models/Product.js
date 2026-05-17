const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        required: true,
        enum: ['electronics', 'stationery', 'food', 'personalCare', 'dormEssentials', 'health']
    },
    subcategory: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    bulkPricing: [{
        minQuantity: Number,
        price: Number
    }],
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    imageUrl: {
        type: String,
        default: 'https://picsum.photos/id/26/200/200'
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    availableCampuses: [{
        type: String,
        enum: ['4kilo', '5kilo', '6kilo']
    }],
    isAvailable: {
        type: Boolean,
        default: true
    },
    averageRating: {
        type: Number,
        default: 0
    },
    numberOfReviews: {
        type: Number,
        default: 0
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

const Product = mongoose.model('Product', productSchema);
module.exports = Product;