const mongoose = require('mongoose');

const groupOrderSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    productPrice: {
        type: Number,
        required: true
    },
    productImage: {
        type: String
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
    },
    campus: {
        type: String,
        enum: ['4kilo', '5kilo', '6kilo'],
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    creatorName: {
        type: String
    },
    targetMembers: {
        type: Number,
        required: true,
        min: 5,
        max: 20
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        userName: String,
        userDorm: String,
        quantity: {
            type: Number,
            default: 1
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        hasPaid: {
            type: Boolean,
            default: false
        }
    }],
    status: {
        type: String,
        enum: ['open', 'completed', 'expired', 'cancelled'],
        default: 'open'
    },
    expiresAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate random 6-character code
groupOrderSchema.statics.generateCode = function() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Calculate discount based on current members
groupOrderSchema.methods.getCurrentDiscount = function() {
    const memberCount = this.participants.length;
    if (memberCount >= 8) return { discount: 30, freeDelivery: true };
    if (memberCount >= 7) return { discount: 25, freeDelivery: false };
    if (memberCount >= 6) return { discount: 20, freeDelivery: false };
    if (memberCount >= 5) return { discount: 15, freeDelivery: false };
    return { discount: 0, freeDelivery: false };
};

const GroupOrder = mongoose.model('GroupOrder', groupOrderSchema);
module.exports = GroupOrder;