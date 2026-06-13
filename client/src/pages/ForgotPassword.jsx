import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    ArrowLeftIcon,
    CheckCircleIcon,
    EnvelopeIcon,
    KeyIcon,
    LockClosedIcon,
    ShieldCheckIcon,
    TrophyIcon
} from '@heroicons/react/24/outline';
import authService from '../services/authService';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { success, error: toastError } = useToast();
    const [step, setStep] = useState('email');
    const [loading, setLoading] = useState(false);
    const [resendSeconds, setResendSeconds] = useState(0);

    const {
        register,
        handleSubmit,
        watch,
        getValues,
        formState: { errors }
    } = useForm({
        defaultValues: {
            email: '',
            code: '',
            password: '',
            confirmPassword: ''
        }
    });

    const email = watch('email');
    const password = watch('password');

    useEffect(() => {
        if (resendSeconds <= 0) return undefined;
        const timer = window.setInterval(() => {
            setResendSeconds((seconds) => Math.max(0, seconds - 1));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [resendSeconds]);

    const getErrorMessage = (requestError, fallback) => (
        requestError.response?.data?.error || requestError.message || fallback
    );

    const requestCode = async () => {
        setLoading(true);
        try {
            await authService.forgotPassword(getValues('email'));
            setStep('reset');
            setResendSeconds(60);
            success('If that email is registered, a reset code is on its way.');
        } catch (requestError) {
            toastError(getErrorMessage(requestError, 'Unable to send a reset code.'));
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (data) => {
        setLoading(true);
        try {
            await authService.resetPassword({
                email: data.email,
                code: data.code,
                password: data.password
            });
            success('Password reset successfully. Sign in with your new password.');
            navigate('/login', { replace: true });
        } catch (requestError) {
            toastError(getErrorMessage(requestError, 'Unable to reset your password.'));
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = step === 'email' ? requestCode : resetPassword;

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-indigo-950 px-5 py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.2),transparent_35%)]" />
            <div className="absolute left-[8%] top-[12%] h-48 w-48 rounded-full border border-white/5" />
            <div className="absolute bottom-[8%] right-[10%] h-72 w-72 rounded-full border border-amber-300/10" />

            <main className="relative z-10 w-full max-w-md">
                <Link to="/" className="mb-7 flex items-center justify-center gap-3 text-white">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/20 bg-white/5 shadow-xl">
                        <TrophyIcon className="h-6 w-6 text-amber-300" />
                    </span>
                    <span className="text-xl font-black tracking-tight">SportSphere</span>
                </Link>

                <section className="overflow-hidden rounded-[2rem] border border-white/15 bg-white p-6 shadow-[0_32px_100px_-28px_rgba(0,0,0,0.75)] sm:p-8">
                    <div className="h-1 w-full rounded-full bg-gradient-to-r from-indigo-700 via-blue-500 to-amber-400" />

                    <div className="pb-7 pt-6 text-center">
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-indigo-950 ring-1 ring-amber-200">
                            {step === 'email'
                                ? <KeyIcon className="h-7 w-7" />
                                : <ShieldCheckIcon className="h-7 w-7" />}
                        </span>
                        <h1 className="mt-5 text-3xl font-black tracking-tight text-indigo-950">
                            {step === 'email' ? 'Forgot your password?' : 'Create a new password'}
                        </h1>
                        <p className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-6 text-slate-500">
                            {step === 'email'
                                ? 'Enter your account email and we will send you a secure six-digit reset code.'
                                : `Enter the code sent to ${email} and choose your new password.`}
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                        <Input
                            label="Email address"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            disabled={step === 'reset'}
                            leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                            error={errors.email}
                            className="h-12 border-slate-200 bg-slate-50 text-indigo-950 focus-visible:ring-amber-300"
                            {...register('email', {
                                required: 'Email is required',
                                pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email address' }
                            })}
                        />

                        {step === 'reset' && (
                            <>
                                <Input
                                    label="Six-digit reset code"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    placeholder="000000"
                                    leftIcon={<CheckCircleIcon className="h-5 w-5" />}
                                    error={errors.code}
                                    className="h-12 border-slate-200 bg-slate-50 tracking-[0.35em] text-indigo-950 focus-visible:ring-amber-300"
                                    {...register('code', {
                                        required: 'Reset code is required',
                                        pattern: { value: /^\d{6}$/, message: 'Enter the six-digit code' }
                                    })}
                                />

                                <Input
                                    label="New password"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="At least 6 characters"
                                    leftIcon={<LockClosedIcon className="h-5 w-5" />}
                                    error={errors.password}
                                    className="h-12 border-slate-200 bg-slate-50 text-indigo-950 focus-visible:ring-amber-300"
                                    {...register('password', {
                                        required: 'New password is required',
                                        minLength: { value: 6, message: 'Use at least 6 characters' }
                                    })}
                                />

                                <Input
                                    label="Confirm new password"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Repeat your new password"
                                    leftIcon={<LockClosedIcon className="h-5 w-5" />}
                                    error={errors.confirmPassword}
                                    className="h-12 border-slate-200 bg-slate-50 text-indigo-950 focus-visible:ring-amber-300"
                                    {...register('confirmPassword', {
                                        required: 'Please confirm your password',
                                        validate: (value) => value === password || 'Passwords do not match'
                                    })}
                                />
                            </>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            isLoading={loading}
                            className="h-13 rounded-2xl bg-amber-400 font-black text-indigo-950 shadow-xl shadow-amber-400/20 hover:bg-amber-300"
                        >
                            {step === 'email' ? 'Send reset code' : 'Reset password'}
                        </Button>
                    </form>

                    {step === 'reset' && (
                        <div className="mt-5 flex items-center justify-between gap-3 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setStep('email')}
                                className="text-slate-500 transition-colors hover:text-indigo-950"
                            >
                                Change email
                            </button>
                            <button
                                type="button"
                                onClick={requestCode}
                                disabled={loading || resendSeconds > 0}
                                className="text-indigo-700 transition-colors hover:text-indigo-950 disabled:cursor-not-allowed disabled:text-slate-400"
                            >
                                {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code'}
                            </button>
                        </div>
                    )}

                    <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-black text-indigo-700 hover:text-indigo-950">
                            <ArrowLeftIcon className="h-4 w-4" />
                            Back to sign in
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ForgotPassword;
