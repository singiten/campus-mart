import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-toastify';
import axios from 'axios';

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

const Wishlist = () => {
    const [wishlist, setWishlist] = useState(null);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();

    useEffect(() => {
        if (isAuthenticated) {
            fetchWishlist();
        }
    }, [isAuthenticated]);

    const fetchWishlist = async () => {
        try {
            const response = await API.get('/wishlist');
            setWishlist(response.data.data);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            toast.error('Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromWishlist = async (productId, productName) => {
        try {
            await API.delete(`/wishlist/remove/${productId}`);
            toast.success(`Removed ${productName} from wishlist`);
            fetchWishlist();
        } catch (error) {
            toast.error('Failed to remove from wishlist');
        }
    };

    const handleAddToCart = (product) => {
        addToCart(product, 1);
        toast.success(`Added ${product.name} to cart`);
    };

    if (!isAuthenticated) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Login to View Wishlist</h2>
                <p>Save your favorite products for later</p>
                <Link to="/login">
                    <button style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}>
                        Login Now
                    </button>
                </Link>
            </div>
        );
    }

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading wishlist...</div>;
    }

    const products = wishlist?.products || [];
    const productsList = products.map(p => p.product).filter(p => p !== null);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>My Wishlist 💚</h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
                Products you've saved for later
            </p>

            {productsList.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '12px'
                }}>
                    <p style={{ fontSize: '1.2rem', color: '#666' }}>Your wishlist is empty</p>
                    <p style={{ marginTop: '0.5rem', color: '#999' }}>
                        Browse products and click the ❤️ button to save them here
                    </p>
                    <Link to="/products">
                        <button style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}>
                            Browse Products
                        </button>
                    </Link>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {productsList.map(item => (
                        <div key={item._id} style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                            transition: 'transform 0.3s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <Link to={`/product/${item._id}`}>
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                                />
                            </Link>
                            <div style={{ padding: '1rem' }}>
                                <Link to={`/product/${item._id}`} style={{ textDecoration: 'none' }}>
                                    <h3 style={{ marginBottom: '0.5rem', color: '#333' }}>{item.name}</h3>
                                </Link>
                                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    {item.category}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>
                                        {item.price} ETB
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#999' }}>
                                        Stock: {item.stock}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                    <button
                                        onClick={() => handleAddToCart(item)}
                                        disabled={item.stock === 0}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            backgroundColor: '#27ae60',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: item.stock === 0 ? 'not-allowed' : 'pointer',
                                            opacity: item.stock === 0 ? 0.6 : 1
                                        }}
                                    >
                                        🛒 Add to Cart
                                    </button>
                                    <button
                                        onClick={() => handleRemoveFromWishlist(item._id, item.name)}
                                        style={{
                                            padding: '0.5rem',
                                            backgroundColor: '#e74c3c',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ❌ Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wishlist;