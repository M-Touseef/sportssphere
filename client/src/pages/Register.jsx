import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    ArrowRightIcon,
    CheckBadgeIcon,
    EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { motion as Motion } from 'framer-motion';
import AuthShell from '../components/auth/AuthShell';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authService from '../services/authService';

const fieldClassName = 'h-12 border-sky-100 bg-slate-50/80 text-brand-navy placeholder:text-slate-400 focus-visible:border-brand-sky focus-visible:ring-sky-300 disabled:bg-slate-100 disabled:text-slate-500';

const Register = () => {
    const { register: authRegister } = useAuth();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);

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
            confirmPassword: '',
            emailVerificationCode: '',
        },
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            if (!verificationSent) {
                await authService.requestRegistrationCode({
                    name: data.name,
                    email: data.email,
                });

                setVerificationSent(true);
                success('Verification code sent. Please check your email.');
                return;
            }

            const formData = {
                name: data.name,
                email: data.email,
                password: data.password,
                emailVerificationCode: data.emailVerificationCode,
            };

            await authRegister(formData);
            success('Email verified and account created! Please select your role to continue.');
            navigate('/role-selection');
        } catch (err) {
            toastError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resendCode = async () => {
        setLoading(true);
        try {
            await authService.requestRegistrationCode({
                name: watch('name'),
                email: watch('email'),
            });
            success('A new verification code was sent.');
        } catch (err) {
            toastError(err.response?.data?.error || err.message || 'Could not resend code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            eyebrow="Join SportsSphere"
            title="Build your profile."
            accent="Step onto the court."
            description="Create one free account, choose your role, and connect with the badminton services that match the way you play, coach, or organize."
            cardBadge={verificationSent ? 'Verify your email' : 'Free account'}
            cardTitle={verificationSent ? 'Check your inbox' : 'Create your account'}
            cardDescription={verificationSent
                ? `Enter the six-digit code sent to ${watch('email')}.`
                : 'Start with your basic details. You will choose your role next.'}
            footer={(
                <div className="mt-6 text-center">
                    <p className="text-sm font-medium text-slate-500">
                        Already have an account?{' '}
                        <Link to="/login" className="font-bold text-sky-700 transition hover:text-[#082b58]">
                            Sign in
                        </Link>
                    </p>
                    <p className="mt-4 text-xs leading-5 text-slate-400">
                        By creating an account, you agree to our{' '}
                        <Link to="/terms" className="font-semibold text-sky-700 hover:text-[#082b58]">
                            Terms of Service
                        </Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="font-semibold text-sky-700 hover:text-[#082b58]">
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </div>
            )}
        >
            <Motion.form
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
            >
                <Input
                    id="register-name"
                    label="Full Name"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    error={errors.name}
                    disabled={verificationSent}
                    className={fieldClassName}
                    {...register('name', { required: 'Name is required' })}
                />

                <Input
                    id="register-email"
                    label="Email Address"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    error={errors.email}
                    disabled={verificationSent}
                    className={fieldClassName}
                    {...register('email', {
                        required: 'Email is required',
                        pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Please enter a valid email',
                        },
                    })}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                        id="register-password"
                        label="Password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Minimum 6 characters"
                        error={errors.password}
                        disabled={verificationSent}
                        className={fieldClassName}
                        {...register('password', {
                            required: 'Password is required',
                            minLength: { value: 6, message: 'At least 6 characters' },
                        })}
                    />
                    <Input
                        id="register-confirm-password"
                        label="Confirm Password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        error={errors.confirmPassword}
                        disabled={verificationSent}
                        className={fieldClassName}
                        {...register('confirmPassword', {
                            required: 'Please confirm password',
                            validate: (value) => watch('password') === value || 'Passwords do not match',
                        })}
                    />
                </div>

                {verificationSent && (
                    <Motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
                            <EnvelopeIcon className="mt-0.5 h-5 w-5 flex-none text-sky-600" />
                            <p className="text-sm font-medium leading-6 text-slate-600">
                                The code expires in 10 minutes. Check your spam folder if it does not arrive.
                            </p>
                        </div>

                        <Input
                            id="registration-code"
                            label="Verification Code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            placeholder="Enter 6-digit code"
                            error={errors.emailVerificationCode}
                            className={`${fieldClassName} text-center text-lg tracking-[0.35em]`}
                            {...register('emailVerificationCode', {
                                required: 'Verification code is required',
                                pattern: {
                                    value: /^\d{6}$/,
                                    message: 'Enter the 6-digit code',
                                },
                            })}
                        />

                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                            <button
                                type="button"
                                onClick={() => setVerificationSent(false)}
                                className="font-bold text-slate-500 transition hover:text-brand-navy"
                            >
                                Edit email
                            </button>
                            <button
                                type="button"
                                onClick={resendCode}
                                disabled={loading}
                                className="font-bold text-sky-700 transition hover:text-brand-navy disabled:opacity-50"
                            >
                                Resend code
                            </button>
                        </div>
                    </Motion.div>
                )}

                {!verificationSent && (
                    <div className="flex items-start gap-3 rounded-2xl border border-lime-100 bg-lime-50/70 p-4">
                        <CheckBadgeIcon className="mt-0.5 h-5 w-5 flex-none text-lime-700" />
                        <p className="text-xs font-medium leading-5 text-slate-600">
                            We verify your email before creating the account. Role and profile setup come next.
                        </p>
                    </div>
                )}

                <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    isLoading={loading}
                    className="h-12 rounded-2xl bg-brand-lime text-base font-black text-brand-navy shadow-xl shadow-lime-200/70 hover:bg-lime-300 focus-visible:ring-brand-lime"
                >
                    {verificationSent ? 'Verify and Create Account' : 'Continue'}
                    <ArrowRightIcon className="h-5 w-5" />
                </Button>
            </Motion.form>
        </AuthShell>
    );
};

export default Register;
