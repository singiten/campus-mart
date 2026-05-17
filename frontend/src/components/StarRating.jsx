import React from 'react';

const StarRating = ({ rating, showCount = false, reviewCount = 0 }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
                {[...Array(fullStars)].map((_, i) => (
                    <span key={`full-${i}`} style={{ color: '#f39c12', fontSize: '1rem' }}>★</span>
                ))}
                {hasHalfStar && (
                    <span style={{ color: '#f39c12', fontSize: '1rem' }}>½</span>
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <span key={`empty-${i}`} style={{ color: '#ddd', fontSize: '1rem' }}>★</span>
                ))}
            </div>
            {showCount && (
                <span style={{ fontSize: '0.75rem', color: '#666' }}>
                    ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
            )}
        </div>
    );
};

export default StarRating;