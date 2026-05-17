import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import Button from '../components/Button';

const API = axios.create({
    baseURL: 'http://localhost:8003/api'
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const Checkout = () => {
    const { cartItems, getCartTotal, clearCart } = useCart();
    const { user, selectedCampus } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        dorm: '',
        roomNumber: '',
        phone: '',
        paymentMethod: 'cash'
    });

    // Use useEffect to set initial form data, not during render
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                dorm: user.dorm || '',
                phone: user.phone || ''
            }));
        }
    }, [user]);

    // Delivery fees based on campus
    const deliveryFees = {
        '4kilo': 10,
        '5kilo': 15,
        '6kilo': 20
    };
    const deliveryFee = deliveryFees[selectedCampus] || 15;
    const subtotal = getCartTotal();
    const total = subtotal + deliveryFee;

    // Redirect if cart is empty - use useEffect instead of render redirect
    useEffect(() => {
        if (cartItems.length === 0) {
            navigate('/cart');
        }
    }, [cartItems.length, navigate]);

    // Don't render anything while redirecting
    if (cartItems.length === 0) {
        return null;
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!formData.dorm) {
            toast.error('Please enter your dorm/hall name');
            return;
        }
        if (!formData.phone) {
            toast.error('Please enter your phone number');
            return;
        }
        
        setLoading(true);
        
        const orderData = {
            items: cartItems.map(item => ({
                productId: item.id,
                quantity: item.quantity
            })),
            campus: selectedCampus,
            dorm: formData.dorm,
            roomNumber: formData.roomNumber,
            phone: formData.phone,
            paymentMethod: formData.paymentMethod
        };
        
        try {
            const response = await API.post('/orders', orderData);
            
            if (response.data.success) {
                // Handle Chapa payment if selected
                if (formData.paymentMethod === 'chapa') {
                    const paymentResponse = await API.post('/payments/chapa/initialize', {
                        orderId: response.data.data._id
                    });
                    
                    if (paymentResponse.data.success) {
                        window.location.href = paymentResponse.data.data.checkout_url;
                        return;
                    }
                }
                
                toast.success(`Order placed successfully! You earned ${response.data.pointsEarned} points!`);
                clearCart();
                navigate('/orders');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error.response?.data?.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            padding: theme?.spacing?.xl || '2rem', 
            maxWidth: '1200px', 
            margin: '0 auto',
            backgroundColor: theme?.colors?.background,
            minHeight: 'calc(100vh - 200px)'
        }}>
            <h1 style={{ color: theme?.colors?.text, marginBottom: theme?.spacing?.xl || '2rem' }}>Checkout</h1>
            
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {/* Checkout Form */}
                <form onSubmit={handleSubmit} style={{ flex: 2 }}>
                    <div style={{
                        backgroundColor: theme?.colors?.surface,
                        padding: '1.5rem',
                        borderRadius: theme?.borderRadius?.lg || '12px',
                        marginBottom: '1.5rem',
                        border: `1px solid ${theme?.colors?.border}`
                    }}>
                        <h2 style={{ color: theme?.colors?.text, marginBottom: '1rem' }}>Delivery Information</h2>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ color: theme?.colors?.text, display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                Campus:
                            </label>
                            <input
                                type="text"
                                value={selectedCampus.toUpperCase()}
                                disabled
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: `1px solid ${theme?.colors?.border}`,
                                    borderRadius: theme?.borderRadius?.md || '8px',
                                    backgroundColor: theme?.colors?.background,
                                    color: theme?.colors?.textLight
                                }}
                            />
                            <small style={{ color: theme?.colors?.textLight }}>Delivery fee: {deliveryFee} ETB</small>
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ color: theme?.colors?.text, display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                Dorm/Hall Name *
                            </label>
                            <input
                                type="text"
                                name="dorm"
                                value={formData.dorm}
                                onChange={handleChange}
                                required
                                placeholder="e.g., 4 Kilo Hall A"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: `1px solid ${theme?.colors?.border}`,
                                    borderRadius: theme?.borderRadius?.md || '8px',
                                    backgroundColor: theme?.colors?.surface,
                                    color: theme?.colors?.text
                                }}
                            />
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ color: theme?.colors?.text, display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                Room Number (optional)
                            </label>
                            <input
                                type="text"
                                name="roomNumber"
                                value={formData.roomNumber}
                                onChange={handleChange}
                                placeholder="e.g., Room 201"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: `1px solid ${theme?.colors?.border}`,
                                    borderRadius: theme?.borderRadius?.md || '8px',
                                    backgroundColor: theme?.colors?.surface,
                                    color: theme?.colors?.text
                                }}
                            />
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ color: theme?.colors?.text, display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                placeholder="09xxxxxxxx"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: `1px solid ${theme?.colors?.border}`,
                                    borderRadius: theme?.borderRadius?.md || '8px',
                                    backgroundColor: theme?.colors?.surface,
                                    color: theme?.colors?.text
                                }}
                            />
                        </div>
                    </div>
                    
                    <div style={{
                        backgroundColor: theme?.colors?.surface,
                        padding: '1.5rem',
                        borderRadius: theme?.borderRadius?.lg || '12px',
                        marginBottom: '1.5rem',
                        border: `1px solid ${theme?.colors?.border}`
                    }}>
                        <h2 style={{ color: theme?.colors?.text, marginBottom: '1rem' }}>Payment Method</h2>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="cash"
                                checked={formData.paymentMethod === 'cash'}
                                onChange={handleChange}
                            />
                            <span style={{ color: theme?.colors?.text }}>💵 Cash on Delivery</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="telebirr"
                                checked={formData.paymentMethod === 'telebirr'}
                                onChange={handleChange}
                            />
                            <span style={{ color: theme?.colors?.text }}>📱 Telebirr</span>
                        </label>
                        
                    </div>
                    
                    <Button
                        type="submit"
                        variant="success"
                        size="lg"
                        fullWidth
                        disabled={loading}
                    >
                        {loading ? 'Placing Order...' : `Place Order (${total} ETB)`}
                    </Button>
                </form>
                
                {/* Order Summary */}
                <div style={{ flex: 1 }}>
                    <div style={{
                        backgroundColor: theme?.colors?.surface,
                        padding: '1.5rem',
                        borderRadius: theme?.borderRadius?.lg || '12px',
                        position: 'sticky',
                        top: '20px',
                        border: `1px solid ${theme?.colors?.border}`
                    }}>
                        <h2 style={{ color: theme?.colors?.text, marginBottom: '1rem' }}>Order Summary</h2>
                        
                        {cartItems.map(item => (
                            <div key={item.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '0.5rem',
                                padding: '0.5rem 0',
                                borderBottom: `1px solid ${theme?.colors?.border}`,
                                color: theme?.colors?.text
                            }}>
                                <span>{item.name} x {item.quantity}</span>
                                <span>{item.price * item.quantity} ETB</span>
                            </div>
                        ))}
                        
                        <div style={{ marginTop: '1rem', paddingTop: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: theme?.colors?.text }}>
                                <span>Subtotal:</span>
                                <span>{subtotal} ETB</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', color: theme?.colors?.text }}>
                                <span>Delivery Fee:</span>
                                <span>{deliveryFee} ETB</span>
                            </div>
                            <hr style={{ margin: '0.5rem 0', borderColor: theme?.colors?.border }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', color: theme?.colors?.text }}>
                                <span>Total:</span>
                                <span style={{ color: theme?.colors?.success }}>{total} ETB</span>
                            </div>
                        </div>
                        
                        <div style={{ 
                            marginTop: '1rem', 
                            padding: '0.5rem', 
                            backgroundColor: `${theme?.colors?.success}20`, 
                            borderRadius: theme?.borderRadius?.md || '8px' 
                        }}>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: theme?.colors?.textLight }}>
                                💰 You'll earn <strong>{Math.floor(total / 10)} points</strong> on this order!
                            </p>
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: theme?.colors?.textLight }}>
                                (10 points = 1 ETB towards future purchases)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;