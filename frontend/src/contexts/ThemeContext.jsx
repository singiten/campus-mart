import React, { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme } from '../styles/theme';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved === 'true';
    });

    const theme = isDarkMode ? darkTheme : lightTheme;

    useEffect(() => {
        localStorage.setItem('darkMode', isDarkMode);
        
        // Apply theme colors to body
        document.body.style.backgroundColor = theme.colors.background;
        document.body.style.color = theme.colors.text;
        
        // Apply CSS variables
        const root = document.documentElement;
        root.style.setProperty('--primary-color', theme.colors.primary);
        root.style.setProperty('--bg-color', theme.colors.background);
        root.style.setProperty('--text-color', theme.colors.text);
    }, [isDarkMode, theme]);

    const toggleDarkMode = () => setIsDarkMode(prev => !prev);

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, theme }}>
            {children}
        </ThemeContext.Provider>
    );
};