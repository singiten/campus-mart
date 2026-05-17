import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import Button from './Button';
import VendorLocationShare from './VendorLocationShare';

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

const VendorDeliveryDashboard = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAvailable, setIsAvailable] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        if (user?.role === 'vendor') {
            fetchOrders();
            fetchStats();
            fetchProfile();
        }
    }, [user]);

    const fetchOrders = async () => {
        try {
            const response = await API.get('/vendor/orders');
            console.log('Fetched orders:', response.data);
            setOrders(response.data.data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        }
    };

    const fetchStats = async () => {
        try {
            const response = await API.get('/vendor/stats');
            setStats(response.data.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchProfile = async () => {
        try {
            const response = await API.get('/vendor/profile');
            setIsAvailable(response.data.data.availability?.isCurrentlyActive ?? true);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptOrder = async (orderId) => {
        try {
            const response = await API.post(`/tracking/orders/${orderId}/accept`);
            if (response.data.success) {
                toast.success(response.data.message);
                fetchOrders();
                fetchStats();
            }
        } catch (error) {
            console.error('Accept order error:', error);
            toast.error(error.response?.data?.message || 'Failed to accept order');
        }
    };

    const handleRejectOrder = async (orderId) => {
        // Use toast with input instead of prompt
        const reason = await new Promise((resolve) => {
            toast.info(
                <div>
                    <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>Why are you rejecting this order?</p>
                    <input
                        id="reject-reason"
                        type="text"
                        placeholder="Optional reason..."
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            marginBottom: '8px'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => {
                                const input = document.getElementById('reject-reason');
                                resolve(input?.value || '');
                                toast.dismiss();
                            }}
                            style={{
                                padding: '4px 12px',
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Reject
                        </button>
                        <button
                            onClick={() => {
                                resolve(null);
                                toast.dismiss();
                            }}
                            style={{
                                padding: '4px 12px',
                                backgroundColor: '#95a5a6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>,
                {
                    autoClose: false,
                    closeOnClick: false,
                    draggable: false
                }
            );
        });
        
        if (reason === null) return; // User cancelled
        
        try {
            const response = await API.post(`/tracking/orders/${orderId}/reject`, { reason });
            if (response.data.success) {
                toast.success(response.data.message);
                fetchOrders();
                fetchStats();
            }
        } catch (error) {
            console.error('Reject order error:', error);
            toast.error(error.response?.data?.message || 'Failed to reject order');
        }
    };

    const handleUpdateDeliveryStatus = async (orderId, currentStatus) => {
        let nextStatus = '';
        let statusMessage = '';
        let confirmMessage = '';
        
        if (currentStatus === 'assigned') {
            nextStatus = 'picked_up';
            statusMessage = 'picked up from store';
            confirmMessage = 'Confirm you have picked up the order from the store?';
        } else if (currentStatus === 'picked_up') {
            nextStatus = 'in_transit';
            statusMessage = 'marked as in transit';
            confirmMessage = 'Confirm you are now on the way to deliver?';
        } else if (currentStatus === 'in_transit') {
            nextStatus = 'delivered';
            statusMessage = 'marked as delivered';
            confirmMessage = 'Confirm the order has been delivered to the customer?';
        } else {
            toast.info('Cannot update this order');
            return;
        }
        
        // Use toast confirmation instead of window.confirm
        const confirmed = await new Promise((resolve) => {
            toast.info(
                <div>
                    <p style={{ marginBottom: '12px', fontWeight: 'bold' }}>{confirmMessage}</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => {
                                resolve(true);
                                toast.dismiss();
                            }}
                            style={{
                                padding: '4px 12px',
                                backgroundColor: '#27ae60',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Yes, Confirm
                        </button>
                        <button
                            onClick={() => {
                                resolve(false);
                                toast.dismiss();
                            }}
                            style={{
                                padding: '4px 12px',
                                backgroundColor: '#95a5a6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>,
                {
                    autoClose: false,
                    closeOnClick: false,
                    draggable: false
                }
            );
        });
        
        if (!confirmed) return;
        
        try {
            await API.put(`/tracking/orders/${orderId}/status`, { status: nextStatus });
            toast.success(`Order ${statusMessage}`);
            fetchOrders();
            fetchStats();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleToggleAvailability = async () => {
        try {
            await API.put('/vendor/availability', { isCurrentlyActive: !isAvailable });
            setIsAvailable(!isAvailable);
            toast.success(`You are now ${!isAvailable ? 'available' : 'unavailable'} for deliveries`);
        } catch (error) {
            toast.error('Failed to update availability');
        }
    };

    const toggleExpandOrder = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    const getStatusBadge = (status) => {
        const config = {
            pending: { bg: '#f39c12', text: '⏳ Pending - Awaiting Assignment' },
            assigned: { bg: '#3498db', text: '📋 Assigned - Accept or Reject' },
            picked_up: { bg: '#9b59b6', text: '📦 Picked Up' },
            in_transit: { bg: '#1abc9c', text: '🚚 In Transit' },
            delivered: { bg: '#27ae60', text: '✅ Delivered' },
            cancelled: { bg: '#e74c3c', text: '❌ Cancelled' }
        };
        const c = config[status] || { bg: '#95a5a6', text: status };
        return (
            <span style={{
                backgroundColor: c.bg,
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
            }}>
                {c.text}
            </span>
        );
    };

    const getNextAction = (status) => {
        const actions = {
            assigned: { button: '📦 Accept Order', nextStatus: 'accept' },
            picked_up: { button: '🚚 Mark as In Transit', nextStatus: 'in_transit' },
            in_transit: { button: '✅ Mark as Delivered', nextStatus: 'delivered' }
        };
        return actions[status];
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: theme?.colors?.textLight }}>Loading dashboard...</div>;
    }

    return (
        <div style={{ 
            padding: '2rem', 
            maxWidth: '1200px', 
            margin: '0 auto',
            backgroundColor: theme?.colors?.background,
            minHeight: 'calc(100vh - 200px)'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ color: theme?.colors?.text }}>Delivery Dashboard</h1>
                    <p style={{ color: theme?.colors?.textLight }}>Manage your assigned deliveries</p>
                </div>
                <button
                    onClick={handleToggleAvailability}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: isAvailable ? '#27ae60' : '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {isAvailable ? '🟢 Available for Deliveries' : '🔴 Unavailable'}
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{ 
                        backgroundColor: theme?.colors?.surface, 
                        padding: '1rem', 
                        borderRadius: theme?.borderRadius?.lg || '12px', 
                        textAlign: 'center', 
                        boxShadow: theme?.shadows?.card,
                        border: `1px solid ${theme?.colors?.border}`
                    }}>
                        <h3 style={{ color: theme?.colors?.text }}>📦 Current Orders</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme?.colors?.primary }}>{stats.currentAssigned || 0}</p>
                    </div>
                    <div style={{ 
                        backgroundColor: theme?.colors?.surface, 
                        padding: '1rem', 
                        borderRadius: theme?.borderRadius?.lg || '12px', 
                        textAlign: 'center', 
                        boxShadow: theme?.shadows?.card,
                        border: `1px solid ${theme?.colors?.border}`
                    }}>
                        <h3 style={{ color: theme?.colors?.text }}>✅ Completed</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme?.colors?.success }}>{stats.completedDeliveries || 0}</p>
                    </div>
                    <div style={{ 
                        backgroundColor: theme?.colors?.surface, 
                        padding: '1rem', 
                        borderRadius: theme?.borderRadius?.lg || '12px', 
                        textAlign: 'center', 
                        boxShadow: theme?.shadows?.card,
                        border: `1px solid ${theme?.colors?.border}`
                    }}>
                        <h3 style={{ color: theme?.colors?.text }}>💰 Total Earnings</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme?.colors?.warning }}>{stats.totalEarnings || 0} ETB</p>
                    </div>
                </div>
            )}

            {/* Assigned Orders */}
            <h2 style={{ color: theme?.colors?.text, marginBottom: '1rem' }}>Assigned Deliveries</h2>
            {orders.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '3rem', 
                    backgroundColor: theme?.colors?.surface, 
                    borderRadius: theme?.borderRadius?.lg || '12px',
                    border: `1px solid ${theme?.colors?.border}`
                }}>
                    <p style={{ color: theme?.colors?.textLight }}>No assigned deliveries yet.</p>
                    <p style={{ fontSize: '0.875rem', color: theme?.colors?.textMuted, marginTop: '0.5rem' }}>
                        When admin assigns an order to you, it will appear here.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {orders.map(order => {
                        const nextAction = getNextAction(order.status);
                        const canUpdate = nextAction && order.status !== 'delivered' && order.status !== 'cancelled';
                        const isPendingAccept = order.status === 'assigned' && !order.vendorAccepted;
                        const canShareLocation = order.status === 'assigned' || order.status === 'in_transit';
                        
                        return (
                            <div key={order._id} style={{
                                backgroundColor: theme?.colors?.surface,
                                borderRadius: theme?.borderRadius?.lg || '12px',
                                padding: '1rem',
                                boxShadow: theme?.shadows?.card,
                                borderLeft: `4px solid ${order.status === 'delivered' ? theme?.colors?.success : order.status === 'assigned' ? theme?.colors?.warning : theme?.colors?.primary}`,
                                border: `1px solid ${theme?.colors?.border}`,
                                borderLeftWidth: '4px'
                            }}>
                                {/* Order Header - Clickable */}
                                <div 
                                    onClick={() => toggleExpandOrder(order._id)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        marginBottom: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div>
                                        <strong style={{ color: theme?.colors?.text }}>Order #{order._id.slice(-8)}</strong>
                                        <span style={{ marginLeft: '1rem', color: theme?.colors?.textLight, fontSize: '0.875rem' }}>
                                            {new Date(order.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {getStatusBadge(order.status)}
                                        <span style={{ fontSize: '0.75rem', color: theme?.colors?.textLight }}>
                                            {expandedOrder === order._id ? '▲' : '▼'}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Basic Info (always visible) */}
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <p style={{ color: theme?.colors?.text }}><strong>Customer:</strong> {order.user?.name}</p>
                                    <p style={{ color: theme?.colors?.textLight }}><strong>Phone:</strong> {order.user?.phone}</p>
                                    <p style={{ color: theme?.colors?.textLight }}><strong>Delivery Location:</strong> {order.campus} - {order.dorm} {order.roomNumber ? `, Room ${order.roomNumber}` : ''}</p>
                                </div>
                                
                                {/* Items Summary */}
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <strong style={{ color: theme?.colors?.text }}>Items:</strong>
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} style={{ marginLeft: '1rem', fontSize: '0.875rem', color: theme?.colors?.textLight }}>
                                            {item.name} x {item.quantity}
                                        </div>
                                    ))}
                                    <div style={{ marginTop: '0.25rem', fontWeight: 'bold', color: theme?.colors?.success }}>
                                        Total: {order.totalAmount} ETB (Delivery Fee: {order.deliveryFee} ETB)
                                    </div>
                                </div>
                                
                                {/* Action Buttons (always visible for pending actions) */}
                                {isPendingAccept && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <Button
                                            variant="success"
                                            size="sm"
                                            onClick={() => handleAcceptOrder(order._id)}
                                        >
                                            ✅ Accept Order
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleRejectOrder(order._id)}
                                        >
                                            ❌ Reject
                                        </Button>
                                    </div>
                                )}
                                
                                {canUpdate && !isPendingAccept && order.status !== 'delivered' && order.vendorAccepted === true && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleUpdateDeliveryStatus(order._id, order.status)}
                                        style={{ marginTop: '0.5rem', width: '100%' }}
                                    >
                                        {nextAction?.button || 'Update Status'}
                                    </Button>
                                )}
                                
                                {/* Expanded Section - Location Sharing */}
                                {expandedOrder === order._id && (
                                    <div style={{
                                        marginTop: '1rem',
                                        paddingTop: '1rem',
                                        borderTop: `1px dashed ${theme?.colors?.border}`
                                    }}>
                                        <h4 style={{ color: theme?.colors?.text, marginBottom: '0.5rem' }}>📍 Location Sharing</h4>
                                        {canShareLocation ? (
                                            order.vendorAccepted ? (
                                                <VendorLocationShare 
                                                    orderId={order._id}
                                                    onLocationUpdate={(location) => {
                                                        console.log('Location updated for order:', order._id, location);
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    padding: '1rem',
                                                    backgroundColor: `${theme?.colors?.warning}20`,
                                                    borderRadius: theme?.borderRadius?.md || '8px',
                                                    textAlign: 'center'
                                                }}>
                                                    <p style={{ color: theme?.colors?.warning, margin: 0 }}>
                                                        ⚠️ Please accept the order first to share your location
                                                    </p>
                                                </div>
                                            )
                                        ) : (
                                            <div style={{
                                                padding: '1rem',
                                                backgroundColor: `${theme?.colors?.info}20`,
                                                borderRadius: theme?.borderRadius?.md || '8px',
                                                textAlign: 'center'
                                            }}>
                                                <p style={{ color: theme?.colors?.textLight, margin: 0 }}>
                                                    📍 Location sharing is available after accepting the order
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Delivery Complete Message */}
                                {order.status === 'delivered' && (
                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '0.5rem',
                                        backgroundColor: `${theme?.colors?.success}20`,
                                        borderRadius: theme?.borderRadius?.md || '8px',
                                        textAlign: 'center'
                                    }}>
                                        <p style={{ color: theme?.colors?.success, margin: 0 }}>
                                            ✅ Delivery completed on {new Date(order.deliveredAt).toLocaleString()}
                                        </p>
                                        <p style={{ color: theme?.colors?.textLight, fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                            You earned {order.deliveryFee} ETB for this delivery
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default VendorDeliveryDashboard;