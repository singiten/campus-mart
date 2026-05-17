import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-container">
                {/* Company Info */}
                <div className="footer-section">
                    <h3>🛒 U-Shop</h3>
                    <p>Your trusted campus marketplace in Ethiopia</p>
                    <p>Quality products, group discounts, fast dorm-to-dorm delivery</p>
                </div>

                {/* Quick Links */}
                <div className="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/products">Products</Link></li>
                        <li><Link to="/cart">Cart</Link></li>
                        <li><Link to="/orders">My Orders</Link></li>
                    </ul>
                </div>

                {/* Categories */}
                <div className="footer-section">
                    <h4>Categories</h4>
                    <ul>
                        <li><Link to="/products?category=electronics">Electronics</Link></li>
                        <li><Link to="/products?category=stationery">Stationery</Link></li>
                        <li><Link to="/products?category=food">Food & Snacks</Link></li>
                        <li><Link to="/products?category=personalCare">Personal Care</Link></li>
                        <li><Link to="/products?category=dormEssentials">Dorm Essentials</Link></li>
                        <li><Link to="/products?category=health">Health & Medical</Link></li>
                    </ul>
                </div>

                {/* Contact Info */}
                <div className="footer-section">
                    <h4>Contact Us</h4>
                    <ul>
                        <li>📍 Bole Road, Addis Ababa, Ethiopia</li>
                        <li>📞 +251-911-123456</li>
                        <li>✉️ info@ushop.com</li>
                        <li>🕒 Mon-Sat: 9AM - 7PM</li>
                    </ul>
                </div>

                {/* Social Media */}
                <div className="footer-section">
                    <h4>Follow Us</h4>
                    <div className="social-links">
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">📘 Facebook</a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">🐦 Twitter</a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">📷 Instagram</a>
                        <a href="https://telegram.org" target="_blank" rel="noopener noreferrer">💬 Telegram</a>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="footer-bottom">
                <p>&copy; {currentYear} U-Shop | Your Campus Marketplace | All Rights Reserved</p>
                <p className="footer-tagline">Shop Together, Save Together 🇪🇹</p>
            </div>
        </footer>
    );
};

export default Footer;