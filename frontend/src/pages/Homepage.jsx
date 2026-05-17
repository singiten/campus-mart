import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { getProducts } from '../services/api';
import CampusSelector from '../components/CampusSelector';
import StarRating from '../components/StarRating';
import { toast } from 'react-toastify';
import axios from 'axios';
import { getAllCategories, getCategoryById, getCategoryColor } from '../utils/categories';
import { useTheme } from '../contexts/ThemeContext';

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

const Homepage = () => {
    const navigate = useNavigate();
    const { selectedCampus, isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [wishlistItems, setWishlistItems] = useState({});
    const [flashSales, setFlashSales] = useState([]);
    const { theme } = useTheme();

    useEffect(() => {
        fetchProducts();
        fetchFlashSales();
    }, [selectedCampus, category, search]);

    useEffect(() => {
        if (isAuthenticated) {
            checkWishlistStatus();
        }
    }, [isAuthenticated, products]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = {
                campus: selectedCampus,
                ...(category !== 'all' && { category }),
                ...(search && { search })
            };
            const response = await getProducts(params);
            setProducts(response.data.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFlashSales = async () => {
        try {
            const response = await API.get('/flash-sales/active');
            setFlashSales(response.data.data);
        } catch (error) {
            console.error('Error fetching flash sales:', error);
        }
    };

    const checkWishlistStatus = async () => {
        if (!isAuthenticated) return;
        try {
            const response = await API.get('/wishlist');
            const products = response.data.data?.products || [];
            const wishlistMap = {};
            products.forEach(item => {
                if (item.product) {
                    wishlistMap[item.product._id] = true;
                }
            });
            setWishlistItems(wishlistMap);
        } catch (error) {
            console.error('Error checking wishlist:', error);
        }
    };

    const addToWishlist = async (productId, productName) => {
        if (!isAuthenticated) {
            toast.error('Please login to save to wishlist');
            return;
        }
        try {
            await API.post('/wishlist/add', { productId });
            setWishlistItems(prev => ({ ...prev, [productId]: true }));
            toast.success(`❤️ Added ${productName} to wishlist!`);
        } catch (error) {
            if (error.response?.data?.message === 'Product already in wishlist') {
                toast.info(`${productName} is already in your wishlist`);
            } else {
                toast.error('Failed to add to wishlist');
            }
        }
    };

    const removeFromWishlist = async (productId, productName) => {
        try {
            await API.delete(`/wishlist/remove/${productId}`);
            setWishlistItems(prev => ({ ...prev, [productId]: false }));
            toast.success(`Removed ${productName} from wishlist`);
        } catch (error) {
            toast.error('Failed to remove from wishlist');
        }
    };

    const handleWishlistClick = (product) => {
        if (wishlistItems[product._id]) {
            removeFromWishlist(product._id, product.name);
        } else {
            addToWishlist(product._id, product.name);
        }
    };

   const categories = [
    { id: 'all', name: 'All', icon: '📦' },
    ...getAllCategories().map(cat => ({
        id: cat.id,
        name: cat.displayName,
        icon: cat.icon
    }))
];


    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Campus Selector */}
            <CampusSelector />

            {/* Group Deal Banner */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                textAlign: 'center'
            }}>
                <h2>🔥 Group Order Deals</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <div>5 Members: 15% OFF</div>
                    <div>6 Members: 20% OFF</div>
                    <div>7 Members: 25% OFF</div>
                    <div>8+ Members: 30% OFF + FREE Delivery!</div>
                </div>
            </div>

            {/* Flash Sales Section */}
            {flashSales.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h2>🔥 Hot Flash Sales</h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '1rem',
                        marginTop: '1rem'
                    }}>
                        {flashSales.map(sale => (
                            <div key={sale._id} style={{
                                backgroundColor: '#fff5f5',
                                border: '2px solid #ff6b6b',
                                borderRadius: '12px',
                                padding: '1rem',
                                position: 'relative',
                                cursor: 'pointer'
                            }}
                            onClick={() => navigate(`/product/${sale.product._id}`)}>
                                <div style={{
                                    position: 'absolute',
                                    top: '-10px',
                                    right: '-10px',
                                    backgroundColor: '#ff6b6b',
                                    color: 'white',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold'
                                }}>
                                    -{sale.discountPercentage}%
                                </div>
                                <img
                                    src={sale.product.imageUrl}
                                    alt={sale.product.name}
                                    style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                                />
                                <h4 style={{ marginTop: '0.5rem' }}>{sale.product.name}</h4>
                                <div>
                                    <span style={{ textDecoration: 'line-through', color: '#999' }}>
                                        {sale.product.originalPrice} ETB
                                    </span>
                                    <span style={{ fontWeight: 'bold', color: '#ff6b6b', marginLeft: '0.5rem' }}>
                                        {sale.product.discountedPrice.toFixed(2)} ETB
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/product/${sale.product._id}`);
                                    }}
                                    style={{
                                        width: '100%',
                                        marginTop: '0.5rem',
                                        padding: '0.5rem',
                                        backgroundColor: '#ff6b6b',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Shop Now 🔥
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <input
                type="text"
                placeholder="🔍 Search snacks, accessories, essentials..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    marginBottom: '1.5rem'
                }}
            />

            {/* Category Tabs */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                flexWrap: 'wrap'
            }}>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        style={{
                            padding: '0.5rem 1.5rem',
                            backgroundColor: category === cat.id ? '#667eea' : '#f0f0f0',
                            color: category === cat.id ? 'white' : '#333',
                            border: 'none',
                            borderRadius: '25px',
                            cursor: 'pointer',
                            fontWeight: category === cat.id ? 'bold' : 'normal'
                        }}
                    >
                        {cat.icon} {cat.name}
                    </button>
                ))}
            </div>

            {/* Products Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Loading products...</div>
            ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                    No products found in this campus
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {products.map(product => (
                        <div key={product._id} style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                            transition: 'transform 0.3s',
                            cursor: 'pointer',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                                />
                            </Link>
                            <div style={{ padding: '1rem', flex: 1 }}>
                                <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
                                    <h3 style={{ marginBottom: '0.5rem', color: '#333', fontSize: '1.1rem' }}>{product.name}</h3>
                                </Link>
                                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    {product.description?.substring(0, 60)}...
                                </p>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <StarRating 
                                        rating={product.averageRating || 0} 
                                        showCount={true} 
                                        reviewCount={product.numberOfReviews || 0} 
                                    />
                                </div>
                                <div style={{
    display: 'inline-block',
    backgroundColor: getCategoryById(product.category)?.bgColor || '#f0f0f0',
    color: getCategoryById(product.category)?.color || '#666',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    marginBottom: '0.5rem'
}}>
    {getCategoryById(product.category)?.icon} {getCategoryById(product.category)?.name}
</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>
                                        {product.price} ETB
                                    </span>

                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <Link to={`/product/${product._id}`} style={{ flex: 1, textDecoration: 'none' }}>
                                        <button style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            backgroundColor: '#3498db',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem'
                                        }}>
                                            View Details
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => addToCart(product, 1)}
                                        style={{
                                            padding: '0.5rem',
                                            backgroundColor: '#27ae60',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                        title="Add to Cart"
                                    >
                                        🛒
                                    </button>
                                    <button
                                        onClick={() => handleWishlistClick(product)}
                                        style={{
                                            padding: '0.5rem',
                                            backgroundColor: wishlistItems[product._id] ? '#e74c3c' : '#ccc',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                        title={wishlistItems[product._id] ? 'Remove from Wishlist' : 'Save to Wishlist'}
                                    >
                                        {wishlistItems[product._id] ? '❤️' : '🤍'}
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
// Add this temporarily in your component
console.log('Google Maps API Key:', process.env.REACT_APP_GOOGLE_MAPS_API_KEY);
export default Homepage;