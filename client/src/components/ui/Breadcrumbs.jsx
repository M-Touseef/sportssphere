import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) return null;

    return (
        <nav className="flex mb-8 overflow-x-auto whitespace-nowrap pb-2 no-scrollbar" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-3">
                <li>
                    <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                        <HomeIcon className="h-4 w-4" />
                    </Link>
                </li>
                {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const name = value.replace(/-/g, ' ');

                    return (
                        <li key={to} className="flex items-center space-x-3">
                            <ChevronRightIcon className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                            <Link
                                to={to}
                                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${last
                                        ? "text-primary cursor-default pointer-events-none"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                                aria-current={last ? 'page' : undefined}
                            >
                                <motion.span
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    {name}
                                </motion.span>
                            </Link>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
