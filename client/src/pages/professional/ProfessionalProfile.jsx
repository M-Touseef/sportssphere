import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    CameraIcon,
    CheckCircleIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    ExclamationCircleIcon,
    EyeIcon,
    PencilSquareIcon,
    SparklesIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { createProfile, getMyProfile, updateProfile } from '../../services/professionalService';
import LoadingSpinner from '../../components/LoadingSpinner';
import UserAvatar from '../../components/ui/UserAvatar';

const fieldClass = 'mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';

const options = [
    { label: 'Singles', value: 'singles' },
    { label: 'Doubles', value: 'doubles' },
    { label: 'Mixed doubles', value: 'mixed_doubles' },
    { label: 'Training / sparring', value: 'training' },
    { label: 'Competitive match', value: 'competitive' }
];

const ProfessionalProfile = () => {
    const { user, updateProfilePicture } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [imageError, setImageError] = useState('');
    const [profileExists, setProfileExists] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting }
    } = useForm({
        defaultValues: {
            matchFee: '',
            experienceYears: '',
            bio: '',
            specializations: [],
            isActive: true
        }
    });

    const preview = watch();
    const selectedSpecializations = useMemo(
        () => Array.isArray(preview.specializations) ? preview.specializations : [],
        [preview.specializations]
    );

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await getMyProfile();
                if (response.success && response.data) {
                    const data = response.data;
                    const nextValues = {
                        matchFee: data.matchFee || '',
                        experienceYears: data.experienceYears || '',
                        bio: data.bio || '',
                        specializations: data.specializations || [],
                        isActive: data.isActive ?? true
                    };
                    reset(nextValues);
                    setProfileExists(true);
                } else {
                    setIsEditing(true);
                }
            } catch (error) {
                if (error.response?.status !== 404) {
                    console.error('Error fetching profile:', error);
                    setSubmitStatus('error');
                }
                setIsEditing(true);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [reset]);

    const onSubmit = async (data) => {
        setSubmitStatus(null);
        setImageError('');
        try {
            if (profileExists) {
                await updateProfile(data);
            } else {
                await createProfile(data);
                setProfileExists(true);
            }
            setSubmitStatus('success');
            setIsEditing(false);
            window.setTimeout(() => setSubmitStatus(null), 3000);
        } catch (error) {
            console.error('Error saving profile:', error);
            setSubmitStatus('error');
        }
    };

    const clearStatusLater = () => window.setTimeout(() => setSubmitStatus(null), 3000);

    const handleProfilePictureChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        setImageError('');
        setSubmitStatus(null);

        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setImageError('Please choose an image file.');
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            setImageError('Profile image must be 3MB or smaller.');
            return;
        }

        setImageUploading(true);
        try {
            await updateProfilePicture(file);
            setSubmitStatus('success');
            clearStatusLater();
        } catch (error) {
            console.error('Error uploading professional photo:', error);
            setImageError(error.response?.data?.error || 'Failed to upload profile picture.');
        } finally {
            setImageUploading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="mx-auto max-w-[1280px] space-y-6 pb-10">
            <header className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl shadow-slate-900/15">
                <div className="relative px-5 py-6 sm:px-8 sm:py-8">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-lime-300 via-sky-400 to-indigo-500" />
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex min-w-0 gap-4 sm:gap-5">
                            <div className="relative shrink-0">
                                <UserAvatar
                                    user={user}
                                    className="h-16 w-16 rounded-2xl bg-white text-2xl text-slate-950 ring-2 ring-white/70 sm:h-20 sm:w-20"
                                    fallbackClassName="text-slate-950"
                                />
                                <label className="absolute -right-2 -top-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-lime-300 text-slate-950 shadow-lg transition hover:bg-lime-200 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60" title={user?.profilePicture ? 'Change profile photo' : 'Upload profile photo'}>
                                    <CameraIcon className="h-4 w-4" />
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="sr-only"
                                        onChange={handleProfilePictureChange}
                                        disabled={imageUploading}
                                    />
                                </label>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-200">
                                    Professional profile
                                </p>
                                <h1 className="mt-2 truncate text-3xl font-black tracking-tight sm:text-4xl">
                                    {user?.name || 'Player profile'}
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-300">
                                    Manage the public details players see when they invite you for sparring, matches, and competitive preparation.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-bold text-white transition hover:bg-white/10 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
                                <CameraIcon className="h-4 w-4" />
                                {imageUploading ? 'Uploading...' : user?.profilePicture ? 'Change photo' : 'Upload photo'}
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="sr-only"
                                    onChange={handleProfilePictureChange}
                                    disabled={imageUploading}
                                />
                            </label>
                            <span className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold ${
                                preview.isActive ? 'border-lime-300/40 bg-lime-300 text-slate-950' : 'border-white/15 bg-white/5 text-slate-300'
                            }`}>
                                <EyeIcon className="h-4 w-4" />
                                {preview.isActive ? 'Visible' : 'Hidden'}
                            </span>
                            {profileExists && !isEditing && (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-extrabold text-slate-950 transition hover:bg-slate-100"
                                >
                                    <PencilSquareIcon className="h-4 w-4" />
                                    Edit profile
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {(submitStatus || imageError) && (
                <div className={`flex items-center gap-3 rounded-2xl border p-4 ${
                    submitStatus === 'success' && !imageError
                        ? 'border-lime-200 bg-lime-50 text-lime-900'
                        : 'border-rose-200 bg-rose-50 text-rose-900'
                }`}>
                    {submitStatus === 'success' && !imageError
                        ? <CheckCircleIcon className="h-5 w-5 shrink-0 text-lime-600" />
                        : <ExclamationCircleIcon className="h-5 w-5 shrink-0 text-rose-600" />}
                    <p className="text-sm font-semibold">
                        {imageError || (submitStatus === 'success' ? 'Profile saved successfully.' : 'Could not save your profile. Please try again.')}
                    </p>
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.7fr)]">
                <form id="professional-profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-7">
                        <SectionTitle
                            icon={CurrencyDollarIcon}
                            iconClass="bg-sky-50 text-sky-700"
                            eyebrow="Match terms"
                            title="Fees and experience"
                            description="Set clear expectations before a player sends a request."
                        />
                        <div className="mt-6 grid gap-5 md:grid-cols-2">
                            <Field label="Per match fee (PKR)" error={errors.matchFee}>
                                <input
                                    type="number"
                                    disabled={!isEditing && profileExists}
                                    className={fieldClass}
                                    placeholder="2500"
                                    {...register('matchFee', {
                                        required: 'Match fee is required',
                                        min: { value: 0, message: 'Fee cannot be negative' }
                                    })}
                                />
                            </Field>
                            <Field label="Years of experience" error={errors.experienceYears}>
                                <input
                                    type="number"
                                    disabled={!isEditing && profileExists}
                                    className={fieldClass}
                                    placeholder="4"
                                    {...register('experienceYears', {
                                        required: 'Experience is required',
                                        min: { value: 0, message: 'Experience cannot be negative' }
                                    })}
                                />
                            </Field>
                        </div>
                    </section>

                    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-7">
                        <SectionTitle
                            icon={DocumentTextIcon}
                            iconClass="bg-amber-50 text-amber-700"
                            eyebrow="Public story"
                            title="Professional bio"
                            description="Describe your playing style, achievements, and ideal sparring format."
                        />
                        <Field error={errors.bio} className="mt-6">
                            <textarea
                                rows={7}
                                disabled={!isEditing && profileExists}
                                className={`${fieldClass} resize-y leading-6`}
                                placeholder="Share your playing background, strengths, competitive level, and match preferences..."
                                {...register('bio', {
                                    required: 'Bio is required',
                                    maxLength: { value: 1000, message: 'Bio cannot exceed 1000 characters' }
                                })}
                            />
                        </Field>
                        <div className="mt-2 flex justify-between gap-3 text-xs text-slate-400">
                            <span>{errors.bio ? <span className="font-semibold text-rose-600">{errors.bio.message}</span> : 'Keep it concise and player-friendly.'}</span>
                            <span>{preview.bio?.length || 0}/1000</span>
                        </div>
                    </section>

                    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-7">
                        <SectionTitle
                            icon={SparklesIcon}
                            iconClass="bg-lime-50 text-lime-700"
                            eyebrow="Match fit"
                            title="Specializations"
                            description="Choose the formats and session types where you want to be discovered."
                        />
                        <fieldset disabled={!isEditing && profileExists} className="mt-6">
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {options.map((option) => (
                                    <label
                                        key={option.value}
                                        className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-sky-300 hover:bg-sky-50/40 has-[:checked]:border-sky-400 has-[:checked]:bg-sky-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-70"
                                    >
                                        <input
                                            type="checkbox"
                                            value={option.value}
                                            {...register('specializations')}
                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        <span className="text-sm font-bold text-slate-900 group-hover:text-sky-800">
                                            {option.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    </section>

                    {profileExists && (
                        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-7">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                <SectionTitle
                                    icon={EyeIcon}
                                    iconClass="bg-slate-950 text-white"
                                    eyebrow="Directory status"
                                    title="Profile visibility"
                                    description="When active, non-professional players can find this profile."
                                    compact
                                />
                                <label className="relative inline-flex w-fit cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        disabled={!isEditing}
                                        {...register('isActive')}
                                    />
                                    <span className="h-7 w-12 rounded-full bg-slate-200 transition peer-checked:bg-sky-600 peer-focus:ring-4 peer-focus:ring-sky-100 peer-disabled:opacity-60" />
                                    <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                                    <span className="ml-3 text-sm font-bold text-slate-700">
                                        {preview.isActive ? 'Active' : 'Hidden'}
                                    </span>
                                </label>
                            </div>
                        </section>
                    )}

                    {(isEditing || !profileExists) && (
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            {profileExists && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setSubmitStatus(null);
                                    }}
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-extrabold text-white shadow-lg shadow-slate-900/15 transition hover:bg-sky-900 disabled:opacity-50"
                            >
                                <CheckCircleIcon className="h-5 w-5" />
                                {isSubmitting ? 'Saving...' : 'Save profile'}
                            </button>
                        </div>
                    )}
                </form>

                <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
                    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
                        <div className="bg-slate-950 p-6 text-white">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200">Directory preview</p>
                            <div className="mt-5 flex items-center gap-4">
                                <div className="relative">
                                    <UserAvatar user={user} className="h-20 w-20 rounded-2xl bg-white text-2xl text-slate-950 ring-2 ring-white/70" fallbackClassName="text-slate-950" />
                                    <label className="absolute -right-2 -top-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-lime-300 text-slate-950 shadow-lg transition hover:bg-lime-200 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60" title={user?.profilePicture ? 'Change profile photo' : 'Upload profile photo'}>
                                        <CameraIcon className="h-4 w-4" />
                                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleProfilePictureChange} disabled={imageUploading} />
                                    </label>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="truncate text-xl font-black">{user?.name || 'Professional player'}</h2>
                                    <p className="mt-1 text-sm text-slate-400">{preview.experienceYears || 0} years experience</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 p-6 text-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <span className="text-slate-500">Match fee</span>
                                <strong className="text-slate-950">PKR {preview.matchFee || '0'}</strong>
                            </div>
                            <div>
                                <p className="text-slate-500">Specializations</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {selectedSpecializations.length > 0 ? selectedSpecializations.map((item) => (
                                        <span key={item} className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                                            {item.replace(/_/g, ' ')}
                                        </span>
                                    )) : <span className="text-xs text-slate-400">Choose at least one match format.</span>}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
                        <h2 className="font-black text-slate-950">Profile checklist</h2>
                        <div className="mt-4 space-y-3 text-sm text-slate-600">
                            <ChecklistItem done={preview.matchFee} label="Match fee added" />
                            <ChecklistItem done={preview.experienceYears} label="Experience added" />
                            <ChecklistItem done={preview.bio} label="Bio written" />
                            <ChecklistItem done={selectedSpecializations.length} label="Formats selected" />
                            <ChecklistItem done={user?.profilePicture} label="Professional profile photo" />
                            <ChecklistItem done={preview.isActive} label="Directory visible" />
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
};

const SectionTitle = ({ icon, iconClass, eyebrow, title, description, compact = false }) => {
    const IconComponent = icon;

    return (
    <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
            <IconComponent className="h-5 w-5" />
        </div>
        <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">{eyebrow}</p>
            <h2 className={`${compact ? 'text-lg' : 'text-xl'} mt-1 font-black text-slate-950`}>{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
    </div>
    );
};

const Field = ({ label, error, className = '', children }) => (
    <div className={className}>
        {label && <label className="text-sm font-bold text-slate-700">{label}</label>}
        {children}
        {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error.message}</p>}
    </div>
);

const ChecklistItem = ({ done, label }) => (
    <p className="flex items-center gap-2">
        <CheckCircleIcon className={`h-4 w-4 ${done ? 'text-lime-600' : 'text-slate-300'}`} />
        {label}
    </p>
);

export default ProfessionalProfile;
