require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Vendor = require('./models/Vendor');

async function createVendorProfile() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');

        // Check if vendor user exists
        let user = await User.findOne({ email: 'vendor@test.com' });
        
        if (!user) {
            // Create user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('vendor123', salt);
            
            user = await User.create({
                name: 'Test Vendor',
                email: 'vendor@test.com',
                password: hashedPassword,
                role: 'vendor',
                campus: '4kilo',
                phone: '0912345678'
            });
            console.log('✅ Vendor user created:', user.email);
        } else {
            console.log('✅ Vendor user already exists:', user.email);
            
            // If user exists but role is not vendor, update it
            if (user.role !== 'vendor') {
                user.role = 'vendor';
                await user.save();
                console.log('✅ User role updated to vendor');
            }
        }

        // Check if vendor profile exists
        let vendor = await Vendor.findOne({ user: user._id });
        
        if (!vendor) {
            vendor = await Vendor.create({
                user: user._id,
                businessName: 'Campus Snacks Store',
                description: 'Best snacks and essentials for students',
                campuses: ['4kilo', '5kilo', '6kilo'],
                isActive: true,
                groupDiscounts: {
                    discount5: 15,
                    discount6: 20,
                    discount7: 25,
                    discount8: 30,
                    freeDeliveryFrom: 8
                }
            });
            console.log('✅ Vendor profile created:', vendor.businessName);
        } else {
            console.log('✅ Vendor profile already exists:', vendor.businessName);
        }

        console.log('\n📋 Vendor Login Credentials:');
        console.log('   Email: vendor@test.com');
        console.log('   Password: vendor123');
        console.log('\n🎉 You can now login and access the Vendor Dashboard!');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createVendorProfile();