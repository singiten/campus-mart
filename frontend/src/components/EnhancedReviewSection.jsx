import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import StarRating from './StarRating';
import Button from './Button';

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

const EnhancedReviewSection = ({ productId }) => {
    const { user, isAuthenticated } = useAuth();
    const { theme } = useTheme();
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [ratingBreakdown, setRatingBreakdown] = useState({});
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('newest');
    const [filterRating, setFilterRating] = useState('all');
    const [replyText, setReplyText] = useState({});
    const [submittingReply, setSubmittingReply] = useState({});

    useEffect(() => {
        fetchReviews();
    }, [productId, sortBy, filterRating]);

    const fetchReviews = async () => {
        try {
            const response = await API.get(`/reviews/product/${productId}?sort=${sortBy}&rating=${filterRating}`);
            setReviews(response.data.data);
            setAverageRating(response.data.averageRating);
            setTotalReviews(response.data.totalReviews);
            setRatingBreakdown(response.data.ratingBreakdown || {});
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleHelpful = async (reviewId) => {
        if (!isAuthenticated) {
            toast.error('Please login to mark reviews as helpful');
            return;
        }
        try {
            await API.post(`/reviews/${reviewId}/helpful`);
            toast.success('Thanks for your feedback!');
            fetchReviews();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to mark as helpful');
        }
    };

    const handleAdminReply = async (reviewId) => {
        if (!replyText[reviewId]?.trim()) {
            toast.error('Please enter a reply');
            return;
        }
        
        setSubmittingReply(prev => ({ ...prev, [reviewId]: true }));
        
        try {
            await API.post(`/reviews/${reviewId}/reply`, { comment: replyText[reviewId] });
            toast.success('Reply added as admin!');
            setReplyText(prev => ({ ...prev, [reviewId]: '' }));
            fetchReviews();
        } catch (error) {
            console.error('Reply error:', error);
            toast.error(error.response?.data?.message || 'Failed to add reply');
        } finally {
            setSubmittingReply(prev => ({ ...prev, [reviewId]: false }));
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    if (loading) return <div style={{ textAlign: 'center', padding: theme?.spacing?.xl, color: theme?.colors?.textLight }}>Loading reviews...</div>;

    return (
        <div style={{ marginTop: theme?.spacing?.xl }}>
            <h3 style={{ color: theme?.colors?.text, marginBottom: theme?.spacing?.md }}>Customer Reviews ({totalReviews})</h3>
            
            {/* Rating Summary */}
            {totalReviews > 0 && (
                <div style={{
                    display: 'flex',
                    gap: theme?.spacing?.xl,
                    flexWrap: 'wrap',
                    padding: theme?.spacing?.md,
                    backgroundColor: theme?.colors?.surface,
                    borderRadius: theme?.borderRadius?.md,
                    marginBottom: theme?.spacing?.lg,
                    border: `1px solid ${theme?.colors?.border}`
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: theme?.colors?.warning }}>
                            {averageRating.toFixed(1)}
                        </div>
                        <StarRating rating={averageRating} />
                        <div style={{ color: theme?.colors?.textLight, fontSize: theme?.typography?.fontSize?.sm }}>Based on {totalReviews} reviews</div>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                        {[5, 4, 3, 2, 1].map(star => (
                            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: theme?.spacing?.sm, marginBottom: theme?.spacing?.xs }}>
                                <span style={{ width: '30px', color: theme?.colors?.text }}>{star} ★</span>
                                <div style={{ flex: 1, backgroundColor: theme?.colors?.border, borderRadius: '10px', height: '8px' }}>
                                    <div style={{
                                        width: `${totalReviews ? (ratingBreakdown[star] || 0) / totalReviews * 100 : 0}%`,
                                        backgroundColor: theme?.colors?.warning,
                                        height: '100%',
                                        borderRadius: '10px'
                                    }} />
                                </div>
                                <span style={{ width: '40px', fontSize: theme?.typography?.fontSize?.sm, color: theme?.colors?.textLight }}>({ratingBreakdown[star] || 0})</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Filter and Sort */}
            {totalReviews > 0 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: theme?.spacing?.md,
                    marginBottom: theme?.spacing?.lg,
                    paddingBottom: theme?.spacing?.sm,
                    borderBottom: `1px solid ${theme?.colors?.border}`
                }}>
                    <div style={{ display: 'flex', gap: theme?.spacing?.sm, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 'bold', color: theme?.colors?.text }}>Filter:</span>
                        <select 
                            value={filterRating} 
                            onChange={(e) => setFilterRating(e.target.value)}
                            style={{ 
                                padding: theme?.spacing?.xs, 
                                borderRadius: theme?.borderRadius?.sm, 
                                border: `1px solid ${theme?.colors?.border}`,
                                backgroundColor: theme?.colors?.surface,
                                color: theme?.colors?.text
                            }}
                        >
                            <option value="all">All ratings</option>
                            <option value="5">★★★★★ (5)</option>
                            <option value="4">★★★★☆ (4+)</option>
                            <option value="3">★★★☆☆ (3+)</option>
                            <option value="2">★★☆☆☆ (2+)</option>
                            <option value="1">★☆☆☆☆ (1+)</option>
                        </select>
                    </div>
                    
                    <div style={{ display: 'flex', gap: theme?.spacing?.sm, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 'bold', color: theme?.colors?.text }}>Sort by:</span>
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{ 
                                padding: theme?.spacing?.xs, 
                                borderRadius: theme?.borderRadius?.sm, 
                                border: `1px solid ${theme?.colors?.border}`,
                                backgroundColor: theme?.colors?.surface,
                                color: theme?.colors?.text
                            }}
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                            <option value="highest">Highest rated</option>
                            <option value="lowest">Lowest rated</option>
                            <option value="helpful">Most helpful</option>
                        </select>
                    </div>
                </div>
            )}
            
            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: theme?.spacing?.xl, backgroundColor: theme?.colors?.surface, borderRadius: theme?.borderRadius?.md, border: `1px solid ${theme?.colors?.border}` }}>
                    <p style={{ color: theme?.colors?.textLight }}>No reviews yet. Be the first to review!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme?.spacing?.md }}>
                    {reviews.map(review => (
                        <div key={review._id} style={{
                            backgroundColor: theme?.colors?.surface,
                            border: `1px solid ${theme?.colors?.border}`,
                            borderRadius: theme?.borderRadius?.md,
                            padding: theme?.spacing?.md
                        }}>
                            {/* Review Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: theme?.spacing?.md, flexWrap: 'wrap', marginBottom: theme?.spacing?.sm }}>
                                <StarRating rating={review.rating} />
                                <strong style={{ color: theme?.colors?.text }}>{review.user?.name}</strong>
                                <small style={{ color: theme?.colors?.textLight }}>
                                    {formatDate(review.createdAt)}
                                </small>
                                {review.isVerifiedPurchase && (
                                    <small style={{ color: theme?.colors?.success }}>✓ Verified Purchase</small>
                                )}
                            </div>
                            
                            {/* Review Comment */}
                            <p style={{ marginTop: theme?.spacing?.xs, lineHeight: 1.5, color: theme?.colors?.text }}>{review.comment}</p>
                            
                            {/* Review Images */}
                            {review.images && review.images.length > 0 && (
                                <div style={{ display: 'flex', gap: theme?.spacing?.sm, marginTop: theme?.spacing?.sm, flexWrap: 'wrap' }}>
                                    {review.images.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={`http://localhost:8003${img}`}
                                            alt={`Review ${idx + 1}`}
                                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: theme?.borderRadius?.md, cursor: 'pointer' }}
                                            onClick={() => window.open(`http://localhost:8003${img}`, '_blank')}
                                        />
                                    ))}
                                </div>
                            )}
                            
                            {/* Helpful Button */}
                            <div style={{ marginTop: theme?.spacing?.sm }}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon="👍"
                                    onClick={() => handleHelpful(review._id)}
                                >
                                    Helpful ({review.helpful?.count || 0})
                                </Button>
                            </div>
                            
                            {/* Admin Reply Display */}
                            {review.vendorReply?.comment && (
                                <div style={{
                                    marginTop: theme?.spacing?.sm,
                                    padding: theme?.spacing?.sm,
                                    backgroundColor: `${theme?.colors?.secondary}10`,
                                    borderRadius: theme?.borderRadius?.md,
                                    marginLeft: theme?.spacing?.md
                                }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: theme?.spacing?.xs, fontSize: theme?.typography?.fontSize?.sm, color: theme?.colors?.secondary }}>
                                        👑 Admin Response
                                    </div>
                                    <p style={{ fontSize: theme?.typography?.fontSize?.sm, color: theme?.colors?.textLight }}>{review.vendorReply.comment}</p>
                                    <small style={{ color: theme?.colors?.textMuted, fontSize: theme?.typography?.fontSize?.xs }}>
                                        {formatDate(review.vendorReply.repliedAt)}
                                    </small>
                                </div>
                            )}
                            
                            {/* Admin Reply Form - Only visible to admin */}
                            {user?.role === 'admin' && !review.vendorReply?.comment && (
                                <div style={{ 
                                    marginTop: theme?.spacing?.md, 
                                    paddingTop: theme?.spacing?.sm, 
                                    borderTop: `1px solid ${theme?.colors?.border}`,
                                    display: 'flex', 
                                    gap: theme?.spacing?.sm,
                                    alignItems: 'center'
                                }}>
                                    <input
                                        type="text"
                                        placeholder="Reply to this review as admin..."
                                        value={replyText[review._id] || ''}
                                        onChange={(e) => setReplyText(prev => ({ ...prev, [review._id]: e.target.value }))}
                                        style={{ 
                                            flex: 1, 
                                            padding: theme?.spacing?.sm, 
                                            border: `1px solid ${theme?.colors?.border}`,
                                            borderRadius: theme?.borderRadius?.md,
                                            backgroundColor: theme?.colors?.surface,
                                            color: theme?.colors?.text
                                        }}
                                    />
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleAdminReply(review._id)}
                                        disabled={submittingReply[review._id]}
                                    >
                                        {submittingReply[review._id] ? 'Replying...' : 'Reply as Admin'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EnhancedReviewSection;