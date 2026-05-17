import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as loginAPI, register as registerAPI, getCurrentUser } from '../services/api';
import { toast } from 'react-toastify';

// Dynamically import socket to avoid circular dependency
let initSocket, disconnectSocket;

// Lazy load socket service
const loadSocketService = async () => {
    try {
        const socketModule = await import('../services/socket');
        initSocket = socketModule.initSocket;
        disconnectSocket = socketModule.disconnectSocket;
    } catch (error) {
        console.error('Failed to load socket service:', error);
    }
};
loadSocketService();

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCampus, setSelectedCampus] = useState(() => {
        return localStorage.getItem('selectedCampus') || '4kilo';
    });
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            loadUser();
        } else {
            setLoading(false);
        }
    }, []);

    const loadUser = async () => {
        try {
            const response = await getCurrentUser();
            setUser(response.data.user);
            
            // Initialize socket connection after user is loaded
            if (initSocket && response.data.user.id) {
                const newSocket = initSocket(response.data.user.id);
                setSocket(newSocket);
            }
        } catch (error) {
            console.error('Failed to load user:', error);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            const response = await registerAPI(userData);
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            
            // Clear any existing cart for new user
            localStorage.removeItem('cart');
            
            setUser(user);
            
            if (initSocket && user.id) {
                const newSocket = initSocket(user.id);
                setSocket(newSocket);
            }
            
            toast.success('Registration successful!');
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed';
            toast.error(message);
            throw error;
        }
    };

    const login = async (email, password) => {
        try {
            const response = await loginAPI({ email, password });
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            
            // Clear any existing cart for logged in user
            localStorage.removeItem('cart');
            
            setUser(user);
            
            if (initSocket && user.id) {
                const newSocket = initSocket(user.id);
                setSocket(newSocket);
            }
            
            toast.success(`Welcome back, ${user.name}!`);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('selectedCampus');
        localStorage.removeItem('cart');
        if (disconnectSocket) {
            disconnectSocket();
        }
        setUser(null);
        setSocket(null);
        toast.info('Logged out successfully');
    };

    const changeCampus = (campus) => {
        setSelectedCampus(campus);
        localStorage.setItem('selectedCampus', campus);
        toast.info(`Switched to ${campus.toUpperCase()} Campus`);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            selectedCampus,
            socket,
            register,
            login,
            logout,
            changeCampus,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};