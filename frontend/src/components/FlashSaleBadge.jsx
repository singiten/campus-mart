import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8003/api'
});

const FlashSaleBadge = ({ productId, originalPrice, onDiscountCalculated }) => {
    const [flashSale, setFlashSale] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkFlashSale();
    }, [productId]);

    useEffect(() => {
        if (flashSale && flashSale.endTime) {
            const timer = setInterval(() => {
                const now = new Date().getTime();
                const end = new Date(flashSale.endTime).getTime();
                const distance = end - now;
                
                if (distance < 0) {
                    clearInterval(timer);
                    setTimeLeft(null);
                    setFlashSale(null);
                } else {
                    const hours = Math.floor(distance / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    setTimeLeft({ hours, minutes, seconds });
                }
            }, 1000);
            
            return () => clearInterval(timer);
        }
    }, [flashSale]);

    const checkFlashSale = async () => {
        try {
            const response = await API.get(`/flash-sales/product/${productId}`);
            if (response.data.hasFlashSale) {
                setFlashSale(response.data.data);
                if (onDiscountCalculated) {
                    onDiscountCalculated(response.data.data.discountedPrice);
                }
            }
        } catch (error) {
            console.error('Error checking flash sale:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;
    if (!flashSale) return null;

    const discountedPrice = flashSale.discountedPrice;
    const discountAmount = originalPrice - discountedPrice;

    return (
        <div style={{
            backgroundColor: '#ff6b6b',
            color: 'white',
            padding: '0.5rem',
            borderRadius: '8px',
            marginBottom: '0.5rem',
            textAlign: 'center'
        }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                🔥 FLASH SALE! {flashSale.discountPercentage}% OFF
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {timeLeft && (
                    <span>⏰ Ends in: {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</span>
                )}
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{originalPrice} ETB</span>
                <span style={{ fontWeight: 'bold', marginLeft: '0.5rem' }}>{discountedPrice.toFixed(2)} ETB</span>
                <span style={{ marginLeft: '0.5rem', backgroundColor: '#fff', color: '#ff6b6b', padding: '0.125rem 0.25rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                    Save {discountAmount.toFixed(2)} ETB
                </span>
            </div>
            {flashSale.remainingQuantity <= 10 && (
                <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                    ⚡ Only {flashSale.remainingQuantity} left at this price!
                </div>
            )}
        </div>
    );
};

export default FlashSaleBadge;