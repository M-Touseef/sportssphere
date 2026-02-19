import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ fullScreen = false, size = 'medium', text = 'Processing your request...' }) => {
    const sizeMap = {
        small: 20,
        medium: 40,
        large: 64,
    };

    const spinnerSize = sizeMap[size] || 40;

    const spinner = (
        <div className="flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
                {/* Outer Ring */}
                <motion.div
                    className="rounded-full border-4 border-primary/20"
                    style={{ width: spinnerSize, height: spinnerSize }}
                />
                {/* Spinning Arc */}
                <motion.div
                    className="absolute rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
                    style={{ width: spinnerSize, height: spinnerSize }}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />

                {/* Inner Pulse */}
                <motion.div
                    className="absolute bg-primary/20 rounded-full"
                    style={{ width: spinnerSize / 2, height: spinnerSize / 2 }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>

            {text && (
                <motion.p
                    className="mt-6 text-sm font-black text-muted-foreground uppercase tracking-widest opacity-70"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {text}
                </motion.p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-md z-[9999] flex items-center justify-center"
            >
                {spinner}
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center p-12"
        >
            {spinner}
        </motion.div>
    );
};

export default LoadingSpinner;
