import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
    const { isAuthenticated, selectedCampus } = useAuth();
    const navigate = useNavigate();

    const deliveryFee = selectedCampus === '4kilo' ? 10 : selectedCampus === '5kilo' ? 15 : 20;
    const subtotal = getCartTotal();
    const total = subtotal + deliveryFee;

    const handleCheckout = () => {
        if (!isAuthenticated) {
            toast.error('Please login to checkout');
            navigate('/login');
        } else {
            navigate('/checkout');
        }
    };

    if (cartItems.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Your cart is empty</h2>
                <Link to="/">
                    <button style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                        Continue Shopping
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Shopping Cart</h1>
            
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {/* Cart Items */}
                <div style={{ flex: 2 }}>
                    {cartItems.map(item => (
                        <div key={item.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            borderBottom: '1px solid #ddd',
                            padding: '1rem 0'
                        }}>
                            <img src={item.imageUrl} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                            <div style={{ flex: 1 }}>
                                <h3>{item.name}</h3>
                                <p style={{ color: '#666', fontSize: '0.875rem' }}>{item.vendor}</p>
                                <p>{item.price} ETB</p>
                            </div>
                            <div>
                                <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value), item.name)}
                                    style={{ width: '60px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div>
                                <strong>{(item.price * item.quantity)} ETB</strong>
                            </div>
                            <button
                                onClick={() => removeFromCart(item.id, item.name)}
                                style={{ padding: '0.25rem 0.5rem', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div style={{ flex: 1, padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px', alignSelf: 'flex-start' }}>
                    <h2>Order Summary</h2>
                    <p>Subtotal: {subtotal} ETB</p>
                    <p>Delivery Fee: {deliveryFee} ETB</p>
                    <hr />
                    <h3>Total: {total} ETB</h3>
                    <button
                        onClick={handleCheckout}
                        style={{
                            width: '100%',
                            marginTop: '1rem',
                            padding: '0.75rem',
                            backgroundColor: '#27ae60',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Proceed to Checkout
                    </button>
                    <button
                        onClick={clearCart}
                        style={{
                            width: '100%',
                            marginTop: '0.5rem',
                            padding: '0.5rem',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Clear Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;