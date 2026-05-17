import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8003/api' });

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const FlashSaleManagement = () => {
    const [products, setProducts] = useState([]);
    const [flashSales, setFlashSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        productId: '',
        discountPercentage: 30,
        startTime: '',
        endTime: '',
        maxQuantity: 50
    });

    useEffect(() => {
        fetchProducts();
        fetchFlashSales();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await API.get('/admin/products');
            setProducts(res.data.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchFlashSales = async () => {
        setLoading(true);
        try {
            const res = await API.get('/flash-sales/admin/all');
            console.log('Fetched flash sales:', res.data);
            setFlashSales(res.data.data);
        } catch (error) {
            console.error('Error fetching flash sales:', error);
            toast.error('Failed to load flash sales');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.productId) {
            toast.error('Please select a product');
            return;
        }
        
        if (!formData.startTime || !formData.endTime) {
            toast.error('Please set start and end time');
            return;
        }
        
        try {
            await API.post('/flash-sales', formData);
            toast.success('Flash sale created!');
            setShowForm(false);
            setFormData({
                productId: '',
                discountPercentage: 30,
                startTime: '',
                endTime: '',
                maxQuantity: 50
            });
            fetchFlashSales();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this flash sale?')) {
            try {
                await API.delete(`/flash-sales/${id}`);
                toast.success('Deleted');
                fetchFlashSales();
            } catch (error) {
                toast.error('Failed to delete');
            }
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            Active: { bg: '#27ae60', text: 'Active' },
            Scheduled: { bg: '#f39c12', text: 'Scheduled' },
            Expired: { bg: '#95a5a6', text: 'Expired' }
        };
        const color = colors[status] || colors.Expired;
        return (
            <span style={{
                backgroundColor: color.bg,
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem'
            }}>
                {color.text}
            </span>
        );
    };

    return (
        <div>
            <button 
                onClick={() => setShowForm(true)} 
                style={{ marginBottom: '1rem', padding: '0.5rem 1rem', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
                + Create Flash Sale
            </button>
            
            {showForm && (
                <form onSubmit={handleSubmit} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                    <h3>Create Flash Sale</h3>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <select 
                            value={formData.productId} 
                            onChange={(e) => setFormData({...formData, productId: e.target.value})} 
                            required
                            style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="">Select Product</option>
                            {products.map(p => <option key={p._id} value={p._id}>{p.name} - {p.price} ETB</option>)}
                        </select>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <input 
                            type="number" 
                            placeholder="Discount % (1-90)" 
                            value={formData.discountPercentage} 
                            onChange={(e) => setFormData({...formData, discountPercentage: e.target.value})}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <input 
                            type="datetime-local" 
                            value={formData.startTime} 
                            onChange={(e) => setFormData({...formData, startTime: e.target.value})} 
                            required
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <input 
                            type="datetime-local" 
                            value={formData.endTime} 
                            onChange={(e) => setFormData({...formData, endTime: e.target.value})} 
                            required
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <input 
                            type="number" 
                            placeholder="Max Quantity" 
                            value={formData.maxQuantity} 
                            onChange={(e) => setFormData({...formData, maxQuantity: e.target.value})}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create</button>
                        <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.5rem 1rem', backgroundColor: '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                </form>
            )}
            
            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {flashSales.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                            No flash sales. Create one to attract customers!
                        </div>
                    ) : (
                        flashSales.map(sale => (
                            <div key={sale._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', backgroundColor: 'white' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div>
                                        <strong>{sale.product?.name || 'Product'}</strong>
                                        <span style={{ color: '#ff6b6b', marginLeft: '0.5rem' }}>-{sale.discountPercentage}% OFF</span>
                                    </div>
                                    {getStatusBadge(sale.status)}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                                    <div>Start: {new Date(sale.startTime).toLocaleString()}</div>
                                    <div>End: {new Date(sale.endTime).toLocaleString()}</div>
                                    <div>Sold: {sale.soldQuantity} / {sale.maxQuantity}</div>
                                </div>
                                <button 
                                    onClick={() => handleDelete(sale._id)} 
                                    style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Delete
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default FlashSaleManagement;