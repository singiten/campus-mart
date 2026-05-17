require('dotenv').config();
const mongoose = require('mongoose');
const Campus = require('./models/Campus');

const campuses = [
    {
        name: '4kilo',
        displayName: '4 Kilo Campus',
        deliveryFee: 10,
        dorms: ['4 Kilo Hall A', '4 Kilo Hall B', '4 Kilo Tower', '4 Kilo Residence']
    },
    {
        name: '5kilo',
        displayName: '5 Kilo Campus',
        deliveryFee: 15,
        dorms: ['5 Kilo Hall 1', '5 Kilo Hall 2', '5 Kilo Tower', '5 Kilo Dorm']
    },
    {
        name: '6kilo',
        displayName: '6 Kilo Campus',
        deliveryFee: 20,
        dorms: ['6 Kilo Tower A', '6 Kilo Tower B', '6 Kilo Residence', '6 Kilo Hall']
    }
];

async function seedCampuses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        // Clear existing campuses
        await Campus.deleteMany();
        console.log('🗑️ Cleared existing campuses');
        
        // Insert new campuses
        const result = await Campus.insertMany(campuses);
        console.log(`✅ Added ${result.length} campuses:`);
        result.forEach(c => {
            console.log(`   - ${c.displayName}: ${c.deliveryFee} ETB delivery fee`);
            console.log(`     Dorms: ${c.dorms.join(', ')}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

seedCampuses();