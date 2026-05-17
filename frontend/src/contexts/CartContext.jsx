import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    
    // Initialize empty cart - no localStorage reading
    const [cartItems, setCartItems] = useState([]);

    // Only load cart from localStorage after authentication check
    useEffect(() => {
        if (isAuthenticated && user) {
            const savedCart = localStorage.getItem(`cart_${user.id}`);
            if (savedCart) {
                try {
                    const parsed = JSON.parse(savedCart);
                    setCartItems(parsed);
                } catch (e) {
                    console.error('Error parsing cart:', e);
                }
            }
        } else {
            setCartItems([]);
        }
    }, [isAuthenticated, user]);

    // Save cart to localStorage when it changes (only for authenticated users)
    useEffect(() => {
        if (isAuthenticated && user && cartItems.length > 0) {
            localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartItems));
        } else if (isAuthenticated && user && cartItems.length === 0) {
            localStorage.removeItem(`cart_${user.id}`);
        }
    }, [cartItems, isAuthenticated, user]);

    const addToCart = (product, quantity = 1) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product._id);
            
            if (existingItem) {
                const updatedItems = prevItems.map(item =>
                    item.id === product._id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
                toast.success(`✨ ${product.name} quantity updated to ${existingItem.quantity + quantity}`);
                return updatedItems;
            } else {
                toast.success(`✨ ${product.name} added to cart`);
                return [...prevItems, {
                    id: product._id,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    quantity: quantity,
                    vendor: product.vendor?.businessName
                }];
            }
        });
    };

    const removeFromCart = (productId, productName) => {
        setCartItems(prev => {
            const item = prev.find(i => i.id === productId);
            if (item && prev.length === 1) {
                toast.info(`🗑️ ${productName} removed from cart`);
            }
            return prev.filter(item => item.id !== productId);
        });
    };

    const updateQuantity = (productId, quantity, productName) => {
        if (quantity <= 0) {
            removeFromCart(productId, productName);
            return;
        }
        
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === productId ? { ...item, quantity: quantity } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
        toast.info('Cart cleared');
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getCartCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            getCartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};