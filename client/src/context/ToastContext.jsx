import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircleIcon,
    XCircleIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);

        if (duration) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = (msg) => addToast(msg, 'success');
    const error = (msg) => addToast(msg, 'error');
    const info = (msg) => addToast(msg, 'info');
    const warning = (msg) => addToast(msg, 'warning');

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
            {children}
            <div className="fixed top-6 right-6 z-[10000] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <ToastItem
                            key={toast.id}
                            toast={toast}
                            onRemove={() => removeToast(toast.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ toast, onRemove }) => {
    const config = {
        success: {
            icon: CheckCircleIcon,
            color: 'text-green-500',
            bg: 'bg-green-500/10',
            border: 'border-green-500/20',
            label: 'Success'
        },
        error: {
            icon: XCircleIcon,
            color: 'text-destructive',
            bg: 'bg-destructive/10',
            border: 'border-destructive/20',
            label: 'Error'
        },
        info: {
            icon: InformationCircleIcon,
            color: 'text-primary',
            bg: 'bg-primary/10',
            border: 'border-primary/20',
            label: 'Update'
        },
        warning: {
            icon: ExclamationTriangleIcon,
            color: 'text-yellow-500',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20',
            label: 'Warning'
        }
    };

    const style = config[toast.type] || config.info;
    const Icon = style.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={twMerge(
                "pointer-events-auto flex items-center gap-4 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl min-w-[320px] max-w-md",
                style.bg,
                style.border
            )}
        >
            <div className={twMerge("shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-background/50 border border-white/10", style.color)}>
                <Icon className="h-6 w-6" />
            </div>

            <div className="flex-1 min-w-0">
                <p className={twMerge("text-[10px] font-black uppercase tracking-widest opacity-60", style.color)}>
                    {style.label}
                </p>
                <p className="text-sm font-bold text-foreground leading-tight truncate">
                    {toast.message}
                </p>
            </div>

            <button
                onClick={onRemove}
                className="shrink-0 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            >
                <XMarkIcon className="h-4 w-4" />
            </button>
        </motion.div>
    );
};
