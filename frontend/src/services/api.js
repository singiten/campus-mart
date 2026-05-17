import axios from 'axios';

// Get API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8003/api';

const API = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to every request
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Socket URL
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8003';

// ========== AUTH APIs ==========
export const register = (userData) => API.post('/auth/register', userData);
export const login = (credentials) => API.post('/auth/login', credentials);
export const getCurrentUser = () => API.get('/auth/me');

// ========== CAMPUS APIs ==========
export const getCampuses = () => API.get('/campuses');

// ========== VENDOR APIs ==========
export const getVendors = () => API.get('/vendors');
export const getVendorStatus = (vendorId, campus) => API.get(`/vendors/${vendorId}/status/${campus}`);

// ========== PRODUCT APIs ==========
export const getProducts = (params) => API.get('/products', { params });
export const getProduct = (id) => API.get(`/products/${id}`);

// ========== ORDER APIs ==========
export const createOrder = (data) => API.post('/orders', data);
export const getMyOrders = () => API.get('/orders/my-orders');
export const getOrderById = (id) => API.get(`/orders/${id}`);

// ========== REVIEW APIs ==========
export const getReviews = (productId) => API.get(`/reviews/product/${productId}`);
export const addReview = (data) => API.post('/reviews', data);
export const canReview = (productId) => API.get(`/reviews/can-review/${productId}`);
export const deleteReview = (reviewId) => API.delete(`/reviews/${reviewId}`);

// ========== GROUP ORDER APIs ==========
export const getGroupOrders = (campus) => API.get(`/group-orders/active/${campus}`);
export const createGroupOrder = (data) => API.post('/group-orders', data);
export const getGroupOrder = (id) => API.get(`/group-orders/${id}`);
export const joinGroupOrder = (id, quantity) => API.post(`/group-orders/${id}/join`, { quantity });
export const getMyGroups = () => API.get('/group-orders/my-groups');

// ========== WISHLIST APIs ==========
export const getWishlist = () => API.get('/wishlist');
export const addToWishlist = (productId) => API.post('/wishlist/add', { productId });
export const removeFromWishlist = (productId) => API.delete(`/wishlist/remove/${productId}`);
export const checkWishlist = (productId) => API.get(`/wishlist/check/${productId}`);

// ========== FLASH SALE APIs ==========
export const getActiveFlashSales = () => API.get('/flash-sales/active');
export const checkProductFlashSale = (productId) => API.get(`/flash-sales/product/${productId}`);

// ========== TRACKING APIs ==========
export const getOrderTracking = (orderId) => API.get(`/tracking/orders/${orderId}/tracking`);
export const updateVendorLocation = (lat, lng) => API.post('/tracking/vendor/location', { lat, lng });
export const acceptOrderAssignment = (orderId) => API.post(`/tracking/orders/${orderId}/accept`);
export const rejectOrderAssignment = (orderId, reason) => API.post(`/tracking/orders/${orderId}/reject`, { reason });
export const updateDeliveryStatus = (orderId, status) => API.put(`/tracking/orders/${orderId}/status`, { status });

export default API;