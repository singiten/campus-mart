const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

async function updateImage() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const result = await Product.updateOne(
        { name: 'Hand Sanitizer' },
        { imageUrl: 'https://cdn-icons-png.flaticon.com/512/2907/2907956.png' }
    );
    
    console.log('Updated:', result.modifiedCount, 'document(s)');
    process.exit();
}

updateImage();