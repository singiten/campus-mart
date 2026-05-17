const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Your Atlas connection string - REPLACE YOUR_PASSWORD
// Replace with your actual password
const ATLAS_URI = 'mongodb+srv://ushop_user:ushop2024@bookstore-cluster.o277mg7.mongodb.net/ushop';

// Your JSON files location

const JSON_FOLDER = 'C:\\Users\\user\\Pictures\\New folder';

// Collections to import
const collections = [
    { name: 'users', file: path.join(JSON_FOLDER, 'users.json') },
    { name: 'products', file: path.join(JSON_FOLDER, 'products.json') },
    { name: 'orders', file: path.join(JSON_FOLDER, 'orders.json') },
    { name: 'vendors', file: path.join(JSON_FOLDER, 'vendors.json') },
    { name: 'reviews', file: path.join(JSON_FOLDER, 'reviews.json') },
    { name: 'wishlists', file: path.join(JSON_FOLDER, 'wishlists.json') },
    { name: 'flashsales', file: path.join(JSON_FOLDER, 'flashsales.json') },
    { name: 'grouporders', file: path.join(JSON_FOLDER, 'grouporders.json') }
];

async function importData() {
    console.log('='.repeat(50));
    console.log('   Starting Import to MongoDB Atlas');
    console.log('='.repeat(50));
    console.log();

    try {
        console.log('☁️ Connecting to MongoDB Atlas...');
        await mongoose.connect(ATLAS_URI);
        console.log('✅ Connected successfully!\n');

        for (const collection of collections) {
            console.log(`📋 Processing: ${collection.name}...`);
            
            // Check if file exists
            if (!fs.existsSync(collection.file)) {
                console.log(`   ❌ File not found: ${collection.file}`);
                continue;
            }
            
            // Read and parse JSON file
            const data = fs.readFileSync(collection.file, 'utf8');
            let documents;
            
            try {
                documents = JSON.parse(data);
            } catch (e) {
                console.log(`   ❌ Invalid JSON format: ${e.message}`);
                continue;
            }
            
            if (!documents || documents.length === 0) {
                console.log(`   ⚠️ No documents found in file`);
                continue;
            }
            
            console.log(`   📄 Found ${documents.length} documents`);
            
            // Get collection
            const dbCollection = mongoose.connection.db.collection(collection.name);
            
            // Clear existing data
            const deleteResult = await dbCollection.deleteMany({});
            console.log(`   🗑️ Cleared ${deleteResult.deletedCount} existing documents`);
            
            // Insert new documents in batches of 100
            const batchSize = 100;
            let inserted = 0;
            
            for (let i = 0; i < documents.length; i += batchSize) {
                const batch = documents.slice(i, i + batchSize);
                const result = await dbCollection.insertMany(batch);
                inserted += result.insertedCount;
                console.log(`   📥 Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}`);
            }
            
            console.log(`   ✅ Successfully imported ${inserted} documents to ${collection.name}`);
            console.log();
        }
        
        console.log('='.repeat(50));
        console.log('   🎉 IMPORT COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(50));
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        if (error.message.includes('Authentication failed')) {
            console.log('\n💡 Tip: Check your Atlas username and password in the ATLAS_URI');
        }
        if (error.message.includes('ENOTFOUND')) {
            console.log('\n💡 Tip: Check your internet connection and Atlas cluster name');
        }
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from database');
        process.exit(0);
    }
}

// Run the import
importData();