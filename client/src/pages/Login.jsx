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
    AcademicCapIcon,
    SparklesIcon
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
        { icon: TrophyIcon, text: 'Join tournaments', color: 'from-amber-400 to-orange-500' },
        { icon: CalendarDaysIcon, text: 'Book courts', color: 'from-blue-500 to-indigo-500' },
        { icon: UserGroupIcon, text: 'Find partners', color: 'from-purple-500 to-violet-500' },
        { icon: AcademicCapIcon, text: 'Get coaching', color: 'from-emerald-500 to-teal-500' },
    ];

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#0a0a1a]">
            <div className="absolute inset-0 ambient-gradient" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-[#0a0a1a]/30 to-[#060610]" />
            <div className="absolute top-1/4 -left-24 h-[32rem] w-[32rem] rounded-full bg-purple-600/15 blur-[100px] liquid-blob" />
            <div className="absolute bottom-8 right-0 h-[28rem] w-[28rem] rounded-full bg-amber-500/10 blur-[90px] liquid-blob" style={{ animationDelay: '-7s' }} />
            <div className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[130px] pulse-glow" />

            <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">
                <div className="hidden flex-col justify-between px-12 py-10 lg:flex xl:px-16">
                    <Link to="/" className="flex items-center gap-3 self-start">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/20 bg-indigo-950 text-amber-200 shadow-xl shadow-amber-400/10">
                            <TrophyIcon className="h-6 w-6" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-white">SportSphere</span>
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-xl"
                    >
                        <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-amber-300/20 bg-amber-400/12 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200 backdrop-blur-sm">
                            <SparklesIcon className="h-4 w-4 text-amber-300" />
                            Pakistan's Premier Badminton Platform
                        </div>
                        <h1 className="text-5xl font-black leading-[1.04] tracking-tight text-white drop-shadow-2xl xl:text-6xl">
                            Welcome back to
                            <span className="block bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                                your badminton hub
                            </span>
                        </h1>
                        <p className="mt-6 max-w-lg text-lg font-medium leading-relaxed text-indigo-100/75">
                            Continue booking courts, joining tournaments, and training with trusted coaches across Lahore.
                        </p>

                        <div className="mt-10 grid grid-cols-2 gap-4">
                            {features.map((feature, idx) => (
                                <motion.div
                                    key={feature.text}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 + idx * 0.08 }}
                                    className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 backdrop-blur-sm transition-all hover:border-white/[0.12] hover:bg-white/[0.07]"
                                >
                                    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg transition-transform group-hover:scale-105`}>
                                        <feature.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-sm font-bold text-indigo-50">{feature.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <div className="text-xs font-semibold text-indigo-200/35">
                        Built for Lahore's badminton community
                    </div>
                </div>

                <div className="flex items-center justify-center px-5 py-24 sm:px-8 lg:py-12">
                    <div className="w-full max-w-md">
                        <Link to="/" className="mb-8 flex items-center justify-center gap-3 lg:hidden">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/20 bg-indigo-950 text-amber-200 shadow-xl shadow-amber-400/10">
                                <TrophyIcon className="h-6 w-6" />
                            </div>
                            <span className="text-xl font-black tracking-tight text-white">SportSphere</span>
                        </Link>

                        <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/95 p-6 shadow-[0_28px_90px_-24px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-8">
                            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-amber-400" />
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8"
                            >
                                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-950 ring-1 ring-amber-200">
                                    <ShieldCheckIcon className="h-4 w-4 text-amber-500" />
                                    Secure sign in
                                </div>
                                <h2 className="mb-2 text-3xl font-black tracking-tight text-indigo-950 sm:text-4xl">
                                    Welcome back
                                </h2>
                                <p className="text-sm font-semibold text-slate-500">
                                    Sign in to continue your SportSphere journey.
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
                                        className="h-12 border-amber-100 bg-slate-50/80 text-indigo-950 focus-visible:ring-amber-300"
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
                                        className="h-12 border-amber-100 bg-slate-50/80 text-indigo-950 focus-visible:ring-amber-300"
                                        {...register('password', {
                                            required: 'Password is required'
                                        })}
                                    />

                                    <div className="flex items-center justify-between gap-4">
                                        <label className="group flex cursor-pointer items-center gap-2">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300 text-amber-500 transition-all focus:ring-amber-300"
                                            />
                                            <span className="text-sm font-semibold text-slate-600 transition-colors group-hover:text-indigo-950">
                                                Remember me
                                            </span>
                                        </label>

                                        <Link
                                            to="/forgot-password"
                                            className="text-sm font-bold text-indigo-700 transition-colors hover:text-indigo-950"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>

                                    <Button
                                        type="submit"
                                        fullWidth
                                        size="lg"
                                        isLoading={loading}
                                        className="h-13 rounded-2xl bg-amber-400 text-base font-black text-indigo-950 shadow-xl shadow-amber-400/25 transition-all hover:bg-amber-300 hover:shadow-amber-400/40"
                                    >
                                        Sign In
                                        <ArrowRightIcon className="ml-2 h-5 w-5" />
                                    </Button>
                                </form>

                                <div className="relative my-8">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="bg-white px-4 text-xs font-bold uppercase tracking-widest text-slate-400">New to SportSphere?</span>
                                    </div>
                                </div>

                                <Link to="/register" className="block">
                                    <Button
                                        variant="outline"
                                        fullWidth
                                        size="lg"
                                        className="h-12 rounded-2xl border-indigo-100 bg-white font-black text-indigo-950 hover:border-amber-200 hover:bg-amber-50"
                                    >
                                        Create an Account
                                    </Button>
                                </Link>

                                <div className="mt-8 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-amber-50/70 p-4">
                                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700">Available Account Types</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="rounded-xl bg-white p-2 text-center shadow-sm ring-1 ring-indigo-50">
                                            <UserGroupIcon className="mx-auto mb-1 h-5 w-5 text-indigo-600" />
                                            <span className="text-xs font-bold text-slate-700">Player</span>
                                        </div>
                                        <div className="rounded-xl bg-white p-2 text-center shadow-sm ring-1 ring-emerald-50">
                                            <AcademicCapIcon className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
                                            <span className="text-xs font-bold text-slate-700">Coach</span>
                                        </div>
                                        <div className="rounded-xl bg-white p-2 text-center shadow-sm ring-1 ring-amber-50">
                                            <TrophyIcon className="mx-auto mb-1 h-5 w-5 text-amber-600" />
                                            <span className="text-xs font-bold text-slate-700">Organizer</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
