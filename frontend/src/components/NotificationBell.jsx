import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getSocket } from '../services/socket';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();
    
    useEffect(() => {
        const socket = getSocket();
        
        if (socket) {
            socket.on('notification', (notification) => {
                // Add to notifications list
                setNotifications(prev => [notification, ...prev].slice(0, 20));
                
                // Show toast notification
                toast.info(notification.message, {
                    onClick: () => {
                        if (notification.orderId) {
                            navigate(`/orders`);
                        }
                    }
                });
            });
        }
        
        return () => {
            if (socket) {
                socket.off('notification');
            }
        };
    }, [navigate]);
    
    const clearNotifications = () => {
        setNotifications([]);
        setShowDropdown(false);
    };
    
    const unreadCount = notifications.length;
    
    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    position: 'relative',
                    color: 'white'
                }}
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-12px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        borderRadius: '50%',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>
            
            {showDropdown && (
                <div style={{
                    position: 'absolute',
                    top: '35px',
                    right: '0',
                    width: '300px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000
                }}>
                    <div style={{
                        padding: '10px',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <strong>Notifications</strong>
                        <button onClick={clearNotifications} style={{
                            background: 'none',
                            border: 'none',
                            color: '#667eea',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}>
                            Clear all
                        </button>
                    </div>
                    
                    {notifications.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                            No notifications
                        </div>
                    ) : (
                        notifications.map((notif, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    if (notif.orderId) {
                                        navigate('/orders');
                                        setShowDropdown(false);
                                    }
                                }}
                                style={{
                                    padding: '10px',
                                    borderBottom: '1px solid #eee',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                <div style={{ fontWeight: 'bold' }}>{notif.title || 'Order Update'}</div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{notif.message}</div>
                                <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                                    {new Date(notif.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;