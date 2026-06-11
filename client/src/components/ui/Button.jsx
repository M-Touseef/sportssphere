import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring shadow-lg shadow-primary/20',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-ring',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring',
    ghost: 'hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive shadow-lg shadow-destructive/20',
    link: 'text-primary underline-offset-4 hover:underline'
};

const sizes = {
    sm: 'h-9 px-3 text-xs',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-8 text-base font-bold'
};

const Button = ({
    children,
    type = 'button',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    className,
    fullWidth = false,
    disabled,
    ...props
}) => {
    return (
        <button
            type={type}
            disabled={isLoading || disabled}
            className={twMerge(clsx(
                "relative inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background active:scale-95",
                variants[variant],
                sizes[size],
                fullWidth && "w-full",
                className
            ))}
            {...props}
        >
            {isLoading ? (
                <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="opacity-70">Processing...</span>
                </span>
            ) : (
                <span className="flex items-center gap-2">{children}</span>
            )}
        </button>
    );
};

export default Button;
