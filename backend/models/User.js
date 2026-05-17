const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['student', 'vendor', 'admin'],
        default: 'student'
    },
    campus: {
        type: String,
        enum: ['4kilo', '5kilo', '6kilo']
    },
    dorm: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                // Only validate if phone number is provided
                if (!v) return true;
                return /^09[0-9]{8}$/.test(v);
            },
            message: 'Phone must start with 09 and be exactly 10 digits long'
        }
    },
    points: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;