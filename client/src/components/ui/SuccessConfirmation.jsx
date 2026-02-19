import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/outline';

const SuccessConfirmation = ({ message = "Success!", subMessage = "Operation completed successfully." }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-enter">
            <div className="relative mb-6">
                {/* Outer Ripple */}
                <motion.div
                    className="absolute inset-0 bg-green-500/20 rounded-full"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />

                {/* Inner Circle */}
                <motion.div
                    className="relative z-10 h-20 w-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30"
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                    }}
                >
                    <motion.div
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <CheckIcon className="h-10 w-10 text-white font-black" />
                    </motion.div>
                </motion.div>
            </div>

            <motion.h3
                className="text-2xl font-black text-foreground mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                {message}
            </motion.h3>
            <motion.p
                className="text-muted-foreground font-medium max-w-xs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                {subMessage}
            </motion.p>
        </div>
    );
};

export default SuccessConfirmation;
