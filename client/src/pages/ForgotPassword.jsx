import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    EnvelopeIcon,
    LockClosedIcon,
} from '@heroicons/react/24/outline';
import AuthShell from '../components/auth/AuthShell';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../context/ToastContext';
import authService from '../services/authService';

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const fieldClassName = 'h-12 border-sky-100 bg-slate-50/80 text-brand-navy placeholder:text-slate-400 focus-visible:border-brand-sky focus-visible:ring-sky-300 disabled:bg-slate-100 disabled:text-slate-500';

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
        formState: { errors },
    } = useForm({
        defaultValues: {
            email: '',
            code: '',
            password: '',
            confirmPassword: '',
        },
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
                password: data.password,
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
        <AuthShell
            eyebrow="Account recovery"
            title="Get back in."
            accent="Your game continues."
            description="Recover access securely with a short-lived verification code, then return to your bookings, sessions, and competitions."
            cardBadge={step === 'email' ? 'Password recovery' : 'Secure reset'}
            cardTitle={step === 'email' ? 'Forgot your password?' : 'Create a new password'}
            cardDescription={step === 'email'
                ? 'Enter your account email and we will send a secure six-digit reset code.'
                : `Enter the code sent to ${email}, then choose a new password.`}
            footer={(
                <p className="mt-6 text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 transition hover:text-brand-navy"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Back to sign in
                    </Link>
                </p>
            )}
        >
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <Input
                    id="recovery-email"
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={step === 'reset'}
                    leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                    error={errors.email}
                    className={fieldClassName}
                    {...register('email', {
                        required: 'Email is required',
                        pattern: {
                            value: EMAIL_PATTERN,
                            message: 'Enter a valid email address',
                        },
                    })}
                />

                {step === 'reset' && (
                    <>
                        <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
                            <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-none text-sky-600" />
                            <p className="text-sm font-medium leading-6 text-slate-600">
                                The reset code expires shortly. Check your spam folder if it has not arrived.
                            </p>
                        </div>

                        <Input
                            id="reset-code"
                            label="Six-Digit Reset Code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            placeholder="000000"
                            leftIcon={<CheckCircleIcon className="h-5 w-5" />}
                            error={errors.code}
                            className={`${fieldClassName} text-center text-lg tracking-[0.3em]`}
                            {...register('code', {
                                required: 'Reset code is required',
                                pattern: {
                                    value: /^\d{6}$/,
                                    message: 'Enter the six-digit code',
                                },
                            })}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                id="new-password"
                                label="New Password"
                                type="password"
                                autoComplete="new-password"
                                placeholder="At least 6 characters"
                                leftIcon={<LockClosedIcon className="h-5 w-5" />}
                                error={errors.password}
                                className={fieldClassName}
                                {...register('password', {
                                    required: 'New password is required',
                                    minLength: {
                                        value: 6,
                                        message: 'Use at least 6 characters',
                                    },
                                })}
                            />

                            <Input
                                id="confirm-new-password"
                                label="Confirm Password"
                                type="password"
                                autoComplete="new-password"
                                placeholder="Repeat your password"
                                leftIcon={<LockClosedIcon className="h-5 w-5" />}
                                error={errors.confirmPassword}
                                className={fieldClassName}
                                {...register('confirmPassword', {
                                    required: 'Please confirm your password',
                                    validate: (value) => value === password || 'Passwords do not match',
                                })}
                            />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                            <button
                                type="button"
                                onClick={() => setStep('email')}
                                className="font-bold text-slate-500 transition hover:text-brand-navy"
                            >
                                Change email
                            </button>
                            <button
                                type="button"
                                onClick={requestCode}
                                disabled={loading || resendSeconds > 0}
                                className="font-bold text-sky-700 transition hover:text-brand-navy disabled:cursor-not-allowed disabled:text-slate-400"
                            >
                                {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend code'}
                            </button>
                        </div>
                    </>
                )}

                <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    isLoading={loading}
                    className="h-12 rounded-2xl bg-brand-lime text-base font-black text-brand-navy shadow-xl shadow-lime-200/70 hover:bg-lime-300 focus-visible:ring-brand-lime"
                >
                    {step === 'email' ? 'Send Reset Code' : 'Reset Password'}
                    <ArrowRightIcon className="h-5 w-5" />
                </Button>
            </form>
        </AuthShell>
    );
};

export default ForgotPassword;
