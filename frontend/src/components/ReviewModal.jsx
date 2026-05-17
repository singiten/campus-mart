import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Button from './Button';
import { useTheme } from '../contexts/ThemeContext';

const API = axios.create({ baseURL: 'http://localhost:8003/api' });

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const ReviewModal = ({ product, orderId, onClose, onReviewSubmitted }) => {
    const { theme } = useTheme();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!comment.trim()) {
            toast.error('Please write a review comment');
            return;
        }
        
        setSubmitting(true);
        
        try {
            const response = await API.post('/reviews', {
                productId: product._id,
                orderId: orderId,
                rating: rating,
                comment: comment
            });
            
            if (response.data.success) {
                toast.success('Review submitted! Thank you for your feedback.');
                if (onReviewSubmitted) onReviewSubmitted(response.data);
                onClose();
            }
        } catch (error) {
            console.error('Review error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span
                    key={i}
                    onClick={() => setRating(i)}
                    onMouseEnter={() => setHoverRating(i)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                        fontSize: '2rem',
                        cursor: 'pointer',
                        color: (hoverRating || rating) >= i ? '#f39c12' : '#ddd',
                        transition: 'color 0.2s'
                    }}
                >
                    ★
                </span>
            );
        }
        return stars;
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000
        }}>
            <div style={{
                backgroundColor: theme?.colors?.surface,
                borderRadius: theme?.borderRadius?.lg || '16px',
                padding: '2rem',
                width: '90%',
                maxWidth: '500px',
                textAlign: 'center'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ color: theme?.colors?.text }}>Rate & Review</h2>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#999'
                    }}>×</button>
                </div>
                
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <h3 style={{ color: theme?.colors?.text, marginTop: '0.5rem' }}>{product.name}</h3>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: theme?.colors?.text }}>
                            Your Rating
                        </label>
                        <div>{renderStars()}</div>
                        <p style={{ fontSize: '0.875rem', color: theme?.colors?.textLight, marginTop: '0.5rem' }}>
                            {rating === 5 ? 'Excellent!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                        </p>
                    </div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: theme?.colors?.text }}>
                            Your Review
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience with this product..."
                            rows="4"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: `1px solid ${theme?.colors?.border}`,
                                borderRadius: theme?.borderRadius?.md || '8px',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                backgroundColor: theme?.colors?.surface,
                                color: theme?.colors?.text
                            }}
                        />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button
                            type="submit"
                            variant="success"
                            fullWidth
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            fullWidth
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;