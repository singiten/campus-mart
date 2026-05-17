const mongoose = require('mongoose');

const campusSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: ['4kilo', '5kilo', '6kilo'],
        unique: true
    },
    displayName: {
        type: String,
        required: true
    },
    deliveryFee: {
        type: Number,
        required: true
    },
    // Available dorms in this campus
    dorms: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Campus = mongoose.model('Campus', campusSchema);
module.exports = Campus;