import React from 'react';
import { motion } from 'framer-motion';
import Button from './Button';
import { Link } from 'react-router-dom';

const EmptyState = ({
    icon: Icon,
    title = "No data found",
    description = "We couldn't find any information to display at this moment.",
    action,
    actionHref,
    actionLabel
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-12 text-center bg-card/10 border border-dashed border-border rounded-[2.5rem] animate-enter"
        >
            <div className="h-20 w-20 bg-muted/50 rounded-[1.5rem] flex items-center justify-center text-muted-foreground mb-6 shadow-sm">
                {Icon && <Icon className="h-10 w-10 opacity-40" />}
            </div>

            <h3 className="text-xl font-black text-foreground uppercase tracking-widest leading-none mb-3">
                {title}
            </h3>

            <p className="text-muted-foreground font-medium max-w-sm mb-10 text-sm leading-relaxed">
                {description}
            </p>

            {actionLabel && (
                actionHref ? (
                    <Link to={actionHref}>
                        <Button className="px-10 h-12 shadow-xl shadow-primary/20">
                            {actionLabel}
                        </Button>
                    </Link>
                ) : (
                    <Button onClick={action} className="px-10 h-12 shadow-xl shadow-primary/20">
                        {actionLabel}
                    </Button>
                )
            )}
        </motion.div>
    );
};

export default EmptyState;
