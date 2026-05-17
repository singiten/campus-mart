// src/components/ProductCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Button from './Button';
import StarRating from './StarRating';

const ProductCard = ({ product, onAddToCart, onWishlistToggle, isInWishlist }) => {
    const { theme } = useTheme();

    return (
        <div
            style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
                boxShadow: theme.shadows.card,
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = theme.shadows.cardHover;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = theme.shadows.card;
            }}
        >
            <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    {product.flashSale && (
                        <div style={{
                            position: 'absolute',
                            top: theme.spacing.sm,
                            right: theme.spacing.sm,
                            backgroundColor: theme.colors.warning,
                            color: theme.colors.primaryDark,
                            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                            borderRadius: theme.borderRadius.pill,
                            fontSize: theme.typography.fontSize.xs,
                            fontWeight: theme.typography.fontWeight.bold
                        }}>
                            🔥 -{product.flashSale}%
                        </div>
                    )}
                </div>
            </Link>

            <div style={{ padding: theme.spacing.md, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                        display: 'inline-block',
                        backgroundColor: theme.colors.borderLight,
                        color: theme.colors.textLight,
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        borderRadius: theme.borderRadius.pill,
                        fontSize: theme.typography.fontSize.xs,
                        marginBottom: theme.spacing.sm
                    }}>
                        {product.categoryIcon} {product.categoryName}
                    </div>
                    <h3 style={{
                        fontSize: theme.typography.fontSize.md,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.text,
                        marginBottom: theme.spacing.xs,
                        lineHeight: 1.4
                    }}>
                        {product.name}
                    </h3>
                </Link>

                <p style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textLight,
                    marginBottom: theme.spacing.sm,
                    lineHeight: 1.5,
                    flex: 1
                }}>
                    {product.description?.substring(0, 60)}...
                </p>

                <StarRating rating={product.averageRating || 0} showCount reviewCount={product.numberOfReviews || 0} />

                <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: theme.spacing.sm,
                    marginTop: theme.spacing.md,
                    marginBottom: theme.spacing.md
                }}>
                    {product.discountedPrice ? (
                        <>
                            <span style={{
                                fontSize: theme.typography.fontSize.xl,
                                fontWeight: theme.typography.fontWeight.bold,
                                color: theme.colors.warning
                            }}>
                                {product.discountedPrice} ETB
                            </span>
                            <span style={{
                                fontSize: theme.typography.fontSize.sm,
                                color: theme.colors.textLight,
                                textDecoration: 'line-through'
                            }}>
                                {product.price} ETB
                            </span>
                        </>
                    ) : (
                        <span style={{
                            fontSize: theme.typography.fontSize.xl,
                            fontWeight: theme.typography.fontWeight.bold,
                            color: theme.colors.primary
                        }}>
                            {product.price} ETB
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                    <Link to={`/product/${product._id}`} style={{ flex: 1 }}>
                        <Button variant="outline" size="sm" fullWidth>
                            View Details
                        </Button>
                    </Link>
                    <Button
                        variant="success"
                        size="sm"
                        icon="🛒"
                        onClick={() => onAddToCart(product)}
                        disabled={product.stock === 0}
                    />
                    <Button
                        variant={isInWishlist ? 'danger' : 'ghost'}
                        size="sm"
                        icon={isInWishlist ? '❤️' : '🤍'}
                        onClick={() => onWishlistToggle(product)}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProductCard;