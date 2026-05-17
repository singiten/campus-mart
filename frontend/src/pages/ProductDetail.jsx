import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, createGroupOrder, joinGroupByCode } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import StarRating from '../components/StarRating';
import FlashSaleBadge from '../components/FlashSaleBadge';
import Button from '../components/Button';
import EnhancedReviewSection from '../components/EnhancedReviewSection';

const API = axios.create({ baseURL: 'http://localhost:8003/api' });
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { selectedCampus, isAuthenticated, user } = useAuth();
    const { addToCart } = useCart();
    const { theme } = useTheme();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [discountedPrice, setDiscountedPrice] = useState(null);
    const [groupDiscount, setGroupDiscount] = useState(0);
    const [groupFreeDelivery, setGroupFreeDelivery] = useState(false);
    
    // Group Order States
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
    const [groupCode, setGroupCode] = useState('');
    const [targetMembers, setTargetMembers] = useState(5);
    const [creatingGroup, setCreatingGroup] = useState(false);
    const [joiningGroup, setJoiningGroup] = useState(false);
    const [groupQuantity, setGroupQuantity] = useState(1);
    
    // Ref to prevent multiple toasts
    const toastShownRef = useRef(false);

    useEffect(() => {
        fetchProduct();
        checkUserGroupForProduct();
        // Reset toast ref when product changes
        toastShownRef.current = false;
    }, [id]);

    const fetchProduct = async () => {
        try {
            const response = await getProduct(id);
            setProduct(response.data.data);
        } catch (error) {
            console.error('Error fetching product:', error);
            toast.error('Product not found');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const checkUserGroupForProduct = async () => {
        if (!isAuthenticated) return;
        
        try {
            const response = await API.get('/group-orders/my-groups');
            const groups = response.data.data || [];
            
            // Find active completed group for this product
            const activeGroup = groups.find(g => 
                g.productId === id && 
                g.currentMembers >= g.targetMembers &&
                new Date(g.expiresAt) > new Date()
            );
            
            if (activeGroup && activeGroup.discount > 0) {
                setGroupDiscount(activeGroup.discount);
                setGroupFreeDelivery(activeGroup.freeDelivery);
                
                // Only show toast once per product
                if (!toastShownRef.current) {
                    toastShownRef.current = true;
                    toast.success(`🎉 Group discount available! ${activeGroup.discount}% OFF applied to your cart!`);
                }
            }
        } catch (error) {
            console.error('Error checking group:', error);
        }
    };

    const handleAddToCart = () => {
        if (product) {
            let finalPrice = discountedPrice || product.price;
            
            // Apply group discount if available
            if (groupDiscount > 0) {
                finalPrice = product.price - (product.price * groupDiscount / 100);
            }
            
            addToCart({ ...product, price: finalPrice }, quantity);
            
            // Single toast for add to cart
            if (groupDiscount > 0) {
                toast.success(`Added ${quantity} x ${product.name} at ${finalPrice.toFixed(2)} ETB (${groupDiscount}% OFF applied!)`);
            } else {
                toast.success(`Added ${quantity} x ${product.name} to cart`);
            }
        }
    };

    const handleCreateGroup = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to create a group order');
            navigate('/login');
            return;
        }
        
        if (targetMembers < 5) {
            toast.error('Minimum group size is 5 members');
            return;
        }
        
        if (targetMembers > 20) {
            toast.error('Maximum group size is 20 members');
            return;
        }
        
        if (groupQuantity < 1) {
            toast.error('Please enter a valid quantity');
            return;
        }
        
        setCreatingGroup(true);
        try {
            const response = await createGroupOrder({
                productId: product._id,
                targetMembers: targetMembers,
                campus: selectedCampus,
                quantity: groupQuantity
            });
            
            if (response.data.success) {
                const groupData = response.data.data;
                toast.success(`Group created! Code: ${groupData.code}`);
                setShowCreateGroupModal(false);
                setTargetMembers(5);
                setGroupQuantity(1);
                
                // Copy code to clipboard
                navigator.clipboard.writeText(groupData.code);
                toast.info(`Code "${groupData.code}" copied to clipboard! Share with friends.`);
                
                // Navigate to group orders page
                navigate('/group-orders');
            }
        } catch (error) {
            console.error('Create group error:', error);
            toast.error(error.response?.data?.message || 'Failed to create group');
        } finally {
            setCreatingGroup(false);
        }
    };

    const handleJoinGroup = async () => {
        if (!groupCode.trim()) {
            toast.error('Please enter a group code');
            return;
        }
        
        setJoiningGroup(true);
        try {
            const response = await joinGroupByCode(groupCode, product._id);
            
            if (response.data.success) {
                toast.success(response.data.message);
                setGroupCode('');
                setShowJoinGroupModal(false);
                
                // Check if group is complete and update discount
                if (response.data.data.isComplete && response.data.data.discount > 0) {
                    setGroupDiscount(response.data.data.discount);
                    setGroupFreeDelivery(response.data.data.freeDelivery);
                    toast.success(`🎉 Group target reached! You get ${response.data.data.discount}% OFF!`);
                }
                
                navigate('/group-orders');
            }
        } catch (error) {
            console.error('Join group error:', error);
            toast.error(error.response?.data?.message || 'Failed to join group');
        } finally {
            setJoiningGroup(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: theme?.colors?.textLight }}>Loading...</div>;
    if (!product) return <div style={{ padding: '2rem', textAlign: 'center', color: theme?.colors?.textLight }}>Product not found</div>;

    const isAvailableInCampus = product.availableCampuses?.includes(selectedCampus);
    const finalDisplayPrice = groupDiscount > 0 
        ? product.price - (product.price * groupDiscount / 100)
        : (discountedPrice || product.price);

    return (
        <div style={{ 
            padding: theme?.spacing?.xl || '2rem', 
            maxWidth: '1200px', 
            margin: '0 auto',
            backgroundColor: theme?.colors?.background,
            minHeight: 'calc(100vh - 200px)'
        }}>
            {/* Back Button */}
            <button 
                onClick={() => navigate(-1)} 
                style={{
                    marginBottom: theme?.spacing?.lg || '1.5rem',
                    padding: `${theme?.spacing?.sm || '8px'} ${theme?.spacing?.md || '16px'}`,
                    backgroundColor: 'transparent',
                    border: `2px solid ${theme?.colors?.primary || '#1a3a5c'}`,
                    borderRadius: theme?.borderRadius?.md || '8px',
                    color: theme?.colors?.primary || '#1a3a5c',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme?.colors?.primary || '#1a3a5c';
                    e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = theme?.colors?.primary || '#1a3a5c';
                }}
            >
                ← Back
            </button>

            {/* Group Discount Banner */}
            {groupDiscount > 0 && (
                <div style={{
                    backgroundColor: theme?.colors?.success,
                    color: 'white',
                    padding: '12px',
                    borderRadius: theme?.borderRadius?.md || '8px',
                    textAlign: 'center',
                    marginBottom: '1rem'
                }}>
                    🎉 Group Discount Active! {groupDiscount}% OFF applied to your purchase! {groupFreeDelivery && 'FREE Delivery included!'}
                </div>
            )}

            <div style={{ display: 'flex', gap: theme?.spacing?.xl || '2rem', flexWrap: 'wrap' }}>
                {/* Product Image */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{ width: '100%', borderRadius: theme?.borderRadius?.lg || '12px' }}
                    />
                </div>

                {/* Product Info */}
                <div style={{ flex: 1 }}>
                    <h1 style={{ color: theme?.colors?.text, marginBottom: theme?.spacing?.sm || '8px' }}>{product.name}</h1>
                    <p style={{ color: theme?.colors?.textLight, marginTop: theme?.spacing?.xs || '4px' }}>{product.description}</p>
                    
                    {/* Rating Display */}
                    <div style={{ marginTop: theme?.spacing?.sm || '8px', display: 'flex', alignItems: 'center', gap: theme?.spacing?.sm || '8px' }}>
                        <StarRating rating={product.averageRating || 0} />
                        <span style={{ fontSize: '14px', color: theme?.colors?.textLight }}>
                            ({product.numberOfReviews || 0} reviews)
                        </span>
                    </div>
                    
                    {/* Price Display with Group Discount */}
                    <div style={{ marginTop: theme?.spacing?.md || '16px' }}>
                        {groupDiscount > 0 ? (
                            <>
                                <span style={{ 
                                    textDecoration: 'line-through', 
                                    color: theme?.colors?.textLight, 
                                    fontSize: '16px' 
                                }}>
                                    {product.price} ETB
                                </span>
                                <span style={{ 
                                    fontSize: '28px', 
                                    fontWeight: 'bold', 
                                    color: theme?.colors?.success, 
                                    marginLeft: theme?.spacing?.sm || '8px' 
                                }}>
                                    {finalDisplayPrice.toFixed(2)} ETB
                                </span>
                                <span style={{ 
                                    marginLeft: theme?.spacing?.sm || '8px',
                                    backgroundColor: theme?.colors?.success,
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '20px',
                                    fontSize: '12px'
                                }}>
                                    {groupDiscount}% OFF
                                </span>
                            </>
                        ) : discountedPrice ? (
                            <>
                                <span style={{ 
                                    textDecoration: 'line-through', 
                                    color: theme?.colors?.textLight, 
                                    fontSize: '16px' 
                                }}>
                                    {product.price} ETB
                                </span>
                                <span style={{ 
                                    fontSize: '24px', 
                                    fontWeight: 'bold', 
                                    color: theme?.colors?.warning || '#FFBF00', 
                                    marginLeft: theme?.spacing?.sm || '8px' 
                                }}>
                                    {discountedPrice.toFixed(2)} ETB
                                </span>
                            </>
                        ) : (
                            <span style={{ 
                                fontSize: '24px', 
                                fontWeight: 'bold', 
                                color: theme?.colors?.primary || '#1a3a5c' 
                            }}>
                                {product.price} ETB
                            </span>
                        )}
                    </div>

                    


                    {/* Availability Warning */}
                    {!isAvailableInCampus && (
                        <div style={{ 
                            marginTop: theme?.spacing?.md || '16px', 
                            padding: theme?.spacing?.sm || '8px', 
                            backgroundColor: `${theme?.colors?.warning}20`, 
                            borderRadius: theme?.borderRadius?.md || '8px',
                            borderLeft: `4px solid ${theme?.colors?.warning}`
                        }}>
                            <p style={{ color: theme?.colors?.warning, margin: 0 }}>
                                ⚠️ This product is not available in {selectedCampus.toUpperCase()} Campus
                            </p>
                        </div>
                    )}

                    {/* Quantity and Actions */}
                    <div style={{ marginTop: theme?.spacing?.xl || '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme?.spacing?.md || '16px', marginBottom: theme?.spacing?.md || '16px' }}>
                            <label style={{ color: theme?.colors?.text, fontWeight: 500 }}>Quantity:</label>
                            <input
                                type="number"
                                min="1"
                                max={product.stock}
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value))}
                                style={{ 
                                    width: '80px', 
                                    padding: theme?.spacing?.sm || '8px', 
                                    borderRadius: theme?.borderRadius?.md || '8px', 
                                    border: `1px solid ${theme?.colors?.border}`,
                                    backgroundColor: theme?.colors?.surface,
                                    color: theme?.colors?.text
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: theme?.spacing?.md || '16px', flexWrap: 'wrap' }}>
                            <Button
                                variant={isAvailableInCampus ? 'success' : 'secondary'}
                                size="lg"
                                onClick={handleAddToCart}
                                disabled={!isAvailableInCampus}
                                icon="🛒"
                            >
                                Add to Cart {groupDiscount > 0 && `(${groupDiscount}% OFF)`}
                            </Button>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => setShowCreateGroupModal(true)}
                                icon="👥"
                            >
                                Start Group Order
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => setShowJoinGroupModal(true)}
                                icon="🔗"
                            >
                                Join Group Order
                            </Button>
                        </div>
                    </div>

                    {/* Group Discount Info */}
                    <div style={{ 
                        marginTop: theme?.spacing?.xl || '24px', 
                        padding: theme?.spacing?.md || '16px', 
                        backgroundColor: `${theme?.colors?.success}10`, 
                        borderRadius: theme?.borderRadius?.md || '8px',
                        border: `1px solid ${theme?.colors?.success}30`
                    }}>
                        <h4 style={{ color: theme?.colors?.text, marginBottom: theme?.spacing?.sm || '8px' }}>🔥 Group Order Discounts</h4>
                        <p style={{ color: theme?.colors?.textLight }}>5 members: 15% OFF</p>
                        <p style={{ color: theme?.colors?.textLight }}>6 members: 20% OFF</p>
                        <p style={{ color: theme?.colors?.textLight }}>7 members: 25% OFF</p>
                        <p style={{ color: theme?.colors?.success, fontWeight: 'bold' }}>8+ members: 30% OFF + FREE Delivery!</p>
                    </div>
                </div>
            </div>

            {/* Create Group Modal */}
            {showCreateGroupModal && (
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
                    zIndex: 2000
                }}>
                    <div style={{
                        backgroundColor: theme?.colors?.surface,
                        borderRadius: theme?.borderRadius?.lg || '16px',
                        padding: theme?.spacing?.xl || '24px',
                        width: '90%',
                        maxWidth: '500px',
                        textAlign: 'center'
                    }}>
                        <h2 style={{ color: theme?.colors?.text, marginBottom: theme?.spacing?.sm || '8px' }}>Start a Group Order</h2>
                        <p style={{ color: theme?.colors?.textLight, marginBottom: theme?.spacing?.lg || '24px' }}>
                            Get discounts when you order together!
                        </p>
                        
                        <div style={{ marginBottom: theme?.spacing?.md || '16px' }}>
                            <label style={{ color: theme?.colors?.text, display: 'block', marginBottom: theme?.spacing?.sm || '8px', textAlign: 'left' }}>
                                How many do you want?
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                value={groupQuantity}
                                onChange={(e) => setGroupQuantity(parseInt(e.target.value))}
                                style={{
                                    width: '100%',
                                    padding: theme?.spacing?.md || '16px',
                                    border: `2px solid ${theme?.colors?.border}`,
                                    borderRadius: theme?.borderRadius?.md || '8px',
                                    fontSize: '16px',
                                    backgroundColor: theme?.colors?.surface,
                                    color: theme?.colors?.text
                                }}
                            />
                        </div>
                        
                        <div style={{ marginBottom: theme?.spacing?.lg || '24px' }}>
                            <label style={{ color: theme?.colors?.text, display: 'block', marginBottom: theme?.spacing?.sm || '8px', textAlign: 'left' }}>
                                Target Members (Minimum 5, Maximum 20)
                            </label>
                            <input
                                type="number"
                                min="5"
                                max="20"
                                value={targetMembers}
                                onChange={(e) => setTargetMembers(parseInt(e.target.value))}
                                style={{
                                    width: '100%',
                                    padding: theme?.spacing?.md || '16px',
                                    border: `2px solid ${theme?.colors?.border}`,
                                    borderRadius: theme?.borderRadius?.md || '8px',
                                    fontSize: '16px',
                                    textAlign: 'center',
                                    backgroundColor: theme?.colors?.surface,
                                    color: theme?.colors?.text
                                }}
                            />
                        </div>
                        
                        <div style={{ 
                            marginBottom: theme?.spacing?.lg || '24px', 
                            padding: theme?.spacing?.md || '16px', 
                            backgroundColor: `${theme?.colors?.success}20`, 
                            borderRadius: theme?.borderRadius?.md || '8px' 
                        }}>
                            <p style={{ margin: 0, fontSize: '14px', color: theme?.colors?.textLight }}>
                                💡 After creating, you'll get a 6-digit shareable code. Share it with friends in your dorm!
                            </p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: theme?.spacing?.md || '16px' }}>
                            <Button
                                variant="success"
                                fullWidth
                                onClick={handleCreateGroup}
                                disabled={creatingGroup}
                            >
                                {creatingGroup ? 'Creating...' : 'Create Group'}
                            </Button>
                            <Button
                                variant="outline"
                                fullWidth
                                onClick={() => setShowCreateGroupModal(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Join Group Modal */}
            {showJoinGroupModal && (
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
                    zIndex: 2000
                }}>
                    <div style={{
                        backgroundColor: theme?.colors?.surface,
                        borderRadius: theme?.borderRadius?.lg || '16px',
                        padding: theme?.spacing?.xl || '24px',
                        width: '90%',
                        maxWidth: '450px',
                        textAlign: 'center'
                    }}>
                        <h2 style={{ color: theme?.colors?.text, marginBottom: theme?.spacing?.sm || '8px' }}>Join Group Order</h2>
                        <p style={{ color: theme?.colors?.textLight, marginBottom: theme?.spacing?.lg || '24px' }}>
                            Enter the 6-digit group code shared by the organizer
                        </p>
                        
                        <input
                            type="text"
                            placeholder="Enter 6-digit code (e.g., ABC123)"
                            value={groupCode}
                            onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            style={{
                                width: '100%',
                                padding: theme?.spacing?.md || '16px',
                                border: `2px solid ${theme?.colors?.border}`,
                                borderRadius: theme?.borderRadius?.md || '8px',
                                fontSize: '18px',
                                textAlign: 'center',
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                marginBottom: theme?.spacing?.lg || '24px',
                                backgroundColor: theme?.colors?.surface,
                                color: theme?.colors?.text
                            }}
                        />
                        
                        <div style={{ marginBottom: theme?.spacing?.lg || '24px' }}>
                            <Button
                                variant="primary"
                                fullWidth
                                onClick={handleJoinGroup}
                                disabled={joiningGroup || !groupCode.trim()}
                            >
                                {joiningGroup ? 'Joining...' : 'Join Group'}
                            </Button>
                        </div>
                        
                        <div style={{ 
                            padding: theme?.spacing?.md || '16px', 
                            backgroundColor: `${theme?.colors?.warning}20`, 
                            borderRadius: theme?.borderRadius?.md || '8px' 
                        }}>
                            <p style={{ margin: 0, fontSize: '12px', color: theme?.colors?.textLight }}>
                                💡 Don't have a code? Ask a friend to start a group order and share the code with you!
                            </p>
                        </div>
                        
                        <Button
                            variant="ghost"
                            fullWidth
                            onClick={() => setShowJoinGroupModal(false)}
                            style={{ marginTop: theme?.spacing?.md || '16px' }}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Enhanced Reviews Section */}
            <EnhancedReviewSection productId={product._id} />
        </div>
    );
};

export default ProductDetail;