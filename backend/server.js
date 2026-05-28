require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const campusRoutes = require('./routes/campuses');
const vendorRoutes = require('./routes/vendor');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const groupOrderRoutes = require('./routes/groupOrders');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');
const wishlistRoutes = require('./routes/wishlist');
const flashSaleRoutes = require('./routes/flashSales');


const trackingRoutes = require('./routes/tracking');

const app = express();
const server = http.createServer(app);

// Socket.io with Render compatibility
const io = socketIO(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']  // Important for Render
});

app.set('io', io);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully!'))
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campuses', campusRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/group-orders', groupOrderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/flash-sales', flashSaleRoutes);


app.use('/api/tracking', trackingRoutes);

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Welcome endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to U-Shop API!',
        status: 'Server is running ✅',
        environment: process.env.NODE_ENV || 'development'
    });
});

// ========== SOCKET.IO HANDLING ==========
const connectedUsers = new Map();
const roomParticipants = new Map();

io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    socket.on('register-user', (userId) => {
        connectedUsers.set(userId, socket.id);
        console.log(`👤 User ${userId} registered`);
        socket.broadcast.emit('user-online', userId);
    });

    socket.on('join-order-room', (orderId) => {
        socket.join(`order-${orderId}`);
        console.log(`📦 Socket ${socket.id} joined order-${orderId}`);
    });

    socket.on('leave-order-room', (orderId) => {
        socket.leave(`order-${orderId}`);
        console.log(`🚪 Socket ${socket.id} left order-${orderId}`);
    });

    socket.on('vendor-share-location', async (data) => {
        const { vendorId, lat, lng, orderId } = data;
        console.log(`📍 Vendor ${vendorId} sharing location for order ${orderId}`);
        
        io.to(`order-${orderId}`).emit('vendor-location-update', {
            lat, lng, timestamp: new Date(), orderId
        });
    });

    socket.on('vendor-stop-sharing', (data) => {
        const { orderId } = data;
        io.to(`order-${orderId}`).emit('vendor-location-stopped');
    });

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
        for (const [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
                break;
            }
        }
    });
});

// Start server
const PORT = process.env.PORT || 8003;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.io server ready`);
});