import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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

const VendorDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        category: 'snacks',
        price: '',
        stock: '',
        imageUrl: ''
    });
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        if (user?.role === 'vendor') {
            fetchProducts();
            fetchOrders();
            fetchStats();
            fetchVendorStatus();
        }
    }, [user]);

    const fetchProducts = async () => {
        try {
            const response = await API.get('/vendor/products');
            setProducts(response.data.data);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await API.get('/vendor/orders');
            setOrders(response.data.data);
            console.log('Orders fetched:', response.data.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await API.get('/vendor/stats');
            setStats(response.data.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchVendorStatus = async () => {
        try {
            const response = await API.get('/vendor/profile');
            if (response.data.success) {
                setIsOpen(response.data.data.isActive);
            }
        } catch (error) {
            console.error('Error fetching vendor status:', error);
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        
        try {
            const response = await API.put(`/vendor/products/${editingProduct._id}`, {
                price: parseFloat(productForm.price),
                stock: parseInt(productForm.stock),
                isAvailable: true
            });
            
            if (response.data.success) {
                toast.success('Product updated successfully!');
                setShowProductModal(false);
                setEditingProduct(null);
                setProductForm({ name: '', description: '', category: 'snacks', price: '', stock: '', imageUrl: '' });
                fetchProducts();
                fetchStats();
            }
        } catch (error) {
            console.error('Update product error:', error);
            const errorMsg = error.response?.data?.message || 'Failed to update product';
            toast.error(errorMsg);
        }
    };

    const handleUpdateOrderStatus = async (orderId, status) => {
        try {
            const response = await API.put(`/vendor/orders/${orderId}/status`, { status });
            if (response.data.success) {
                toast.success(`Order status updated to ${status}`);
                fetchOrders();
                fetchStats();
            }
        } catch (error) {
            console.error('Update order status error:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleToggleAvailability = async () => {
        try {
            const response = await API.put('/vendor/availability', { isActive: !isOpen });
            
            if (response.data.success) {
                setIsOpen(!isOpen);
                toast.success(`Store is now ${!isOpen ? 'open' : 'closed'}`);
                fetchStats();
            }
        } catch (error) {
            console.error('Toggle availability error:', error);
            toast.error('Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: '#f39c12',
            confirmed: '#3498db',
            preparing: '#9b59b6',
            ready: '#1abc9c',
            delivered: '#27ae60',
            cancelled: '#e74c3c'
        };
        return colors[status] || '#95a5a6';
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: '⏳',
            confirmed: '✅',
            preparing: '🍳',
            ready: '🛵',
            delivered: '📦',
            cancelled: '❌'
        };
        return icons[status] || '📋';
    };

    if (user?.role !== 'vendor') {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Access Denied</h2>
                <p>You don't have vendor access. Please contact admin.</p>
            </div>
        );
    }

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>;
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Vendor Dashboard</h1>
                    <p style={{ color: '#666' }}>Manage products and fulfill orders</p>
                </div>
                <button
                    onClick={handleToggleAvailability}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: isOpen ? '#27ae60' : '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    {isOpen ? '🟢 Store Open' : '🔴 Store Closed'}
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <h3>💰 Total Revenue</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#27ae60' }}>{stats.totalRevenue} ETB</p>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <h3>📦 Total Orders</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3498db' }}>{stats.totalOrders}</p>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <h3>🛍️ Products</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9b59b6' }}>{stats.totalProducts}</p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                borderBottom: '2px solid #e0e0e0',
                marginBottom: '1.5rem'
            }}>
                <button
                    onClick={() => setActiveTab('products')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: activeTab === 'products' ? '#667eea' : 'transparent',
                        color: activeTab === 'products' ? 'white' : '#666',
                        border: 'none',
                        borderRadius: '8px 8px 0 0',
                        cursor: 'pointer'
                    }}
                >
                    📦 Products ({products.length})
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: activeTab === 'orders' ? '#667eea' : 'transparent',
                        color: activeTab === 'orders' ? 'white' : '#666',
                        border: 'none',
                        borderRadius: '8px 8px 0 0',
                        cursor: 'pointer'
                    }}
                >
                    📋 Orders ({orders.length})
                </button>
            </div>

            {/* Products Tab */}
            {activeTab === 'products' && (
                <div>
                    {products.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f9f9f9', borderRadius: '12px' }}>
                            <p>No products available. Contact admin to add products.</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                            gap: '1rem'
                        }}>
                            {products.map(product => (
                                <div key={product._id} style={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}>
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                                    />
                                    <h3 style={{ marginTop: '0.5rem' }}>{product.name}</h3>
                                    <p style={{ color: '#27ae60', fontWeight: 'bold' }}>{product.price} ETB</p>
                                    <p>Stock: {product.stock}</p>
                                    <p style={{ fontSize: '0.875rem', color: '#666' }}>{product.category}</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <button
                                            onClick={() => {
                                                setEditingProduct(product);
                                                setProductForm({
                                                    name: product.name,
                                                    description: product.description,
                                                    category: product.category,
                                                    price: product.price,
                                                    stock: product.stock,
                                                    imageUrl: product.imageUrl
                                                });
                                                setShowProductModal(true);
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem',
                                                backgroundColor: '#3498db',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Edit Stock/Price
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <div>
                    {orders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f9f9f9', borderRadius: '12px' }}>
                            <p>No orders yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {orders.map(order => (
                                <div key={order._id} style={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                        <div>
                                            <strong>Order #{order._id.slice(-8)}</strong>
                                            <span style={{ marginLeft: '1rem', color: '#666', fontSize: '0.875rem' }}>
                                                {new Date(order.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <span style={{
                                            backgroundColor: getStatusColor(order.status),
                                            color: 'white',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold'
                                        }}>
                                            {getStatusIcon(order.status)} {order.status.toUpperCase()}
                                        </span>
                                    </div>
                                    
                                    <div>
                                        <p><strong>Customer:</strong> {order.user?.name}</p>
                                        <p><strong>Phone:</strong> {order.user?.phone}</p>
                                        <p><strong>Delivery:</strong> {order.campus} - {order.dorm} {order.roomNumber ? `, Room ${order.roomNumber}` : ''}</p>
                                    </div>
                                    
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <strong>Items:</strong>
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} style={{ marginLeft: '1rem', padding: '0.25rem 0', borderBottom: idx !== order.items.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                                {item.name} x {item.quantity} = {item.price * item.quantity} ETB
                                            </div>
                                        ))}
                                        <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
                                            Total: {order.totalAmount} ETB (Delivery: {order.deliveryFee} ETB)
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                            style={{
                                                padding: '0.5rem',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                backgroundColor: 'white',
                                                cursor: 'pointer',
                                                flex: 1
                                            }}
                                        >
                                            <option value="pending">⏳ Pending</option>
                                            <option value="confirmed">✅ Confirmed</option>
                                            <option value="preparing">🍳 Preparing</option>
                                            <option value="ready">🛵 Ready</option>
                                            <option value="delivered">📦 Delivered</option>
                                            <option value="cancelled">❌ Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Edit Product Modal (Stock & Price Only) */}
            {showProductModal && editingProduct && (
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
                    zIndex: 1000
                }}>
                    <form onSubmit={handleUpdateProduct} style={{
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '450px'
                    }}>
                        <h2>Edit Product: {editingProduct.name}</h2>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Price (ETB)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={productForm.price}
                                onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                                required
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Stock Quantity</label>
                            <input
                                type="number"
                                value={productForm.stock}
                                onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                                required
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>
                        
                        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#856404' }}>
                                ℹ️ You can only update price and stock. Product name, description, and category can only be changed by admin.
                            </p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" style={{
                                flex: 1,
                                padding: '0.75rem',
                                backgroundColor: '#27ae60',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}>
                                Update Product
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowProductModal(false);
                                    setEditingProduct(null);
                                    setProductForm({ name: '', description: '', category: 'snacks', price: '', stock: '', imageUrl: '' });
                                }}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    backgroundColor: '#ccc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default VendorDashboard;