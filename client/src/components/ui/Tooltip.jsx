import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

const Tooltip = ({ children, content, position = 'top', className }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positions = {
        top: "-translate-y-full -mt-2 top-0 left-1/2 -translate-x-1/2",
        bottom: "translate-y-full mt-2 bottom-0 left-1/2 -translate-x-1/2",
        left: "-translate-x-full -ml-2 left-0 top-1/2 -translate-y-1/2",
        right: "translate-x-full ml-2 right-0 top-1/2 -translate-y-1/2",
    };

    const arrows = {
        top: "bottom-[-4px] left-1/2 -translate-x-1/2 border-t-card border-l-transparent border-r-transparent border-b-transparent",
        bottom: "top-[-4px] left-1/2 -translate-x-1/2 border-b-card border-l-transparent border-r-transparent border-t-transparent",
        left: "right-[-4px] top-1/2 -translate-y-1/2 border-l-card border-t-transparent border-b-transparent border-r-transparent",
        right: "left-[-4px] top-1/2 -translate-y-1/2 border-r-card border-t-transparent border-b-transparent border-l-transparent",
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 5 : position === 'bottom' ? -5 : 0 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={twMerge(
                            "absolute z-[9999] px-3 py-1.5 bg-card border border-border rounded-xl shadow-2xl pointer-events-none whitespace-nowrap",
                            positions[position],
                            className
                        )}
                    >
                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground block">
                            {content}
                        </span>
                        <div className={twMerge(
                            "absolute w-0 h-0 border-[4px]",
                            arrows[position]
                        )} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Tooltip;
