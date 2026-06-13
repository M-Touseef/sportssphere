import { createElement, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    AcademicCapIcon,
    ArrowRightIcon,
    ShieldCheckIcon,
    TrophyIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';
import { motion as Motion } from 'framer-motion';
import AuthShell from '../components/auth/AuthShell';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const accountTypes = [
    { icon: UserGroupIcon, label: 'Player', className: 'bg-sky-50 text-sky-700 ring-sky-100' },
    { icon: AcademicCapIcon, label: 'Coach', className: 'bg-lime-50 text-lime-700 ring-lime-100' },
    { icon: TrophyIcon, label: 'Organizer', className: 'bg-slate-50 text-[#082b58] ring-slate-100' },
];

const Login = () => {
    const { login } = useAuth();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            email: '',
            password: '',
        },
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

    return (
        <AuthShell
            eyebrow="Your badminton hub"
            title="Welcome back."
            accent="Your next game is waiting."
            description="Pick up where you left off with court bookings, coaching sessions, tournament entries, and sparring requests in one connected workspace."
            cardBadge="Secure sign in"
            cardTitle="Sign in to SportsSphere"
            cardDescription="Use your registered email and password to continue."
            footer={(
                <p className="mt-6 text-center text-sm font-medium text-slate-500">
                    New to SportsSphere?{' '}
                    <Link to="/register" className="font-bold text-sky-700 transition hover:text-[#082b58]">
                        Create your account
                    </Link>
                </p>
            )}
        >
            <Motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                    <Input
                        id="login-email"
                        label="Email Address"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        error={errors.email}
                        className="h-12 border-sky-100 bg-slate-50/80 text-brand-navy placeholder:text-slate-400 focus-visible:border-brand-sky focus-visible:ring-sky-300"
                        {...register('email', {
                            required: 'Email is required',
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Please enter a valid email address',
                            },
                        })}
                    />

                    <Input
                        id="login-password"
                        label="Password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        error={errors.password}
                        className="h-12 border-sky-100 bg-slate-50/80 text-brand-navy placeholder:text-slate-400 focus-visible:border-brand-sky focus-visible:ring-sky-300"
                        {...register('password', {
                            required: 'Password is required',
                        })}
                    />

                    <div className="flex items-center justify-between gap-4">
                        <label className="group flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-300"
                            />
                            <span className="text-sm font-semibold text-slate-600 transition group-hover:text-brand-navy">
                                Remember me
                            </span>
                        </label>

                        <Link
                            to="/forgot-password"
                            className="text-sm font-bold text-sky-700 transition hover:text-brand-navy"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        isLoading={loading}
                        className="h-12 rounded-2xl bg-brand-lime text-base font-black text-brand-navy shadow-xl shadow-lime-200/70 hover:bg-lime-300 focus-visible:ring-brand-lime"
                    >
                        Sign In
                        <ArrowRightIcon className="h-5 w-5" />
                    </Button>
                </form>

                <div className="relative my-7">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white px-4 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                            One account, every role
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {accountTypes.map(({ icon, label, className }) => (
                        <div
                            key={label}
                            className={`rounded-xl p-3 text-center ring-1 ${className}`}
                        >
                            {createElement(icon, { className: 'mx-auto mb-1.5 h-5 w-5' })}
                            <span className="text-xs font-bold">{label}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                    <ShieldCheckIcon className="mt-0.5 h-5 w-5 flex-none text-sky-600" />
                    <p className="text-xs font-medium leading-5 text-slate-600">
                        Your account is protected with secure authentication and role-based access.
                    </p>
                </div>
            </Motion.div>
        </AuthShell>
    );
};

export default Login;
