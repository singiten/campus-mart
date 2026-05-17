import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const GroupOrders = () => {
    const { user, isAuthenticated } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [myGroups, setMyGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            fetchMyGroups();
        }
    }, [isAuthenticated]);

    const fetchMyGroups = async () => {
        setLoading(true);
        try {
            const response = await API.get('/group-orders/my-groups');
            console.log('Fetched groups:', response.data);
            setMyGroups(response.data.data || []);
        } catch (error) {
            console.error('Error fetching groups:', error);
            toast.error('Failed to load groups');
        } finally {
            setLoading(false);
        }
    };

    const getProgressPercentage = (current, target) => {
        return Math.min((current / target) * 100, 100);
    };

    const getDiscountText = (discount, freeDelivery) => {
        if (discount === 0) return 'No discount yet';
        if (freeDelivery) return `${discount}% OFF + FREE Delivery!`;
        return `${discount}% OFF`;
    };

    if (!isAuthenticated) {
        return (
            <div style={{ 
                padding: '2rem', 
                textAlign: 'center',
                backgroundColor: theme?.colors?.background,
                minHeight: 'calc(100vh - 200px)'
            }}>
                <h2 style={{ color: theme?.colors?.text }}>Login to View Group Orders</h2>
                <p style={{ color: theme?.colors?.textLight, marginTop: '0.5rem' }}>You need to be logged in to create or join group orders.</p>
                <Button variant="primary" onClick={() => navigate('/login')} style={{ marginTop: '1rem' }}>
                    Login Now
                </Button>
            </div>
        );
    }

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: theme?.colors?.textLight }}>Loading your groups...</div>;
    }

    return (
        <div style={{ 
            padding: '2rem', 
            maxWidth: '1000px', 
            margin: '0 auto',
            backgroundColor: theme?.colors?.background,
            minHeight: 'calc(100vh - 200px)'
        }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '2rem', 
                flexWrap: 'wrap', 
                gap: '1rem' 
            }}>
                <div>
                    <h1 style={{ color: theme?.colors?.text }}>🔥 My Group Orders</h1>
                    <p style={{ color: theme?.colors?.textLight, marginTop: '0.25rem' }}>
                        Groups you've created or joined
                    </p>
                </div>
                <Button variant="primary" onClick={() => navigate('/products')} icon="➕">
                    Browse Products
                </Button>
            </div>

            {/* How it Works Banner */}
            <div style={{
                background: `linear-gradient(135deg, ${theme?.colors?.primary}20 0%, ${theme?.colors?.secondary}20 100%)`,
                padding: '1rem',
                borderRadius: theme?.borderRadius?.md || '12px',
                marginBottom: '2rem',
                border: `1px solid ${theme?.colors?.border}`
            }}>
                <h3 style={{ color: theme?.colors?.text, marginBottom: '0.5rem' }}>📖 How Group Orders Work</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ color: theme?.colors?.textLight }}>1. Start a group with minimum 5 members</div>
                    <div style={{ color: theme?.colors?.textLight }}>2. Share the 6-digit code with friends</div>
                    <div style={{ color: theme?.colors?.textLight }}>3. Friends join using your code</div>
                    <div style={{ color: theme?.colors?.textLight }}>4. Reach target → Everyone gets discount!</div>
                </div>
            </div>

            {/* My Groups List */}
            {myGroups.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '3rem', 
                    backgroundColor: theme?.colors?.surface, 
                    borderRadius: theme?.borderRadius?.lg || '12px',
                    border: `1px solid ${theme?.colors?.border}`
                }}>
                    <p style={{ color: theme?.colors?.textLight }}>You haven't created or joined any group orders yet.</p>
                    <Button variant="primary" onClick={() => navigate('/products')} style={{ marginTop: '1rem' }}>
                        Browse Products to Start
                    </Button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {myGroups.map(group => {
                        const isComplete = group.currentMembers >= group.targetMembers;
                        const isExpired = new Date(group.expiresAt) < new Date();
                        const progress = getProgressPercentage(group.currentMembers, group.targetMembers);
                        
                        return (
                            <div key={group._id} style={{
                                backgroundColor: theme?.colors?.surface,
                                borderRadius: theme?.borderRadius?.lg || '12px',
                                padding: '1.5rem',
                                border: `1px solid ${theme?.colors?.border}`,
                                boxShadow: theme?.shadows?.card || '0 2px 8px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    {/* Product Image */}
                                    <img
                                        src={group.productImage}
                                        alt={group.productName}
                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                                    />
                                    
                                    {/* Product Info */}
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ color: theme?.colors?.text, marginBottom: '0.25rem' }}>{group.productName}</h3>
                                        <p style={{ color: theme?.colors?.textLight, fontSize: '0.875rem' }}>
                                            Code: <strong style={{ fontFamily: 'monospace', fontSize: '1rem' }}>{group.code}</strong>
                                        </p>
                                        <p style={{ color: theme?.colors?.text }}>
                                            Price: <strong>{group.productPrice} ETB</strong>
                                            {group.discount > 0 && (
                                                <span style={{ color: theme?.colors?.success, marginLeft: '0.5rem' }}>
                                                    → {group.discountedPrice.toFixed(2)} ETB ({group.discount}% OFF)
                                                </span>
                                            )}
                                        </p>
                                        {group.isCreator && (
                                            <span style={{
                                                display: 'inline-block',
                                                backgroundColor: theme?.colors?.primary,
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: '20px',
                                                fontSize: '0.7rem',
                                                marginTop: '0.5rem'
                                            }}>
                                                👑 You are the creator
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Progress Bar */}
                                <div style={{ marginTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ color: theme?.colors?.text, fontSize: '0.875rem' }}>Progress</span>
                                        <span style={{ color: theme?.colors?.textLight, fontSize: '0.875rem' }}>
                                            {group.currentMembers}/{group.targetMembers} members
                                        </span>
                                    </div>
                                    <div style={{ backgroundColor: theme?.colors?.border, borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                                        <div style={{ 
                                            width: `${progress}%`, 
                                            backgroundColor: isComplete ? theme?.colors?.success : theme?.colors?.primary, 
                                            height: '100%',
                                            transition: 'width 0.3s'
                                        }} />
                                    </div>
                                </div>
                                
                                {/* Discount Status */}
                                {group.discount > 0 && (
                                    <div style={{ 
                                        marginTop: '0.75rem', 
                                        padding: '0.5rem', 
                                        backgroundColor: `${theme?.colors?.success}20`, 
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <span style={{ color: theme?.colors?.success, fontSize: '0.875rem', fontWeight: 'bold' }}>
                                            🎉 {getDiscountText(group.discount, group.freeDelivery)}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Participants */}
                                <div style={{ marginTop: '0.75rem' }}>
                                    <p style={{ color: theme?.colors?.textLight, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                        👥 Participants:
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {group.participants?.map((p, idx) => (
                                            <span key={idx} style={{
                                                backgroundColor: `${theme?.colors?.primary}20`,
                                                padding: '2px 8px',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                color: theme?.colors?.text
                                            }}>
                                                {p.userName} {p.hasPaid ? '✅' : '⏳'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {group.isCreator && !isComplete && !isExpired && (
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            onClick={() => {
                                                navigator.clipboard.writeText(group.code);
                                                toast.success(`Code ${group.code} copied! Share with friends.`);
                                            }}
                                        >
                                            📋 Copy Group Code
                                        </Button>
                                    )}
                                    
                                    {isComplete && !isExpired && (
                                        <div style={{ 
                                            flex: 1,
                                            backgroundColor: `${theme?.colors?.success}20`, 
                                            borderRadius: '8px',
                                            padding: '0.5rem',
                                            textAlign: 'center'
                                        }}>
                                            <p style={{ color: theme?.colors?.success, marginBottom: '0.25rem', fontWeight: 'bold' }}>
                                                🎉 Target reached! You get {group.discount}% OFF!
                                            </p>
                                            <Button 
                                                variant="success" 
                                                size="sm"
                                                onClick={() => {
                                                    toast.success(`Your discount: ${group.discount}% OFF! Add to cart at discounted price.`);
                                                    navigate(`/product/${group.productId}`);
                                                }}
                                            >
                                                🛒 Shop Now at {group.discount}% OFF
                                            </Button>
                                        </div>
                                    )}
                                    
                                    {isExpired && (
                                        <div style={{ 
                                            padding: '0.5rem', 
                                            backgroundColor: `${theme?.colors?.danger}20`, 
                                            borderRadius: '8px',
                                            width: '100%',
                                            textAlign: 'center'
                                        }}>
                                            <span style={{ color: theme?.colors?.danger, fontSize: '0.875rem' }}>
                                                ⏰ Group expired on {new Date(group.expiresAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GroupOrders;