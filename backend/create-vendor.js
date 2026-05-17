require('dotenv').config();
const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');

async function createVendor() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        // Check if any vendor exists
        const existingVendor = await Vendor.findOne();
        if (existingVendor) {
            console.log(`⚠️ Vendor already exists: ${existingVendor.businessName}`);
            process.exit(0);
        }
        
        // Create vendor with a placeholder user ID (using a dummy ObjectId)
        const dummyUserId = new mongoose.Types.ObjectId();
        
        const vendor = await Vendor.create({
            user: dummyUserId,
            businessName: "Campus Snacks Hub",
            description: "Best snacks, electronics, and essentials for students",
            campus: "4kilo",
            isActive: true,
            availability: {
                type: "full-time",
                isCurrentlyActive: true
            },
            completedDeliveries: 0,
            totalEarnings: 0
        });
        
        console.log('✅ Vendor created successfully!');
        console.log(`   Business Name: ${vendor.businessName}`);
        console.log(`   Vendor ID: ${vendor._id}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createVendor();