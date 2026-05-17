import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const loadGoogleMapsScript = (apiKey) => {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
            resolve(window.google.maps);
            return;
        }
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google.maps);
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

const API = axios.create({ baseURL: 'http://localhost:8003/api' });
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const OrderTracking = ({ orderId, onStatusChange, deliveryAddress }) => {
    const { user, socket } = useAuth();
    const { theme } = useTheme();
    const [tracking, setTracking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mapsLoaded, setMapsLoaded] = useState(false);
    const [mapError, setMapError] = useState(null);
    const [vendorLocation, setVendorLocation] = useState(null);
    const mapRef = useRef(null);
    const vendorMarkerRef = useRef(null);
    const deliveryMarkerRef = useRef(null);

    // 4 Kilo Campus coordinates
    const deliveryLocation = { lat: 9.0325, lng: 38.7645 };

    useEffect(() => {
        fetchTracking();
        
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        if (apiKey) {
            loadGoogleMapsScript(apiKey)
                .then(() => setMapsLoaded(true))
                .catch((err) => {
                    console.error('Failed to load Google Maps:', err);
                    setMapError('Failed to load maps. Check API key.');
                });
        } else {
            setMapError('Google Maps API key not configured.');
        }
        
        if (socket) {
            socket.on('vendor-accepted', (data) => {
                toast.info(data.message);
                fetchTracking();
            });
            
            socket.on('order-status-update', (data) => {
                if (data.orderId === orderId) {
                    toast.info(data.message);
                    fetchTracking();
                    if (onStatusChange) onStatusChange(data.status);
                }
            });
            
            socket.on('vendor-location-update', (data) => {
                if (data.orderId === orderId) {
                    setVendorLocation({ lat: data.lat, lng: data.lng });
                    updateMarkerPosition(data.lat, data.lng);
                }
            });
        }
        
        return () => {
            if (socket) {
                socket.off('vendor-accepted');
                socket.off('order-status-update');
                socket.off('vendor-location-update');
            }
        };
    }, [orderId, socket]);

    const fetchTracking = async () => {
        try {
            const response = await API.get(`/tracking/orders/${orderId}/tracking`);
            setTracking(response.data.data);
            if (response.data.data.vendorLocation) {
                setVendorLocation(response.data.data.vendorLocation);
            }
        } catch (error) {
            console.error('Error fetching tracking:', error);
        } finally {
            setLoading(false);
        }
    };

    const initMap = () => {
        if (!mapsLoaded || !window.google) return;
        
        const mapDiv = document.getElementById(`tracking-map-${orderId}`);
        if (!mapDiv) return;
        
        // 4 Kilo Campus coordinates as center
        const center = { lat: 9.0325, lng: 38.7645 };
        
        const map = new window.google.maps.Map(mapDiv, {
            center: center,
            zoom: 16,
            styles: [
                { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
            ]
        });
        
        mapRef.current = map;
        
        // Add vendor marker if location exists
        if (vendorLocation && vendorLocation.lat) {
            vendorMarkerRef.current = new window.google.maps.Marker({
                position: { lat: vendorLocation.lat, lng: vendorLocation.lng },
                map: map,
                title: 'Vendor',
                icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/truck.png',
                    scaledSize: new window.google.maps.Size(40, 40)
                },
                animation: window.google.maps.Animation.BOUNCE
            });
        }
        
        // Add delivery marker at 4 Kilo Campus
        const deliveryLoc = { lat: 9.0325, lng: 38.7645 };
        deliveryMarkerRef.current = new window.google.maps.Marker({
            position: deliveryLoc,
            map: map,
            title: '4 Kilo Campus - Your Dorm',
            icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new window.google.maps.Size(40, 40)
            }
        });
        
        // Add info window for delivery location
        const infoWindow = new window.google.maps.InfoWindow({
            content: '<div style="padding: 5px;"><strong>📍 4 Kilo Campus</strong><br/>Your delivery location</div>'
        });
        
        deliveryMarkerRef.current.addListener('click', () => {
            infoWindow.open(map, deliveryMarkerRef.current);
        });
        
        // Fit bounds to show both markers
        if (vendorLocation && vendorLocation.lat) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend({ lat: vendorLocation.lat, lng: vendorLocation.lng });
            bounds.extend(deliveryLoc);
            map.fitBounds(bounds);
        }
    };

    const updateMarkerPosition = (lat, lng) => {
        if (!mapsLoaded || !window.google) return;
        
        if (vendorMarkerRef.current) {
            vendorMarkerRef.current.setPosition({ lat, lng });
            
            // Animate the marker
            vendorMarkerRef.current.setAnimation(window.google.maps.Animation.BOUNCE);
            setTimeout(() => {
                if (vendorMarkerRef.current) {
                    vendorMarkerRef.current.setAnimation(null);
                }
            }, 2000);
            
            // Center map on new position
            if (mapRef.current) {
                mapRef.current.panTo({ lat, lng });
            }
        } else if (mapRef.current) {
            // Create marker if it doesn't exist
            vendorMarkerRef.current = new window.google.maps.Marker({
                position: { lat, lng },
                map: mapRef.current,
                title: 'Vendor',
                icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/truck.png',
                    scaledSize: new window.google.maps.Size(40, 40)
                },
                animation: window.google.maps.Animation.BOUNCE
            });
        }
    };

    useEffect(() => {
        if (mapsLoaded && tracking && (tracking.status === 'in_transit' || tracking.status === 'assigned')) {
            initMap();
        }
    }, [mapsLoaded, tracking, vendorLocation]);

    const getStatusIcon = (status) => {
        const icons = {
            pending: '⏳',
            assigned: '📋',
            in_transit: '🚚',
            delivered: '✅',
            cancelled: '❌'
        };
        return icons[status] || '📦';
    };

    const getStatusText = (status) => {
        const texts = {
            pending: 'Waiting for vendor assignment',
            assigned: 'Vendor assigned - Awaiting acceptance',
            in_transit: 'On the way!',
            delivered: 'Delivered!',
            cancelled: 'Cancelled'
        };
        return texts[status] || status;
    };

    if (loading) return <div style={{ padding: '1rem', textAlign: 'center', color: theme?.colors?.textLight }}>Loading tracking...</div>;
    if (!tracking) return null;

    return (
        <div style={{
            backgroundColor: theme?.colors?.surface,
            borderRadius: theme?.borderRadius?.lg || '12px',
            padding: '1rem',
            border: `1px solid ${theme?.colors?.border}`
        }}>
            <h3 style={{ color: theme?.colors?.text, marginBottom: '1rem' }}>📦 Order Tracking</h3>
            
            {/* Status Timeline */}
            <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: theme?.colors?.textLight, fontSize: '0.875rem' }}>Status</span>
                    <span style={{ color: tracking.status === 'delivered' ? theme?.colors?.success : theme?.colors?.primary, fontWeight: 'bold' }}>
                        {getStatusIcon(tracking.status)} {getStatusText(tracking.status)}
                    </span>
                </div>
                <div style={{ backgroundColor: theme?.colors?.border, borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${tracking.status === 'pending' ? 20 : tracking.status === 'assigned' ? 40 : tracking.status === 'in_transit' ? 70 : 100}%`,
                        backgroundColor: tracking.status === 'delivered' ? theme?.colors?.success : theme?.colors?.primary,
                        height: '100%',
                        transition: 'width 0.3s'
                    }} />
                </div>
            </div>
            
            {/* Google Map */}
            {(tracking.status === 'in_transit' || tracking.status === 'assigned') && (
                <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ color: theme?.colors?.text, marginBottom: '0.5rem', fontSize: '0.875rem' }}>🗺️ Live Location</h4>
                    {mapError ? (
                        <div style={{
                            padding: '2rem',
                            backgroundColor: `${theme?.colors?.danger}20`,
                            borderRadius: theme?.borderRadius?.md || '8px',
                            textAlign: 'center'
                        }}>
                            <p style={{ color: theme?.colors?.danger }}>⚠️ {mapError}</p>
                            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: theme?.colors?.textLight }}>
                                Delivery location: 4 Kilo Campus
                            </p>
                        </div>
                    ) : !mapsLoaded ? (
                        <div style={{
                            padding: '2rem',
                            backgroundColor: `${theme?.colors?.warning}20`,
                            borderRadius: theme?.borderRadius?.md || '8px',
                            textAlign: 'center'
                        }}>
                            <p style={{ color: theme?.colors?.textLight }}>Loading map...</p>
                        </div>
                    ) : (
                        <div 
                            id={`tracking-map-${orderId}`} 
                            style={{ 
                                width: '100%', 
                                height: '350px', 
                                borderRadius: theme?.borderRadius?.md || '8px',
                                backgroundColor: '#f0f0f0'
                            }}
                        />
                    )}
                    
                    {/* Live tracking indicator */}
                    {vendorLocation && (
                        <div style={{
                            marginTop: '0.5rem',
                            padding: '0.25rem',
                            backgroundColor: `${theme?.colors?.success}20`,
                            borderRadius: theme?.borderRadius?.sm || '4px',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            color: theme?.colors?.success
                        }}>
                            🟢 Live tracking active - Vendor location updates in real-time
                        </div>
                    )}
                    
                    {/* Delivery location info */}
                    <div style={{
                        marginTop: '0.5rem',
                        padding: '0.25rem',
                        backgroundColor: `${theme?.colors?.info}20`,
                        borderRadius: theme?.borderRadius?.sm || '4px',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        color: theme?.colors?.primary
                    }}>
                        📍 Delivery destination: 4 Kilo Campus
                    </div>
                </div>
            )}
            
            {/* Vendor Info (if accepted) */}
            {tracking.vendorAccepted && tracking.vendor && (
                <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: `${theme?.colors?.primary}10`,
                    borderRadius: theme?.borderRadius?.md || '8px'
                }}>
                    <p style={{ color: theme?.colors?.text, marginBottom: '0.25rem' }}>
                        🛵 Vendor: <strong>{tracking.vendor.name}</strong>
                    </p>
                    <p style={{ color: theme?.colors?.textLight, marginBottom: '0.25rem' }}>
                        📞 Phone: <a href={`tel:${tracking.vendor.phone}`} style={{ color: theme?.colors?.primary }}>{tracking.vendor.phone}</a>
                    </p>
                    {vendorLocation && (
                        <p style={{ color: theme?.colors?.success, fontSize: '0.875rem' }}>
                            🟢 Sharing live location
                        </p>
                    )}
                </div>
            )}
            
            {/* Timestamps */}
            {tracking.pickedUpAt && (
                <p style={{ fontSize: '0.75rem', color: theme?.colors?.textMuted, marginTop: '0.5rem' }}>
                    📦 Picked up: {new Date(tracking.pickedUpAt).toLocaleTimeString()}
                </p>
            )}
            {tracking.deliveredAt && (
                <p style={{ fontSize: '0.75rem', color: theme?.colors?.success, marginTop: '0.25rem' }}>
                    ✅ Delivered: {new Date(tracking.deliveredAt).toLocaleTimeString()}
                </p>
            )}
        </div>
    );
};

export default OrderTracking;