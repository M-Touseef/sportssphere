import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    createOrUpdateProfile,
    getMyProfile
} from '../../services/coachService';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    CurrencyDollarIcon,
    AcademicCapIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';

const SpecializationOption = ({ label, value, register }) => (
    <label className="relative flex items-start p-4 cursor-pointer rounded-xl border border-slate-200 hover:bg-emerald-50/50 hover:border-emerald-300 transition-all select-none group">
        <div className="flex items-center h-5">
            <input
                type="checkbox"
                value={value}
                {...register('specialization')}
                className="focus:ring-emerald-500 h-4 w-4 text-emerald-600 border-slate-300 rounded"
            />
        </div>
        <div className="ml-3 text-sm">
            <span className="font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">{label}</span>
        </div>
    </label>
);

const CoachProfileEditor = () => {
    const [loading, setLoading] = useState(true);
    const [submitStatus, setSubmitStatus] = useState(null);

    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm();

    useEffect(() => {
        const initData = async () => {
            try {
                const [profileRes] = await Promise.all([
                    getMyProfile()
                ]);

                if (profileRes) {
                    const data = profileRes.data || {};
                    setValue('monthlyFee', data.monthlyFee);
                    setValue('hourlyRate', data.hourlyRate);
                    setValue('experience', data.experience);
                    setValue('bio', data.bio);
                    setValue('specialization', data.specialization || []);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        initData();
    }, [setValue]);

    const onSubmit = async (data) => {
        setSubmitStatus(null);
        try {
            await createOrUpdateProfile(data);
            setSubmitStatus('success');
            setTimeout(() => setSubmitStatus(null), 3000);
        } catch (error) {
            console.error('Error saving profile:', error);
            setSubmitStatus('error');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* ── Gradient Header ─────────────────────────────── */}
            <header className="relative rounded-2xl border border-amber-200/80 bg-gradient-to-r from-indigo-950 to-indigo-900 px-6 sm:px-8 py-8 text-white shadow-lg overflow-hidden">
                {/* Decorative shapes */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-indigo-400/10 rounded-full blur-2xl" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-indigo-200/90 font-medium">Settings</p>
                        <h1 className="text-3xl font-black tracking-tight mt-1">Coach Profile</h1>
                        <p className="mt-2 text-sm text-indigo-100/80">
                            Update your qualifications, fees, and specialization details.
                        </p>
                    </div>
                    <button
                        type="submit"
                        form="coach-profile-form"
                        disabled={isSubmitting}
                        className="inline-flex items-center h-12 px-6 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-indigo-950 transition-all shadow-lg shadow-amber-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </header>

            {/* ── Status Alerts ────────────────────────────────── */}
            {submitStatus === 'success' && (
                <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 flex items-center gap-3 animate-enter">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-500 shrink-0" />
                    <h3 className="text-sm font-medium text-emerald-800">Profile saved successfully</h3>
                </div>
            )}

            {submitStatus === 'error' && (
                <div className="rounded-2xl bg-red-50 p-4 border border-red-200 flex items-center gap-3 animate-enter">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-500 shrink-0" />
                    <h3 className="text-sm font-medium text-red-800">Error saving profile. Please try again.</h3>
                </div>
            )}

            {/* ── Profile Form Card ──────────────────────────── */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-slate-100 shadow-md p-6 sm:p-8">
                <form id="coach-profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Service Details */}
                    <div>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-100">
                                <CurrencyDollarIcon className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Service Details</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Hourly Rate (PKR)</label>
                                <div className="mt-1 relative">
                                    <input
                                        type="number"
                                        className="block w-full rounded-xl border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm py-2.5"
                                        {...register('hourlyRate', { required: 'Hourly rate is required', min: 0 })}
                                    />
                                </div>
                                {errors.hourlyRate && <p className="mt-1 text-sm text-red-600">{errors.hourlyRate.message}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Monthly Fee (Optional)</label>
                                <div className="mt-1 relative">
                                    <input
                                        type="number"
                                        className="block w-full rounded-xl border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm py-2.5"
                                        {...register('monthlyFee', { min: 0 })}
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-slate-700">Experience (Years)</label>
                                <div className="mt-1 relative">
                                    <input
                                        type="number"
                                        className="block w-full rounded-xl border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm py-2.5"
                                        {...register('experience', { required: 'Experience is required', min: 0 })}
                                    />
                                </div>
                                {errors.experience && <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-100">
                                <DocumentTextIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Professional Bio</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Describe your coaching philosophy and experience</p>
                            </div>
                        </div>
                        <textarea
                            rows={4}
                            className="block w-full rounded-xl border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            placeholder="Share your coaching approach, certifications, achievements..."
                            {...register('bio', { required: 'Bio is required', maxLength: 1000 })}
                        />
                        {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>}
                        <p className="mt-2 text-xs text-slate-400">Max 1000 characters</p>
                    </div>

                    {/* Specializations */}
                    <div className="pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-100">
                                <AcademicCapIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Areas of Expertise</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Select your coaching specializations</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <SpecializationOption label="Tactical Strategy" value="tactics" register={register} />
                            <SpecializationOption label="High Performance" value="high_performance" register={register} />
                            <SpecializationOption label="Fitness & Conditioning" value="fitness" register={register} />
                        </div>
                    </div>

                    {/* Mobile Save Button */}
                    <div className="pt-6 border-t border-slate-100 flex justify-end sm:hidden">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full px-6 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CoachProfileEditor;
