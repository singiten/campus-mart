import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import DarkModeToggle from './DarkModeToggle';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const { getCartCount } = useCart();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Default values in case theme is not loaded
    const defaultSpacing = { sm: '8px', md: '16px', lg: '24px', xl: '32px' };
    const defaultColors = { primary: '#1a3a5c', secondary: '#008080', warning: '#FFBF00', danger: '#8B0000', textLight: '#666' };
    
    const spacing = theme?.spacing || defaultSpacing;
    const colors = theme?.colors || defaultColors;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const linkStyle = {
        color: 'white',
        textDecoration: 'none',
        padding: `${spacing.sm} ${spacing.md}`,
        borderRadius: '8px',
        transition: 'background-color 0.2s',
        display: 'inline-block'
    };

    const getMenuItems = () => {
        if (!isAuthenticated) {
            return (
                <>
                    <Link to="/login" style={linkStyle}>Login</Link>
                    <Link to="/register" style={linkStyle}>Register</Link>
                </>
            );
        }

        switch (user?.role) {
            case 'admin':
                return (
                    <>
                        <Link to="/admin/dashboard" style={{ ...linkStyle, backgroundColor: colors.warning, color: '#1a3a5c' }}>👑 Admin Panel</Link>
                        <Link to="/admin/analytics" style={linkStyle}>📊 Analytics</Link>
                    </>
                );
            case 'vendor':
                return (
                    <Link to="/vendor/dashboard" style={{ ...linkStyle, backgroundColor: colors.secondary }}>🏪 Vendor Dashboard</Link>
                );
            default:
                return (
                    <>
                        <Link to="/products" style={linkStyle}>Browse Products</Link>
                        <Link to="/group-orders" style={linkStyle}>🔥 Group Orders</Link>
                        <Link to="/cart" style={linkStyle}>🛒 Cart ({getCartCount()})</Link>
                        <NotificationBell />
                        <span style={{ color: colors.warning }}>💰 {user?.points || 0} pts</span>
                        <Link to="/orders" style={linkStyle}>My Orders</Link>
                        <Link to="/wishlist" style={linkStyle}>💚 Wishlist</Link>
                        <span style={{ color: 'white'}}>👋 {user?.name}</span>
                    </>
                );
        }
    };

    return (
        <>
            <nav style={{
                backgroundColor: colors.primary,
                padding: `${spacing.md} ${spacing.xl}`,
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: spacing.md
                }}>
                    <Link to="/" style={{
                        color: 'white',
                        textDecoration: 'none',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm
                    }}>
                        <span>🛒</span>
                        <span>U-Shop</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div style={{
                        display: 'flex',
                        gap: spacing.md,
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {getMenuItems()}
                        <DarkModeToggle />
                        {isAuthenticated && (
                            <button
                                onClick={handleLogout}
                                style={{
                                    padding: `${spacing.sm} ${spacing.md}`,
                                    backgroundColor: colors.danger,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Logout
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        style={{
                            display: 'none',
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            fontSize: '24px',
                            cursor: 'pointer'
                        }}
                        aria-label="Menu"
                    >
                        ☰
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div style={{
                    position: 'fixed',
                    top: '60px',
                    left: 0,
                    right: 0,
                    backgroundColor: colors.primary,
                    padding: spacing.md,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.sm,
                    zIndex: 999,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    {getMenuItems()}
                    <DarkModeToggle />
                    {isAuthenticated && (
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: `${spacing.sm} ${spacing.md}`,
                                backgroundColor: colors.danger,
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            Logout
                        </button>
                    )}
                </div>
            )}
        </>
    );
};

export default Navbar;