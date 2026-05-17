import { io } from 'socket.io-client';
import { SOCKET_URL } from './api';

let socket = null;

export const initSocket = (userId) => {
    if (socket) {
        socket.disconnect();
    }
    
    socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true
    });
    
    socket.on('connect', () => {
        console.log('🔌 Socket connected:', socket.id);
        if (userId) {
            socket.emit('register-user', userId);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
    });
    
    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const joinOrderRoom = (orderId) => {
    if (socket) {
        socket.emit('join-order-room', orderId);
    }
};

export const leaveOrderRoom = (orderId) => {
    if (socket) {
        socket.emit('leave-order-room', orderId);
    }
};

export default socket;