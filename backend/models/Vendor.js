const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    businessName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    // Which campus this vendor serves
    campus: {
        type: String,
        enum: ['4kilo', '5kilo', '6kilo','ALL'],
        required: true
    },
    // Availability settings
    availability: {
        type: {
            type: String,
            enum: ['full-time', 'part-time'],
            default: 'full-time'
        },
        partTimeHours: {
            days: [{
                day: {
                    type: String,
                    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                },
                startTime: String,
                endTime: String
            }],
            isCustomSchedule: { type: Boolean, default: false }
        },
        isCurrentlyActive: {
            type: Boolean,
            default: true
        }
    },
    // Delivery statistics
    assignedOrders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    completedDeliveries: {
        type: Number,
        default: 0
    },
    totalEarnings: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalRatings: {
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
    },
    // Add these fields to vendorSchema
isOnline: {
    type: Boolean,
    default: false
},
currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date }
},
currentAssignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
},
totalEarnings: {
    type: Number,
    default: 0
},
rating: {
    type: Number,
    default: 5
},
// Add to vendorSchema
isOnline: {
    type: Boolean,
    default: false
},
currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date }
},
isSharingLocation: {
    type: Boolean,
    default: false
}
});

// Method to check if vendor is available at given time
vendorSchema.methods.isAvailableNow = function() {
    if (!this.isActive || !this.availability.isCurrentlyActive) return false;
    
    if (this.availability.type === 'full-time') return true;
    
    // Part-time: check current day and time against schedule
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    const schedule = this.availability.partTimeHours.days.find(d => d.day === currentDay);
    if (!schedule) return false;
    
    return currentTime >= schedule.startTime && currentTime <= schedule.endTime;
};

const Vendor = mongoose.model('Vendor', vendorSchema);
module.exports = Vendor;