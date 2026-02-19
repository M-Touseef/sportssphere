import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
    TrophyIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const Register = () => {
    const { register: authRegister } = useAuth();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
        }
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const formData = {
                name: data.name,
                email: data.email,
                password: data.password
            };

            await authRegister(formData);

            success('Account created! Please select your role to continue.');
            // After registration, the user is logged in (per authContext implementation)
            // Redirect to role selection
            navigate('/role-selection');

        } catch (err) {
            toastError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 relative overflow-hidden">
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
                                Join Pakistan's growing<br />badminton community
                            </h1>
                            <p className="text-indigo-200 text-lg max-w-md">
                                Create your account and connect with players, coaches, and tournaments across the country.
                            </p>
                        </div>

                        {/* Benefits */}
                        <div className="space-y-4">
                            {[
                                'Access to 500+ registered courts',
                                'Connect with professional coaches',
                                'Join local and national tournaments',
                                'Find training partners in your city'
                            ].map((benefit, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + idx * 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                                    <span className="text-white text-sm">{benefit}</span>
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

            {/* Right Panel - Registration Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
                <div className="w-full max-w-xl">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                            <TrophyIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">SportSphere</span>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            Create your account
                        </h2>
                        <p className="text-slate-500">
                            Enter your details to get started
                        </p>
                    </motion.div>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-5"
                        >
                            <Input
                                label="Full Name"
                                placeholder="Enter your full name"
                                error={errors.name}
                                {...register('name', { required: 'Name is required' })}
                            />

                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="you@example.com"
                                error={errors.email}
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Please enter a valid email'
                                    }
                                })}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Password"
                                    type="password"
                                    placeholder="Min 6 characters"
                                    error={errors.password}
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: { value: 6, message: 'At least 6 characters' }
                                    })}
                                />
                                <Input
                                    label="Confirm Password"
                                    type="password"
                                    placeholder="Re-enter password"
                                    error={errors.confirmPassword}
                                    {...register('confirmPassword', {
                                        required: 'Please confirm password',
                                        validate: (val) => {
                                            if (watch('password') !== val) {
                                                return "Passwords do not match";
                                            }
                                        }
                                    })}
                                />
                            </div>

                            <Button
                                type="submit"
                                fullWidth
                                size="lg"
                                isLoading={loading}
                                className="h-12 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200"
                            >
                                Continue
                            </Button>
                        </motion.div>
                    </form>

                    {/* Login Link */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>

                    {/* Terms */}
                    <p className="mt-6 text-xs text-slate-400 text-center">
                        By creating an account, you agree to our{' '}
                        <Link to="/terms" className="text-indigo-600 hover:underline">Terms of Service</Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
