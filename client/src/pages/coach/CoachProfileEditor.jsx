import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    createOrUpdateProfile,
    getMyProfile
} from '../../services/coachService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const SpecializationOption = ({ label, value, register }) => (
    <label className="relative flex items-start p-4 cursor-pointer rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-emerald-300 transition-all select-none">
        <div className="flex items-center h-5">
            <input
                type="checkbox"
                value={value}
                {...register('specialization')}
                className="focus:ring-emerald-500 h-4 w-4 text-emerald-600 border-slate-300 rounded"
            />
        </div>
        <div className="ml-3 text-sm">
            <span className="font-medium text-slate-900">{label}</span>
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
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Coach Profile Settings</h1>
                    <p className="mt-1 text-sm text-slate-500">Update your qualifications, fees, and specialization details.</p>
                </div>
                <button
                    type="submit"
                    form="coach-profile-form"
                    disabled={isSubmitting}
                    className="px-6 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {submitStatus === 'success' && (
                <div className="mb-6 rounded-xl bg-green-50 p-4 border border-green-200">
                    <div className="flex">
                        <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">Profile saved successfully</h3>
                        </div>
                    </div>
                </div>
            )}

            {submitStatus === 'error' && (
                <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200">
                    <div className="flex">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error saving profile. Please try again.</h3>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
                <form id="coach-profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Basic Info */}
                    <div>
                        <h3 className="text-lg font-medium text-slate-900 mb-4">Service Details</h3>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-6">
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-slate-700">Hourly Rate (PKR)</label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full rounded-xl border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    {...register('hourlyRate', { required: 'Hourly rate is required', min: 0 })}
                                />
                                {errors.hourlyRate && <p className="mt-1 text-sm text-red-600">{errors.hourlyRate.message}</p>}
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-slate-700">Monthly Fee (Optional)</label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full rounded-xl border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    {...register('monthlyFee', { min: 0 })}
                                />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-slate-700">Experience (Years)</label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full rounded-xl border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    {...register('experience', { required: 'Experience is required', min: 0 })}
                                />
                                {errors.experience && <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Professional Bio</label>
                        <textarea
                            rows={4}
                            className="block w-full rounded-xl border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            {...register('bio', { required: 'Bio is required', maxLength: 1000 })}
                        />
                        {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>}
                    </div>

                    {/* Specializations */}
                    <div className="pt-6 border-t border-slate-100">
                        <h3 className="text-lg font-medium text-slate-900 mb-4">Areas of Expertise</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <SpecializationOption label="Tactical Strategy" value="tactics" register={register} />
                            <SpecializationOption label="High Performance" value="high_performance" register={register} />
                            <SpecializationOption label="Fitness & Conditioning" value="fitness" register={register} />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CoachProfileEditor;
