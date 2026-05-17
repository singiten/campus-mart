import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import FlashSaleManagement from '../components/FlashSaleManagement';
import { getAllCategories, getSubcategories, getCategoryById } from '../utils/categories';

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

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [unassignedOrders, setUnassignedOrders] = useState([]);
    const [availableVendors, setAvailableVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedVendor, setSelectedVendor] = useState('');
    const [subcategories, setSubcategories] = useState([]);
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        category: '',
        subcategory: '',
        price: '',
        stock: '',
        vendorId: '',
        imageUrl: ''
    });
    const [vendorForm, setVendorForm] = useState({
        userId: '',
        businessName: '',
        description: '',
        campus: '4kilo',
        availabilityType: 'full-time',
        partTimeHours: []
    });

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchAllData();
            fetchUnassignedOrders();
        }
    }, [user]);

    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchStats(),
            fetchUsers(),
            fetchVendors(),
            fetchProducts(),
            fetchOrders()
        ]);
        setLoading(false);
    };

    const fetchStats = async () => {
        try {
            const response = await API.get('/admin/stats');
            setStats(response.data.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await API.get('/admin/users');
            setUsers(response.data.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchVendors = async () => {
        try {
            const response = await API.get('/admin/vendors');
            setVendors(response.data.data);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await API.get('/admin/products');
            setProducts(response.data.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await API.get('/admin/orders');
            setOrders(response.data.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const fetchUnassignedOrders = async () => {
        try {
            const response = await API.get('/admin/orders/unassigned');
            setUnassignedOrders(response.data.data);
        } catch (error) {
            console.error('Error fetching unassigned orders:', error);
        }
    };

    const fetchAvailableVendors = async (campus) => {
        try {
            const response = await API.get(`/admin/vendors/available/${campus}`);
            setAvailableVendors(response.data.data);
        } catch (error) {
            console.error('Error fetching available vendors:', error);
        }
    };

    const handleUpdateUserRole = async (userId, role) => {
        try {
            await API.put(`/admin/users/${userId}/role`, { role });
            toast.success(`User role updated to ${role}`);
            await fetchAllData();
        } catch (error) {
            toast.error('Failed to update role');
        }
    };

    const handleToggleVendorStatus = async (vendorId, isActive) => {
        try {
            await API.put(`/admin/vendors/${vendorId}/status`, { isActive: !isActive });
            toast.success(`Vendor ${isActive ? 'deactivated' : 'activated'}`);
            await fetchAllData();
        } catch (error) {
            toast.error('Failed to update vendor status');
        }
    };

    const handleToggleVendorAvailability = async (vendorId, isCurrentlyActive) => {
        try {
            await API.put(`/admin/vendors/${vendorId}/availability`, { isCurrentlyActive: !isCurrentlyActive });
            toast.success(`Vendor availability updated`);
            await fetchAllData();
        } catch (error) {
            toast.error('Failed to update availability');
        }
    };

    const handleCreateVendor = async (e) => {
        e.preventDefault();
        try {
            await API.post('/admin/vendors', vendorForm);
            toast.success('Vendor created successfully!');
            setShowVendorModal(false);
            setVendorForm({
                userId: '',
                businessName: '',
                description: '',
                campus: '4kilo',
                availabilityType: 'full-time',
                partTimeHours: []
            });
            await fetchAllData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create vendor');
        }
    };

    const handleAssignOrder = async () => {
        if (!selectedVendor) {
            toast.error('Please select a vendor');
            return;
        }
        
        try {
            await API.put(`/admin/orders/${selectedOrder._id}/assign`, { vendorId: selectedVendor });
            toast.success(`Order assigned to vendor`);
            setShowAssignModal(false);
            setSelectedOrder(null);
            setSelectedVendor('');
            await fetchAllData();
            await fetchUnassignedOrders();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign order');
        }
    };

    const handleUpdateDeliveryStatus = async (orderId, status) => {
        try {
            await API.put(`/admin/orders/${orderId}/delivery-status`, { status });
            toast.success(`Order status updated to ${status}`);
            await fetchAllData();
            await fetchUnassignedOrders();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleCategoryChange = (e) => {
        const categoryId = e.target.value;
        setProductForm({ ...productForm, category: categoryId, subcategory: '' });
        setSubcategories(getSubcategories(categoryId));
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        
        if (!productForm.name || !productForm.price || !productForm.stock || !productForm.category || !productForm.subcategory || !productForm.vendorId) {
            toast.error('Please fill all required fields');
            return;
        }
        
        try {
            await API.post('/admin/products', productForm);
            toast.success('Product created successfully!');
            setShowProductModal(false);
            setProductForm({
                name: '',
                description: '',
                category: '',
                subcategory: '',
                price: '',
                stock: '',
                vendorId: '',
                imageUrl: ''
            });
            setSubcategories([]);
            await fetchAllData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create product');
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm('Delete this product?')) {
            try {
                await API.delete(`/admin/products/${productId}`);
                toast.success('Product deleted');
                await fetchAllData();
            } catch (error) {
                toast.error('Failed to delete product');
            }
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: '#f39c12',
            assigned: '#3498db',
            picked_up: '#9b59b6',
            in_transit: '#1abc9c',
            delivered: '#27ae60',
            cancelled: '#e74c3c'
        };
        return colors[status] || '#95a5a6';
    };

    const getStatusText = (status) => {
        const texts = {
            pending: '⏳ Pending',
            assigned: '📋 Assigned',
            picked_up: '📦 Picked Up',
            in_transit: '🚚 In Transit',
            delivered: '✅ Delivered',
            cancelled: '❌ Cancelled'
        };
        return texts[status] || status;
    };

    const openAssignModal = (order) => {
        setSelectedOrder(order);
        fetchAvailableVendors(order.campus);
        setShowAssignModal(true);
    };

    if (user?.role !== 'admin') {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Access Denied</h2>
                <p>Admin access required.</p>
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
                    <h1 style={{ marginBottom: '0.5rem' }}>Admin Dashboard</h1>
                    <p style={{ color: '#666' }}>Manage users, vendors, products, orders, and deliveries</p>
                </div>
                <button
                    onClick={() => navigate('/admin/analytics')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    📊 View Analytics
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
                        <h3>👥 Users</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalUsers}</p>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <h3>🏪 Vendors</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalVendors}</p>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <h3>🛍️ Products</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalProducts}</p>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <h3>📦 Orders</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalOrders}</p>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <h3>💰 Revenue</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#27ae60' }}>{stats.totalRevenue} ETB</p>
                    </div>
                    <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <h3>⏳ Pending Orders</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e67e22' }}>{stats.pendingOrders}</p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '2px solid #e0e0e0',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
            }}>
                <button onClick={() => setActiveTab('overview')} style={{ padding: '0.75rem 1.5rem', backgroundColor: activeTab === 'overview' ? '#667eea' : 'transparent', color: activeTab === 'overview' ? 'white' : '#666', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>📊 Overview</button>
                <button onClick={() => setActiveTab('users')} style={{ padding: '0.75rem 1.5rem', backgroundColor: activeTab === 'users' ? '#667eea' : 'transparent', color: activeTab === 'users' ? 'white' : '#666', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>👥 Users</button>
                <button onClick={() => setActiveTab('vendors')} style={{ padding: '0.75rem 1.5rem', backgroundColor: activeTab === 'vendors' ? '#667eea' : 'transparent', color: activeTab === 'vendors' ? 'white' : '#666', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🏪 Vendors</button>
                <button onClick={() => setActiveTab('products')} style={{ padding: '0.75rem 1.5rem', backgroundColor: activeTab === 'products' ? '#667eea' : 'transparent', color: activeTab === 'products' ? 'white' : '#666', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🛍️ Products</button>
                <button onClick={() => setActiveTab('orders')} style={{ padding: '0.75rem 1.5rem', backgroundColor: activeTab === 'orders' ? '#667eea' : 'transparent', color: activeTab === 'orders' ? 'white' : '#666', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>📋 Orders & Assignments</button>
                <button onClick={() => setActiveTab('flashsales')} style={{ padding: '0.75rem 1.5rem', backgroundColor: activeTab === 'flashsales' ? '#667eea' : 'transparent', color: activeTab === 'flashsales' ? 'white' : '#666', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🔥 Flash Sales</button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div>
                    <h2>Recent Orders</h2>
                    {stats?.recentOrders?.length === 0 ? (
                        <p>No orders yet</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {stats?.recentOrders?.map(order => (
                                <div key={order._id} style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #eee' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                        <span><strong>Order #{order._id.slice(-8)}</strong></span>
                                        <span>👤 {order.user?.name}</span>
                                        <span>💰 {order.totalAmount} ETB</span>
                                        <span style={{ color: getStatusColor(order.status) }}>{getStatusText(order.status)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
                        <thead style={{ backgroundColor: '#f5f5f5' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Campus</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '1rem' }}>{user.name}</td>
                                    <td style={{ padding: '1rem' }}>{user.email}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <select value={user.role} onChange={(e) => handleUpdateUserRole(user._id, e.target.value)} style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}>
                                            <option value="student">Student</option>
                                            <option value="vendor">Vendor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{user.campus || '-'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        {user.role !== 'admin' && (
                                            <button onClick={() => handleUpdateUserRole(user._id, 'vendor')} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' }}>Make Vendor</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Vendors Tab */}
            {activeTab === 'vendors' && (
                <div>
                    <button onClick={() => setShowVendorModal(true)} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>+ Add New Vendor</button>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
                            <thead style={{ backgroundColor: '#f5f5f5' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Business</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Owner</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Campus</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Availability</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Completed</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendors.map(vendor => (
                                    <tr key={vendor._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '1rem' }}>{vendor.businessName}</td>
                                        <td style={{ padding: '1rem' }}>{vendor.user?.name}</td>
                                        <td style={{ padding: '1rem' }}>{vendor.campus}</td>
                                        <td style={{ padding: '1rem' }}>
                                            {vendor.availability?.type === 'full-time' ? '🟢 Full-time' : '🕐 Part-time'}
                                            <br/>
                                            <span style={{ fontSize: '0.75rem', color: vendor.availability?.isCurrentlyActive ? '#27ae60' : '#e74c3c' }}>
                                                {vendor.availability?.isCurrentlyActive ? 'Available Now' : 'Offline'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ color: vendor.isActive ? '#27ae60' : '#e74c3c' }}>
                                                {vendor.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{vendor.completedDeliveries || 0} deliveries</td>
                                        <td style={{ padding: '1rem' }}>
                                            <button onClick={() => handleToggleVendorStatus(vendor._id, vendor.isActive)} style={{ padding: '0.25rem 0.5rem', backgroundColor: vendor.isActive ? '#e74c3c' : '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' }}>
                                                {vendor.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button onClick={() => handleToggleVendorAvailability(vendor._id, vendor.availability?.isCurrentlyActive)} style={{ padding: '0.25rem 0.5rem', backgroundColor: vendor.availability?.isCurrentlyActive ? '#e74c3c' : '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                                {vendor.availability?.isCurrentlyActive ? 'Set Offline' : 'Set Online'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
                <div>
                    <button onClick={() => setShowProductModal(true)} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>+ Add New Product</button>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                        {products.map(product => (
                            <div key={product._id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                                <h3>{product.name}</h3>
                                <p style={{ color: '#27ae60', fontWeight: 'bold' }}>{product.price} ETB</p>
                                <p style={{ fontSize: '0.875rem', color: '#666' }}>
                                    {getCategoryById(product.category)?.icon} {getCategoryById(product.category)?.name} • {product.subcategory}
                                </p>
                                <p style={{ fontSize: '0.875rem', color: '#666' }}>{product.vendor?.businessName}</p>
                                <p>Stock: {product.stock}</p>
                                <button onClick={() => handleDeleteProduct(product._id)} style={{ width: '100%', marginTop: '0.5rem', padding: '0.25rem', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Orders & Assignments Tab */}
            {activeTab === 'orders' && (
                <div>
                    <h2>Unassigned Orders</h2>
                    {unassignedOrders.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No pending orders to assign</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            {unassignedOrders.map(order => (
                                <div key={order._id} style={{ backgroundColor: '#fff3cd', borderRadius: '12px', padding: '1rem', border: '1px solid #ffeaa7' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                        <div><strong>Order #{order._id.slice(-8)}</strong> - {new Date(order.createdAt).toLocaleString()}</div>
                                        <span style={{ backgroundColor: '#f39c12', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem' }}>⏳ PENDING ASSIGNMENT</span>
                                    </div>
                                    <p><strong>Customer:</strong> {order.user?.name} ({order.user?.phone})</p>
                                    <p><strong>Delivery:</strong> {order.campus} - {order.dorm}</p>
                                    <p><strong>Total:</strong> {order.totalAmount} ETB (Delivery: {order.deliveryFee} ETB)</p>
                                    <button onClick={() => openAssignModal(order)} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                        📋 Assign to Vendor
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <h2>All Orders</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {orders.map(order => (
                            <div key={order._id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                    <div><strong>Order #{order._id.slice(-8)}</strong> - {new Date(order.createdAt).toLocaleString()}</div>
                                    <span style={{ backgroundColor: getStatusColor(order.status), color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem' }}>{getStatusText(order.status)}</span>
                                </div>
                                <p><strong>Customer:</strong> {order.user?.name} ({order.user?.email})</p>
                                <p><strong>Delivery:</strong> {order.campus} - {order.dorm}</p>
                                <p><strong>Vendor:</strong> {order.assignedVendor?.businessName || 'Not assigned'}</p>
                                <p><strong>Total:</strong> {order.totalAmount} ETB</p>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <select 
                                        value={order.status} 
                                        onChange={(e) => handleUpdateDeliveryStatus(order._id, e.target.value)} 
                                        style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="assigned">Assigned</option>
                                        <option value="picked_up">Picked Up</option>
                                        <option value="in_transit">In Transit</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Flash Sales Tab */}
            {activeTab === 'flashsales' && <FlashSaleManagement />}

            {/* Create Vendor Modal */}
            {showVendorModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <form onSubmit={handleCreateVendor} style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2>Create New Vendor</h2>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Select User *</label>
                            <select value={vendorForm.userId} onChange={(e) => setVendorForm({...vendorForm, userId: e.target.value})} required style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                                <option value="">Select User</option>
                                {users.filter(u => u.role === 'student').map(user => (
                                    <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                                ))}
                            </select>
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Business Name *</label>
                            <input type="text" value={vendorForm.businessName} onChange={(e) => setVendorForm({...vendorForm, businessName: e.target.value})} required style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Description</label>
                            <textarea value={vendorForm.description} onChange={(e) => setVendorForm({...vendorForm, description: e.target.value})} rows="2" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Campus *</label>
                            <select value={vendorForm.campus} onChange={(e) => setVendorForm({...vendorForm, campus: e.target.value})} required style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                                <option value="4kilo">4 Kilo Campus</option>
                                <option value="5kilo">5 Kilo Campus</option>
                                <option value="6kilo">6 Kilo Campus</option>
                                <option value="ALL">all Campus</option>
                            </select>
                        </div>
                        
    
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Availability Type *</label>
                            <select value={vendorForm.availabilityType} onChange={(e) => setVendorForm({...vendorForm, availabilityType: e.target.value})} style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                                <option value="full-time">Full-time (Always available)</option>
                                <option value="part-time">Part-time (Specific hours)</option>
                            </select>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" style={{ flex: 1, padding: '0.5rem', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create Vendor</button>
                            <button type="button" onClick={() => setShowVendorModal(false)} style={{ flex: 1, padding: '0.5rem', backgroundColor: '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Assign Order Modal */}
            {showAssignModal && selectedOrder && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
                        <h2>Assign Order to Vendor</h2>
                        <p><strong>Order #{selectedOrder._id.slice(-8)}</strong></p>
                        <p>Customer: {selectedOrder.user?.name}</p>
                        <p>Delivery: {selectedOrder.campus} - {selectedOrder.dorm}</p>
                        <p>Total: {selectedOrder.totalAmount} ETB</p>
                        
                        <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
                            <label>Select Vendor *</label>
                            <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} required style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                                <option value="">Select Vendor</option>
                                {availableVendors.map(vendor => (
                                    <option key={vendor._id} value={vendor._id}>{vendor.businessName} ({vendor.campus}) - {vendor.availability?.type}</option>
                                ))}
                            </select>
                        </div>
                        
                        {availableVendors.length === 0 && (
                            <p style={{ color: '#e74c3c' }}>No available vendors found for this campus. Please check vendor availability.</p>
                        )}
                        
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button onClick={handleAssignOrder} disabled={!selectedVendor} style={{ flex: 1, padding: '0.5rem', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: selectedVendor ? 'pointer' : 'not-allowed', opacity: selectedVendor ? 1 : 0.6 }}>Assign Order</button>
                            <button onClick={() => { setShowAssignModal(false); setSelectedOrder(null); setSelectedVendor(''); }} style={{ flex: 1, padding: '0.5rem', backgroundColor: '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Product Modal */}
            {showProductModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <form onSubmit={handleCreateProduct} style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2>Create New Product</h2>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Product Name *</label>
                            <input type="text" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} required style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Description</label>
                            <textarea value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} rows="3" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Category *</label>
                            <select value={productForm.category} onChange={handleCategoryChange} required style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                                <option value="">Select Category</option>
                                {getAllCategories().map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        {productForm.category && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label>Subcategory *</label>
                                <select value={productForm.subcategory} onChange={(e) => setProductForm({...productForm, subcategory: e.target.value})} required style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                                    <option value="">Select Subcategory</option>
                                    {subcategories.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.icon} {sub.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Price (ETB) *</label>
                            <input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} required style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Stock *</label>
                            <input type="number" value={productForm.stock} onChange={(e) => setProductForm({...productForm, stock: e.target.value})} required style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Vendor *</label>
                            <select value={productForm.vendorId} onChange={(e) => setProductForm({...productForm, vendorId: e.target.value})} required style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                                <option value="">Select Vendor</option>
                                {vendors.map(vendor => (
                                    <option key={vendor._id} value={vendor._id}>{vendor.businessName}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Image URL (optional)</label>
                            <input type="text" value={productForm.imageUrl} onChange={(e) => setProductForm({...productForm, imageUrl: e.target.value})} placeholder="https://picsum.photos/id/26/200/200" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" style={{ flex: 1, padding: '0.5rem', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create</button>
                            <button type="button" onClick={() => {
                                setShowProductModal(false);
                                setProductForm({ name: '', description: '', category: '', subcategory: '', price: '', stock: '', vendorId: '', imageUrl: '' });
                                setSubcategories([]);
                            }} style={{ flex: 1, padding: '0.5rem', backgroundColor: '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;