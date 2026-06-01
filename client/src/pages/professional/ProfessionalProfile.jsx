import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    createProfile,
    getMyProfile,
    updateProfile
} from '../../services/professionalService';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    CurrencyDollarIcon,
    AcademicCapIcon,
    DocumentTextIcon,
    UserIcon
} from '@heroicons/react/24/outline';

const SpecializationOption = ({ label, value, register }) => (
    <label className="relative flex items-start p-4 cursor-pointer rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-indigo-300 transition-all select-none">
        <div className="flex items-center h-5">
            <input
                type="checkbox"
                value={value}
                {...register('specializations')}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-slate-300 rounded"
            />
        </div>
        <div className="ml-3 text-sm">
            <span className="font-medium text-slate-900">{label}</span>
        </div>
    </label>
);

const ProfessionalProfile = () => {
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error'
    const [profileExists, setProfileExists] = useState(false);

    const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await getMyProfile();
                if (response.success && response.data) {
                    const data = response.data;
                    setValue('matchFee', data.matchFee);
                    setValue('experienceYears', data.experienceYears);
                    setValue('bio', data.bio);
                    setValue('specializations', data.specializations || []);
                    setValue('isActive', data.isActive);
                    setProfileExists(true);
                }
            } catch (error) {
                // If 404, it just means profile doesn't exist yet, which is fine
                if (error.response?.status !== 404) {
                    console.error('Error fetching profile:', error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [setValue]);

    const onSubmit = async (data) => {
        setSubmitStatus(null);
        try {
            if (profileExists) {
                await updateProfile(data);
            } else {
                await createProfile(data);
                setProfileExists(true);
            }
            setSubmitStatus('success');
            setIsEditing(false);

            // Clear success message after 3 seconds
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
            <header className="relative rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-600 to-amber-500 px-6 sm:px-8 py-8 text-white shadow-lg overflow-hidden">
                {/* Decorative shapes */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-white/10 rounded-full blur-2xl" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-indigo-100/90 font-medium">Settings</p>
                        <h1 className="text-3xl font-black tracking-tight mt-1">Professional Profile</h1>
                        <p className="mt-2 text-sm text-indigo-100/80">
                            Manage your public profile, fees, and specializations.
                        </p>
                    </div>
                    {profileExists && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center h-12 px-6 rounded-xl font-bold bg-white hover:bg-indigo-50 text-indigo-700 transition-all shadow-lg shadow-indigo-200"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>
            </header>

            {/* ── Status Alerts ────────────────────────────────── */}
            {submitStatus === 'success' && (
                <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 flex items-center gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-500 shrink-0" />
                    <h3 className="text-sm font-medium text-emerald-800">Profile saved successfully</h3>
                </div>
            )}

            {submitStatus === 'error' && (
                <div className="rounded-2xl bg-red-50 p-4 border border-red-200 flex items-center gap-3">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-500 shrink-0" />
                    <h3 className="text-sm font-medium text-red-800">Error saving profile. Please try again.</h3>
                </div>
            )}

            {/* ── Profile Form Card ──────────────────────────── */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-slate-100 shadow-md p-6 sm:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {/* Basic Info */}
                    <div>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-100">
                                <CurrencyDollarIcon className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Basic Information</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label htmlFor="matchFee" className="block text-sm font-medium text-slate-700">
                                    Per Match Fee (PKR)
                                </label>
                                <div className="mt-1 relative rounded-xl shadow-sm">
                                    <input
                                        type="number"
                                        id="matchFee"
                                        disabled={!isEditing && profileExists}
                                        className={`block w-full rounded-xl border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2.5 ${(!isEditing && profileExists) ? 'bg-slate-50 text-slate-500' : ''
                                            }`}
                                        {...register('matchFee', {
                                            required: 'Match fee is required',
                                            min: { value: 0, message: 'Fee cannot be negative' }
                                        })}
                                    />
                                </div>
                                {errors.matchFee && (
                                    <p className="mt-1 text-sm text-red-600">{errors.matchFee.message}</p>
                                )}
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="experienceYears" className="block text-sm font-medium text-slate-700">
                                    Years of Experience
                                </label>
                                <div className="mt-1 relative rounded-xl shadow-sm">
                                    <input
                                        type="number"
                                        id="experienceYears"
                                        disabled={!isEditing && profileExists}
                                        className={`block w-full rounded-xl border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2.5 ${(!isEditing && profileExists) ? 'bg-slate-50 text-slate-500' : ''
                                            }`}
                                        {...register('experienceYears', {
                                            required: 'Experience is required',
                                            min: { value: 0, message: 'Experience cannot be negative' }
                                        })}
                                    />
                                </div>
                                {errors.experienceYears && (
                                    <p className="mt-1 text-sm text-red-600">{errors.experienceYears.message}</p>
                                )}
                            </div>

                            <div className="sm:col-span-6">
                                <label htmlFor="bio" className="block text-sm font-medium text-slate-700">
                                    Professional Bio
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="bio"
                                        rows={4}
                                        disabled={!isEditing && profileExists}
                                        className={`block w-full rounded-xl border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${(!isEditing && profileExists) ? 'bg-slate-50 text-slate-500' : ''
                                            }`}
                                        {...register('bio', {
                                            required: 'Bio is required',
                                            maxLength: { value: 1000, message: 'Bio cannot exceed 1000 characters' }
                                        })}
                                    />
                                </div>
                                {errors.bio && (
                                    <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
                                )}
                                <p className="mt-2 text-sm text-slate-500">
                                    Write a short bio about your playing style, achievements, and what you offer.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Specializations */}
                    <div className="pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-100">
                                <AcademicCapIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Specializations</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Select your playing specializations</p>
                            </div>
                        </div>
                        <fieldset disabled={!isEditing && profileExists}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <SpecializationOption label="Singles" value="singles" register={register} />
                                <SpecializationOption label="Doubles" value="doubles" register={register} />
                                <SpecializationOption label="Mixed Doubles" value="mixed_doubles" register={register} />
                                <SpecializationOption label="Training / Sparring" value="training" register={register} />
                                <SpecializationOption label="Competitive Match" value="competitive" register={register} />
                            </div>
                        </fieldset>
                    </div>

                    {/* Visibility Toggle */}
                    {profileExists && (
                        <div className="pt-6 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-100">
                                        <UserIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Profile Visibility</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            When active, your profile is visible to non-professional players in search results.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            disabled={!isEditing}
                                            {...register('isActive')}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        <span className="ml-3 text-sm font-medium text-slate-900">
                                            {(!isEditing && profileExists) ? null : 'Active'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Actions */}
                    {(isEditing || !profileExists) && (
                        <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3">
                            {profileExists && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        reset();
                                    }}
                                    className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2.5 border border-transparent rounded-xl shadow-md shadow-indigo-200 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    )}

                    {/* Mobile Save Button */}
                    {(isEditing || !profileExists) && (
                        <div className="pt-6 border-t border-slate-100 flex justify-end sm:hidden">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full px-6 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ProfessionalProfile;
