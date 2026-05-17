import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Homepage from './pages/Homepage';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminAnalytics from './pages/AdminAnalytics';
import GroupOrders from './pages/GroupOrders';
import GroupOrderDetail from './pages/GroupOrderDetail';
import Wishlist from './pages/Wishlist';
import VendorDeliveryDashboard from './components/VendorDeliveryDashboard';

// Component to apply theme to body
const ThemeApplicator = () => {
    const { theme } = useTheme();
    
    useEffect(() => {
        // Apply theme colors to body
        document.body.style.backgroundColor = theme.colors.background;
        document.body.style.color = theme.colors.text;
        
        // Also apply to html
        document.documentElement.style.backgroundColor = theme.colors.background;
    }, [theme]);
    
    return null;
};

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" />;
    return children;
};

function AppRoutes() {
    const { isAuthenticated } = useAuth();
    const { theme } = useTheme();
    
    return (
        <div style={{ 
            backgroundColor: theme.colors.background, 
            color: theme.colors.text,
            minHeight: '100vh'
        }}>
            <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/products" element={<Homepage />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
                <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
                <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
                <Route path="/vendor/dashboard" element={<ProtectedRoute><VendorDeliveryDashboard /></ProtectedRoute>} />
                <Route path="/group-orders" element={<ProtectedRoute><GroupOrders /></ProtectedRoute>} />
                <Route path="/group-orders/:id" element={<GroupOrderDetail />} />
                <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
            </Routes>
            <Footer />
        </div>
    );
}

function App() {
    return (
      
        <ThemeProvider>
            <Router>
                <AuthProvider>
                    <CartProvider>
                        <ThemeApplicator />
                        <Navbar />
                        <ToastContainer position="top-right" autoClose={3000} />
                        <AppRoutes />
                    </CartProvider>
                </AuthProvider>
                
            </Router>
        </ThemeProvider>
        
    );
}

export default App;