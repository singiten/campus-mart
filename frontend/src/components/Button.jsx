import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const Button = ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false, 
    icon = null,
    onClick,
    disabled = false,
    type = 'button'
}) => {
    const { theme } = useTheme();

    const variantStyles = {
        primary: {
            backgroundColor: theme.colors.primary,
            color: 'white',
            border: 'none'
        },
        secondary: {
            backgroundColor: theme.colors.secondary,
            color: 'white',
            border: 'none'
        },
        success: {
            backgroundColor: theme.colors.success,
            color: 'white',
            border: 'none'
        },
        danger: {
            backgroundColor: theme.colors.danger,
            color: 'white',
            border: 'none'
        },
        warning: {
            backgroundColor: theme.colors.warning,
            color: theme.colors.primaryDark,
            border: 'none'
        },
        outline: {
            backgroundColor: 'transparent',
            color: theme.colors.primary,
            border: `2px solid ${theme.colors.primary}`
        },
        ghost: {
            backgroundColor: 'transparent',
            color: theme.colors.text,
            border: 'none'
        }
    };

    const sizeStyles = {
        xs: { padding: `${theme.spacing.xs} ${theme.spacing.sm}`, fontSize: theme.typography.fontSize.xs },
        sm: { padding: `${theme.spacing.xs} ${theme.spacing.md}`, fontSize: theme.typography.fontSize.sm },
        md: { padding: `${theme.spacing.sm} ${theme.spacing.lg}`, fontSize: theme.typography.fontSize.md },
        lg: { padding: `${theme.spacing.md} ${theme.spacing.xl}`, fontSize: theme.typography.fontSize.lg }
    };

    const baseStyle = {
        ...variantStyles[variant],
        ...sizeStyles[size],
        borderRadius: theme.borderRadius.md,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        width: fullWidth ? '100%' : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        transition: 'all 0.2s ease',
        fontWeight: theme.typography.fontWeight.medium,
        fontFamily: theme.typography.fontFamily
    };

    const handleMouseEnter = (e) => {
        if (disabled) return;
        if (variant === 'primary') {
            e.currentTarget.style.backgroundColor = theme.colors.primaryLight;
        } else if (variant === 'secondary') {
            e.currentTarget.style.backgroundColor = theme.colors.secondaryLight;
        } else if (variant === 'success') {
            e.currentTarget.style.backgroundColor = theme.colors.successLight;
        } else if (variant === 'danger') {
            e.currentTarget.style.backgroundColor = theme.colors.dangerLight;
        } else if (variant === 'outline') {
            e.currentTarget.style.backgroundColor = theme.colors.primary;
            e.currentTarget.style.color = 'white';
        }
    };

    const handleMouseLeave = (e) => {
        if (disabled) return;
        if (variant === 'primary') {
            e.currentTarget.style.backgroundColor = theme.colors.primary;
        } else if (variant === 'secondary') {
            e.currentTarget.style.backgroundColor = theme.colors.secondary;
        } else if (variant === 'success') {
            e.currentTarget.style.backgroundColor = theme.colors.success;
        } else if (variant === 'danger') {
            e.currentTarget.style.backgroundColor = theme.colors.danger;
        } else if (variant === 'outline') {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.colors.primary;
        }
    };

    return (
        <button
            type={type}
            style={baseStyle}
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {icon && <span>{icon}</span>}
            {children}
        </button>
    );
};

export default Button;