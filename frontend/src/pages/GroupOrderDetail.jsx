import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const GroupOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user, selectedCampus } = useAuth();
    const { theme } = useTheme();
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        fetchGroup();
    }, [id]);

    const fetchGroup = async () => {
        try {
            const response = await API.get(`/group-orders/${id}`);
            console.log('Group data:', response.data);
            setGroup(response.data.data);
        } catch (error) {
            console.error('Error fetching group:', error);
            toast.error('Group not found or expired');
            navigate('/group-orders');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGroup = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to join');
            navigate('/login');
            return;
        }
        
        try {
            const response = await API.post(`/group-orders/${id}/join`, { quantity });
            
            if (response.data.orderCompleted) {
                toast.success('🎉 Target reached! Order placed automatically!');
                navigate('/orders');
            } else {
                toast.success(response.data.message);
                fetchGroup(); // Refresh group data
            }
        } catch (error) {
            console.error('Join group error:', error);
            toast.error(error.response?.data?.message || 'Failed to join');
        }
    };

    const getProgressPercentage = (current, target) => {
        return Math.min((current / target) * 100, 100);
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: theme?.colors?.textLight }}>Loading...</div>;
    if (!group) return <div style={{ padding: '2rem', textAlign: 'center', color: theme?.colors?.textLight }}>Group not found</div>;

    const target = group.targetMembers || 8;
    const current = group.currentMembers || 1;
    const percentage = getProgressPercentage(current, target);
    const isTargetReached = current >= target;
    const isCreator = group.createdBy === user?._id;
    const isActive = group.status === 'open';

    return (
        <div style={{ 
            padding: '2rem', 
            maxWidth: '800px', 
            margin: '0 auto',
            backgroundColor: theme?.colors?.background,
            minHeight: 'calc(100vh - 200px)'
        }}>
            <button 
                onClick={() => navigate('/group-orders')} 
                style={{
                    marginBottom: '1.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'transparent',
                    border: `2px solid ${theme?.colors?.primary}`,
                    borderRadius: theme?.borderRadius?.md || '8px',
                    color: theme?.colors?.primary,
                    cursor: 'pointer'
                }}
            >
                ← Back to Group Orders
            </button>

            <div style={{
                backgroundColor: theme?.colors?.surface,
                borderRadius: theme?.borderRadius?.lg || '16px',
                padding: '2rem',
                boxShadow: theme?.shadows?.lg || '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '3rem' }}>🔥</span>
                    <h1 style={{ color: theme?.colors?.text }}>Group Order</h1>
                    <p style={{ color: theme?.colors?.textLight }}>Join this order and save together!</p>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    <img
                        src={group.productImage}
                        alt={group.productName}
                        style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px' }}
                    />
                    <div style={{ flex: 1 }}>
                        <h2 style={{ color: theme?.colors?.text }}>{group.productName}</h2>
                        <p style={{ color: theme?.colors?.textLight }}>Vendor: {group.vendorName}</p>
                        <p style={{ color: theme?.colors?.text }}>Regular price: <strong>{group.productPrice} ETB</strong></p>
                        {group.discount > 0 && (
                            <p style={{ color: theme?.colors?.success }}>Current discount: {group.discount}% OFF!</p>
                        )}
                        {group.freeDelivery && (
                            <p style={{ color: theme?.colors?.success, fontWeight: 'bold' }}>FREE Delivery Included!</p>
                        )}
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong style={{ color: theme?.colors?.text }}>Progress</strong>
                        <strong style={{ color: theme?.colors?.text }}>{current} / {target} members</strong>
                    </div>
                    <div style={{
                        backgroundColor: theme?.colors?.border,
                        borderRadius: '10px',
                        height: '12px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${percentage}%`,
                            backgroundColor: percentage >= 100 ? theme?.colors?.success : theme?.colors?.primary,
                            height: '100%',
                            transition: 'width 0.3s'
                        }} />
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ color: theme?.colors?.text, marginBottom: '0.5rem' }}>👥 Participants ({current})</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {group.participants?.map((p, idx) => (
                            <span key={idx} style={{
                                backgroundColor: `${theme?.colors?.primary}20`,
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.875rem',
                                color: theme?.colors?.text
                            }}>
                                {p.userName} ({p.userDorm || 'Unknown Dorm'})
                            </span>
                        ))}
                    </div>
                </div>

                <div style={{
                    backgroundColor: `${theme?.colors?.warning}20`,
                    padding: '1rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem'
                }}>
                    <h4 style={{ color: theme?.colors?.text, marginBottom: '0.5rem' }}>📊 Discount Tiers</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.875rem', color: theme?.colors?.textLight }}>
                        <div>5 members: 15% OFF</div>
                        <div>6 members: 20% OFF</div>
                        <div>7 members: 25% OFF</div>
                        <div style={{ fontWeight: 'bold', color: theme?.colors?.success }}>8+: 30% OFF + FREE Delivery!</div>
                    </div>
                </div>

                {isActive && !isTargetReached && !isCreator && (
                    <div style={{ marginTop: '1rem' }}>
                        <label style={{ color: theme?.colors?.text }}>Your Quantity:</label>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value))}
                            style={{ 
                                width: '80px', 
                                marginLeft: '0.5rem', 
                                padding: '0.25rem',
                                border: `1px solid ${theme?.colors?.border}`,
                                borderRadius: theme?.borderRadius?.sm || '4px',
                                backgroundColor: theme?.colors?.surface,
                                color: theme?.colors?.text
                            }}
                        />
                        <Button
                            onClick={handleJoinGroup}
                            variant="success"
                            fullWidth
                            style={{ marginTop: '1rem' }}
                        >
                            Join This Group
                        </Button>
                    </div>
                )}

                {isCreator && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        backgroundColor: `${theme?.colors?.secondary}20`,
                        borderRadius: '12px',
                        textAlign: 'center'
                    }}>
                        <p style={{ color: theme?.colors?.text, marginBottom: '0.5rem' }}>📋 Share this link with friends:</p>
                        <code style={{
                            display: 'block',
                            backgroundColor: theme?.colors?.surface,
                            padding: '0.5rem',
                            borderRadius: '8px',
                            wordBreak: 'break-all',
                            color: theme?.colors?.primary
                        }}>
                            {window.location.href}
                        </code>
                        <Button
                            variant="secondary"
                            size="sm"
                            icon="📋"
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                toast.success('Link copied!');
                            }}
                            style={{ marginTop: '0.5rem' }}
                        >
                            Copy Link
                        </Button>
                    </div>
                )}

                {isTargetReached && (
                    <div style={{
                        textAlign: 'center',
                        padding: '1rem',
                        backgroundColor: `${theme?.colors?.success}20`,
                        borderRadius: '8px',
                        color: theme?.colors?.success
                    }}>
                        🎉 Target reached! Order placed automatically!
                    </div>
                )}

                {!isActive && !isTargetReached && (
                    <div style={{
                        textAlign: 'center',
                        padding: '1rem',
                        backgroundColor: `${theme?.colors?.danger}20`,
                        borderRadius: '8px',
                        color: theme?.colors?.danger
                    }}>
                        ⏰ This group order has expired.
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupOrderDetail;