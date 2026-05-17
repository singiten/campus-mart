import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSocket } from '../services/socket';
import ReviewModal from '../components/ReviewModal';
import OrderTracking from '../components/OrderTracking';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
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

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [canReview, setCanReview] = useState({});
    const { user } = useAuth();
    const { theme } = useTheme();

    useEffect(() => {
        fetchOrders();
        
        const socket = getSocket();
        if (socket) {
            socket.on('order-status-update', (data) => {
                setOrders(prevOrders => 
                    prevOrders.map(order => 
                        order._id === data.orderId 
                            ? { ...order, status: data.newStatus, updatedAt: new Date() }
                            : order
                    )
                );
                
                const statusMessages = {
                    confirmed: '✅ Your order has been confirmed!',
                    preparing: '🍳 Your order is being prepared!',
                    ready: '🛵 Your order is ready for delivery!',
                    delivered: '📦 Your order has been delivered! Enjoy!',
                    cancelled: '❌ Your order has been cancelled.'
                };
                
                if (statusMessages[data.newStatus]) {
                    toast.info(statusMessages[data.newStatus]);
                }
            });
        }
        
        return () => {
            const socket = getSocket();
            if (socket) {
                socket.off('order-status-update');
            }
        };
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await API.get('/orders/my-orders');
            console.log('Fetched orders:', response.data.data);
            setOrders(response.data.data);
            
            const socket = getSocket();
            if (socket && response.data.data) {
                response.data.data.forEach(order => {
                    socket.emit('join-order-room', order._id);
                });
            }
            
            // Check which products can be reviewed
            const reviewStatus = {};
            for (const order of response.data.data) {
                if (order.status === 'delivered') {
                    for (const item of order.items) {
                        try {
                            const reviewCheck = await API.get(`/reviews/can-review/${item.product}`);
                            reviewStatus[`${order._id}-${item.product}`] = reviewCheck.data.canReview;
                        } catch (error) {
                            console.error('Error checking review status:', error);
                            reviewStatus[`${order._id}-${item.product}`] = false;
                        }
                    }
                }
            }
            setCanReview(reviewStatus);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const openReviewModal = (item, orderId) => {
        setSelectedProduct({
            _id: item.product,
            name: item.name,
            imageUrl: item.imageUrl || 'https://picsum.photos/id/26/200/200',
            price: item.price
        });
        setSelectedOrderId(orderId);
        setShowReviewModal(true);
    };

    const handleReviewSubmitted = () => {
        fetchOrders();
    };

    const toggleExpandOrder = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: '#f39c12',
            confirmed: '#3498db',
            preparing: '#9b59b6',
            ready: '#1abc9c',
            delivered: '#27ae60',
            cancelled: '#e74c3c'
        };
        return colors[status] || '#95a5a6';
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: '⏳',
            confirmed: '✅',
            preparing: '🍳',
            ready: '🛵',
            delivered: '📦',
            cancelled: '❌'
        };
        return icons[status] || '📋';
    };

    const getStatusMessage = (status) => {
        const messages = {
            pending: 'Order placed. Waiting for vendor confirmation...',
            confirmed: 'Order confirmed! Vendor is preparing your items.',
            preparing: 'Your order is being prepared!',
            ready: 'Order ready! Out for delivery.',
            delivered: 'Order delivered! Thank you for shopping with us!',
            cancelled: 'Order cancelled.'
        };
        return messages[status] || 'Processing...';
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: theme?.colors?.textLight }}>Loading orders...</div>;

    if (orders.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: theme?.colors?.text }}>No orders yet</h2>
                <p style={{ color: theme?.colors?.textLight }}>Your order history will appear here</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', backgroundColor: theme?.colors?.background, minHeight: 'calc(100vh - 200px)' }}>
            <h1 style={{ color: theme?.colors?.text, marginBottom: '2rem' }}>My Orders</h1>
            
            {orders.map(order => (
                <div key={order._id} style={{
                    backgroundColor: theme?.colors?.surface,
                    border: `1px solid ${theme?.colors?.border}`,
                    borderRadius: theme?.borderRadius?.lg || '12px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    boxShadow: theme?.shadows?.card || '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                    {/* Order Header - Clickable to expand */}
                    <div 
                        onClick={() => toggleExpandOrder(order._id)}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            marginBottom: '1rem',
                            paddingBottom: '0.5rem',
                            borderBottom: `1px solid ${theme?.colors?.border}`,
                            cursor: 'pointer'
                        }}
                    >
                        <div>
                            <span style={{ fontWeight: 'bold', color: theme?.colors?.text }}>Order #{order._id.slice(-8)}</span>
                            <span style={{ marginLeft: '1rem', color: theme?.colors?.textLight, fontSize: '0.875rem' }}>
                                {new Date(order.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <div>
                            <span style={{
                                backgroundColor: getStatusColor(order.status),
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}>
                                {getStatusIcon(order.status)} {order.status.toUpperCase()}
                            </span>
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: theme?.colors?.textLight }}>
                                {expandedOrder === order._id ? '▲' : '▼'}
                            </span>
                        </div>
                    </div>
                    
                    {/* Status Progress Bar */}
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem',
                            fontSize: '0.75rem',
                            color: theme?.colors?.textLight
                        }}>
                            <span>Pending</span>
                            <span>Confirmed</span>
                            <span>Preparing</span>
                            <span>Ready</span>
                            <span>Delivered</span>
                        </div>
                        <div style={{
                            backgroundColor: theme?.colors?.border,
                            borderRadius: '10px',
                            height: '8px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${order.status === 'pending' ? 20 : order.status === 'confirmed' ? 40 : order.status === 'preparing' ? 60 : order.status === 'ready' ? 80 : 100}%`,
                                backgroundColor: getStatusColor(order.status),
                                height: '100%',
                                transition: 'width 0.5s ease'
                            }} />
                        </div>
                        <p style={{ fontSize: '0.75rem', color: theme?.colors?.textLight, marginTop: '0.5rem' }}>
                            {getStatusMessage(order.status)}
                        </p>
                    </div>
                    
                    {/* Order Items (always visible) */}
                    <div style={{ marginBottom: '1rem' }}>
                        {order.items.map((item, idx) => {
                            const reviewKey = `${order._id}-${item.product}`;
                            const canReviewProduct = canReview[reviewKey] === true;
                            
                            return (
                                <div key={idx} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.5rem 0',
                                    borderBottom: idx !== order.items.length - 1 ? `1px solid ${theme?.colors?.border}` : 'none'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: theme?.colors?.text }}>{item.name} x {item.quantity}</div>
                                        <div style={{ fontSize: '0.75rem', color: theme?.colors?.textLight }}>
                                            {item.price * item.quantity} ETB
                                        </div>
                                    </div>
                                    {order.status === 'delivered' && canReviewProduct && (
                                        <Button
                                            variant="warning"
                                            size="sm"
                                            onClick={() => openReviewModal(item, order._id)}
                                        >
                                            ⭐ Rate
                                        </Button>
                                    )}
                                    {order.status === 'delivered' && !canReviewProduct && canReview[reviewKey] !== undefined && (
                                        <span style={{ fontSize: '0.7rem', color: theme?.colors?.success }}>
                                            ✓ Reviewed
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Order Footer (always visible) */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        paddingTop: '0.5rem',
                        borderTop: `1px solid ${theme?.colors?.border}`
                    }}>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: theme?.colors?.textLight }}>
                                📍 {order.campus.toUpperCase()} - {order.dorm}
                                {order.roomNumber && `, Room ${order.roomNumber}`}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: theme?.colors?.textLight }}>
                                💳 {order.paymentMethod === 'cash' ? 'Cash on Delivery' : order.paymentMethod === 'telebirr' ? 'Telebirr' : 'Chapa'}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.875rem', color: theme?.colors?.textLight }}>
                                Delivery Fee: {order.deliveryFee} ETB
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: theme?.colors?.success }}>
                                Total: {order.totalAmount} ETB
                            </div>
                        </div>
                    </div>
                    
                    {/* TRACKING SECTION - Expands when clicked */}
                    {expandedOrder === order._id && (
                        <div style={{
                            marginTop: '1rem',
                            paddingTop: '1rem',
                            borderTop: `1px dashed ${theme?.colors?.border}`
                        }}>
                            <OrderTracking 
                                orderId={order._id} 
                                onStatusChange={() => fetchOrders()}
                                deliveryAddress={{
                                    campus: order.campus,
                                    dorm: order.dorm
                                }}
                            />
                        </div>
                    )}
                </div>
            ))}
            
            {/* Review Modal */}
            {showReviewModal && selectedProduct && (
                <ReviewModal
                    product={selectedProduct}
                    orderId={selectedOrderId}
                    onClose={() => {
                        setShowReviewModal(false);
                        setSelectedProduct(null);
                        setSelectedOrderId(null);
                    }}
                    onReviewSubmitted={handleReviewSubmitted}
                />
            )}
        </div>
    );
};

export default Orders;