import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const LegalPageLayout = ({ title, subtitle, lastUpdated, icon: Icon, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white text-slate-900 overflow-x-hidden"
    >
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-24 sm:pt-28 pb-12 sm:pb-16 border-b border-slate-100 bg-gradient-to-b from-indigo-50/60 via-white to-white"
        >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-8"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to home
                </Link>
                {Icon && (
                    <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 mb-6">
                        <Icon className="h-7 w-7" />
                    </div>
                )}
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.35em] text-indigo-600 mb-3">
                    SportsSphere
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mt-4 text-base sm:text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">
                        {subtitle}
                    </p>
                )}
                {lastUpdated && (
                    <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Last updated: {lastUpdated}
                    </p>
                )}
            </div>
        </motion.div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 pb-28">
            <div className="space-y-10 sm:space-y-12">{children}</div>
        </div>
    </motion.div>
);

export const LegalSection = ({ id, title, children }) => (
    <section id={id} className="scroll-mt-28">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-4 sm:mb-5">
            {title}
        </h2>
        <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
            {children}
        </div>
    </section>
);

export const LegalCard = ({ children, className = '' }) => (
    <div
        className={`rounded-2xl sm:rounded-3xl border border-slate-100 bg-slate-50/80 p-5 sm:p-8 ${className}`}
    >
        {children}
    </div>
);

export default LegalPageLayout;
