import React, { forwardRef } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

const Input = forwardRef(({
    label,
    error,
    className,
    leftIcon,
    rightIcon,
    helperText,
    ...props
}, ref) => {
    return (
        <div className="w-full space-y-2">
            {label && (
                <label
                    htmlFor={props.id || props.name}
                    className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1 block"
                >
                    {label}
                </label>
            )}

            <div className="relative group">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        {leftIcon}
                    </div>
                )}

                <input
                    ref={ref}
                    className={twMerge(clsx(
                        "flex h-11 w-full rounded-xl border border-input bg-background font-bold text-sm ring-offset-background transition-all placeholder:font-normal placeholder:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        leftIcon ? "pl-10" : "px-4",
                        rightIcon ? "pr-10" : "pr-4",
                        error && "border-destructive focus-visible:ring-destructive/20 ring-1 ring-destructive shadow-[0_0_12px_rgba(239,68,68,0.1)]",
                        className
                    ))}
                    {...props}
                />

                {rightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        {rightIcon}
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {error ? (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-[10px] font-black text-destructive uppercase tracking-tighter pl-1"
                        id={`${props.name}-error`}
                    >
                        {error.message || error}
                    </motion.p>
                ) : helperText ? (
                    <p className="text-[10px] font-bold text-muted-foreground italic pl-1">
                        {helperText}
                    </p>
                ) : null}
            </AnimatePresence>
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
