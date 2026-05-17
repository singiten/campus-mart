import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';
import Button from './Button';

const VendorLocationShare = ({ orderId, onLocationUpdate }) => {
    const { user, socket } = useAuth();
    const { theme } = useTheme();
    const [isSharing, setIsSharing] = useState(false);
    const [watchId, setWatchId] = useState(null);
    const [error, setError] = useState(null);

    const startSharing = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            toast.error('Geolocation not supported');
            return;
        }

        setError(null);
        
        // Request permission and start watching position
        const id = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                
                // Send location to server via socket
                if (socket && orderId) {
                    socket.emit('vendor-share-location', {
                        vendorId: user?.id,
                        lat: latitude,
                        lng: longitude,
                        orderId: orderId
                    });
                    
                    if (onLocationUpdate) {
                        onLocationUpdate({ lat: latitude, lng: longitude });
                    }
                }
            },
            (err) => {
                console.error('Geolocation error:', err);
                setError('Unable to get your location. Please enable location services.');
                toast.error('Location access denied');
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
        
        setWatchId(id);
        setIsSharing(true);
        toast.success('Location sharing started! Students can now track you.');
    };

    const stopSharing = () => {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
        }
        
        if (socket && orderId) {
            socket.emit('vendor-stop-sharing', {
                vendorId: user?.id,
                orderId: orderId
            });
        }
        
        setIsSharing(false);
        toast.info('Location sharing stopped');
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
            }
            if (socket && orderId && isSharing) {
                socket.emit('vendor-stop-sharing', {
                    vendorId: user?.id,
                    orderId: orderId
                });
            }
        };
    }, [watchId, socket, orderId, user?.id, isSharing]);

    return (
        <div style={{
            backgroundColor: theme?.colors?.surface,
            borderRadius: theme?.borderRadius?.md || '8px',
            padding: '1rem',
            border: `1px solid ${theme?.colors?.border}`,
            marginTop: '1rem'
        }}>
            <h4 style={{ color: theme?.colors?.text, marginBottom: '0.5rem' }}>
                📍 Live Location Sharing
            </h4>
            
            {error && (
                <div style={{
                    padding: '0.5rem',
                    backgroundColor: `${theme?.colors?.danger}20`,
                    borderRadius: theme?.borderRadius?.sm || '4px',
                    marginBottom: '0.5rem',
                    color: theme?.colors?.danger,
                    fontSize: '0.875rem'
                }}>
                    ⚠️ {error}
                </div>
            )}
            
            <p style={{ color: theme?.colors?.textLight, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                {isSharing 
                    ? '🟢 You are sharing your live location. Students can track your delivery progress.'
                    : '🔴 You are not sharing your location. Start sharing to let students track you.'}
            </p>
            
            {!isSharing ? (
                <Button
                    variant="primary"
                    size="sm"
                    onClick={startSharing}
                    icon="📍"
                >
                    Start Sharing Location
                </Button>
            ) : (
                <Button
                    variant="danger"
                    size="sm"
                    onClick={stopSharing}
                    icon="🔴"
                >
                    Stop Sharing Location
                </Button>
            )}
        </div>
    );
};

export default VendorLocationShare;