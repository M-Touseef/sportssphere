import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
    ShieldCheckIcon,
    ArrowRightIcon,
    TrophyIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    AcademicCapIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const Login = () => {
    const { login } = useAuth();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await login(data);
            success('Welcome back! You have logged in successfully.');
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        } catch (err) {
            toastError(err.response?.data?.error || 'Login failed. Please check your email and password.');
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { icon: TrophyIcon, text: 'Join tournaments' },
        { icon: CalendarDaysIcon, text: 'Book courts' },
        { icon: UserGroupIcon, text: 'Find partners' },
        { icon: AcademicCapIcon, text: 'Get coaching' },
    ];

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                            <TrophyIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">SportSphere</span>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                                Your complete badminton<br />management platform
                            </h1>
                            <p className="text-indigo-200 text-lg max-w-md">
                                Access tournaments, book courts, find training partners, and connect with professional coaches — all in one place.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {features.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + idx * 0.1 }}
                                    className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4"
                                >
                                    <feature.icon className="h-5 w-5 text-indigo-300" />
                                    <span className="text-white text-sm font-medium">{feature.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-indigo-300 text-sm">
                        © 2025 SportSphere. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
                        <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                            <TrophyIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">SportSphere</span>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">
                            Welcome back
                        </h2>
                        <p className="text-slate-500">
                            Sign in to your account to continue
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="you@example.com"
                                error={errors.email}
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Please enter a valid email address'
                                    }
                                })}
                            />

                            <Input
                                label="Password"
                                type="password"
                                placeholder="Enter your password"
                                error={errors.password}
                                {...register('password', {
                                    required: 'Password is required'
                                })}
                            />

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                                    />
                                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                                        Remember me
                                    </span>
                                </label>

                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                fullWidth
                                size="lg"
                                isLoading={loading}
                                className="h-12 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200"
                            >
                                Sign In
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-slate-50 text-slate-500">New to SportSphere?</span>
                            </div>
                        </div>

                        {/* Register Link */}
                        <Link to="/register" className="block">
                            <Button
                                variant="outline"
                                fullWidth
                                size="lg"
                                className="h-12 font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl"
                            >
                                Create an Account
                            </Button>
                        </Link>

                        {/* Role Info */}
                        <div className="mt-8 p-4 bg-slate-100 rounded-xl">
                            <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">Available Account Types</p>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center p-2 bg-white rounded-lg">
                                    <UserGroupIcon className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
                                    <span className="text-xs font-medium text-slate-700">Player</span>
                                </div>
                                <div className="text-center p-2 bg-white rounded-lg">
                                    <AcademicCapIcon className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                                    <span className="text-xs font-medium text-slate-700">Coach</span>
                                </div>
                                <div className="text-center p-2 bg-white rounded-lg">
                                    <TrophyIcon className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                                    <span className="text-xs font-medium text-slate-700">Organizer</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Login;
