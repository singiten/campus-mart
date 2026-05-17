import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

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

const AdminAnalytics = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchAnalytics();
        }
    }, [user]);

    const fetchAnalytics = async () => {
        try {
            const response = await API.get('/admin/analytics');
            console.log('Analytics data:', response.data);
            
            // Ensure all data arrays exist with defaults
            const data = response.data.data || {};
            
            setAnalytics({
                revenueTrend: data.revenueTrend || [],
                topProducts: data.topProducts || [],
                ordersByCampus: data.ordersByCampus || [],
                orderStatus: data.orderStatus || [],
                userGrowth: data.userGrowth || [],
                categoryStats: data.categoryStats || [],
                topVendors: data.topVendors || []
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setError('Failed to load analytics data');
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
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

    const COLORS = ['#667eea', '#764ba2', '#27ae60', '#e74c3c', '#f39c12', '#3498db'];

    if (user?.role !== 'admin') {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Access Denied</h2>
                <p>Admin access required to view analytics.</p>
            </div>
        );
    }

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading analytics...</div>;
    }

    if (error) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: '#e74c3c' }}>{error}</p>
                <button onClick={fetchAnalytics} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                    Retry
                </button>
            </div>
        );
    }

    if (!analytics) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>No data available</div>;
    }

    // Calculate summary stats safely
    const totalRevenue = analytics.revenueTrend?.reduce((sum, d) => sum + (d?.revenue || 0), 0) || 0;
    const totalOrders = analytics.revenueTrend?.reduce((sum, d) => sum + (d?.orders || 0), 0) || 0;
    const totalProducts = analytics.categoryStats?.reduce((sum, c) => sum + (c?.count || 0), 0) || 0;
    const totalUsers = analytics.userGrowth?.reduce((sum, d) => sum + (d?.users || 0), 0) || 0;

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', backgroundColor: theme?.colors?.background, minHeight: 'calc(100vh - 200px)' }}>
            <h1 style={{ color: theme?.colors?.text, marginBottom: '0.5rem' }}>Analytics Dashboard</h1>
            <p style={{ color: theme?.colors?.textLight, marginBottom: '2rem' }}>Platform statistics and insights</p>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div style={{ backgroundColor: theme?.colors?.surface, padding: '1rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: theme?.colors?.text }}>💰 Total Revenue</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#27ae60' }}>{totalRevenue} ETB</p>
                </div>
                <div style={{ backgroundColor: theme?.colors?.surface, padding: '1rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: theme?.colors?.text }}>📦 Total Orders</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3498db' }}>{totalOrders}</p>
                </div>
                <div style={{ backgroundColor: theme?.colors?.surface, padding: '1rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: theme?.colors?.text }}>🛍️ Products</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9b59b6' }}>{totalProducts}</p>
                </div>
                <div style={{ backgroundColor: theme?.colors?.surface, padding: '1rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: theme?.colors?.text }}>👥 New Users</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e74c3c' }}>{totalUsers}</p>
                </div>
            </div>

            {/* Revenue Trend Chart */}
            {analytics.revenueTrend && analytics.revenueTrend.length > 0 && (
                <div style={{ backgroundColor: theme?.colors?.surface, padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: theme?.colors?.text }}>📈 Revenue Trend (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.revenueTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#667eea" name="Revenue (ETB)" />
                            <Line type="monotone" dataKey="orders" stroke="#27ae60" name="Orders" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Top Products & Orders by Campus */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                {/* Top Selling Products */}
                <div style={{ backgroundColor: theme?.colors?.surface, padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: theme?.colors?.text }}>🏆 Top Selling Products</h3>
                    {!analytics.topProducts || analytics.topProducts.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No orders yet</p>
                    ) : (
                        <div>
                            {analytics.topProducts.map((product, idx) => (
                                <div key={idx} style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ color: theme?.colors?.text }}>{idx + 1}. {product.name || 'Unknown'}</span>
                                        <span style={{ color: theme?.colors?.textLight }}>{product.totalSold || 0} sold</span>
                                    </div>
                                    <div style={{ backgroundColor: '#f0f0f0', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${((product.totalSold || 0) / (analytics.topProducts[0]?.totalSold || 1)) * 100}%`,
                                            backgroundColor: '#667eea',
                                            height: '100%'
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Orders by Campus */}
                <div style={{ backgroundColor: theme?.colors?.surface, padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: theme?.colors?.text }}>📍 Orders by Campus</h3>
                    {!analytics.ordersByCampus || analytics.ordersByCampus.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No orders yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={analytics.ordersByCampus}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="_id" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#667eea" name="Orders" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Order Status Distribution & Category Distribution */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                {/* Order Status Distribution */}
                <div style={{ backgroundColor: theme?.colors?.surface, padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: theme?.colors?.text }}>📊 Order Status Distribution</h3>
                    {!analytics.orderStatus || analytics.orderStatus.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No orders yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={analytics.orderStatus}
                                    dataKey="count"
                                    nameKey="_id"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {analytics.orderStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getStatusColor(entry._id)} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Category Distribution */}
                <div style={{ backgroundColor: theme?.colors?.surface, padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: theme?.colors?.text }}>📂 Products by Category</h3>
                    {!analytics.categoryStats || analytics.categoryStats.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No products yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={analytics.categoryStats}
                                    dataKey="count"
                                    nameKey="_id"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {analytics.categoryStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* User Growth & Top Vendors */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                {/* User Growth */}
                <div style={{ backgroundColor: theme?.colors?.surface, padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: theme?.colors?.text }}>👥 New Users (Last 7 Days)</h3>
                    {!analytics.userGrowth || analytics.userGrowth.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No user data yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={analytics.userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="users" fill="#9b59b6" name="New Users" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Top Vendors */}
                <div style={{ backgroundColor: theme?.colors?.surface, padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: theme?.colors?.text }}>🏪 Top Rated Vendors</h3>
                    {!analytics.topVendors || analytics.topVendors.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No vendors yet</p>
                    ) : (
                        analytics.topVendors.map((vendor, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '0.5rem 0',
                                borderBottom: `1px solid ${theme?.colors?.border}`
                            }}>
                                <span style={{ color: theme?.colors?.text }}>{idx + 1}. {vendor.businessName || 'Unknown'}</span>
                                <span style={{ color: theme?.colors?.warning }}>⭐ {vendor.rating?.toFixed(1) || 'New'}</span>
                                <span style={{ color: theme?.colors?.textLight }}>📦 {vendor.productCount || 0} products</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;