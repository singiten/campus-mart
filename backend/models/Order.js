const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: String,
        price: Number,
        quantity: Number
    }],
    subtotal: {
        type: Number,
        required: true
    },
    deliveryFee: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    campus: {
        type: String,
        enum: ['4kilo', '5kilo', '6kilo'],
        required: true
    },
    dorm: {
        type: String,
        required: true
    },
    roomNumber: {
        type: String
    },
    phone: { 
        type: String,  // Changed from Number to String to preserve leading zero
        required: true,
        validate: {
            validator: function(v) {
                return /^09\d{8}$/.test(v);  // Validates: starts with 09 and total 10 digits
            },
            message: props => `${props.value} is not a valid phone number! Phone must start with 09 and be exactly 10 digits long.`
        },
        default: '09' + '0'.repeat(8)  // Default value: "09" followed by 8 zeros = "0900000000"
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'telebirr'],
        default: 'cash'
    },
    status: {
        type: String,
        enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },
    // Delivery assignment
    assignedVendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
    },
    assignedAt: {
        type: Date
    },
    pickedUpAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    isGroupOrder: {
        type: Boolean,
        default: false
    },
    groupOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GroupOrder'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    // Add these fields inside the orderSchema
assignedVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
},
assignedAt: {
    type: Date
},
acceptedAt: {
    type: Date
},
pickedUpAt: {
    type: Date
},
deliveredAt: {
    type: Date
},
vendorLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date }
},
vendorPhone: {
    type: String
},
vendorAccepted: {
    type: Boolean,
    default: false
},
cancelledByVendor: {
    type: Boolean,
    default: false
},
cancellationReason: {
    type: String
}
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;