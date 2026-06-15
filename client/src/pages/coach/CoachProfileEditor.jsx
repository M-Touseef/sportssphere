import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    AcademicCapIcon,
    CameraIcon,
    CheckCircleIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    ExclamationCircleIcon,
    IdentificationIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { createOrUpdateProfile, getMyProfile } from '../../services/coachService';
import LoadingSpinner from '../../components/LoadingSpinner';
import UserAvatar from '../../components/ui/UserAvatar';
import CoachPageHeader from '../../components/coach/CoachPageHeader';

const fieldClass = 'mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100';

const SpecializationOption = ({ label, description, value, register }) => (
    <label className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-sky-300 hover:bg-sky-50/40 has-[:checked]:border-sky-400 has-[:checked]:bg-sky-50">
        <input
            type="checkbox"
            value={value}
            {...register('specialization')}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
        />
        <span>
            <span className="block text-sm font-bold text-slate-900 group-hover:text-sky-800">{label}</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
        </span>
    </label>
);

const CoachProfileEditor = () => {
    const { user, updateProfilePicture } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitStatus, setSubmitStatus] = useState(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [imageError, setImageError] = useState('');

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting }
    } = useForm();
    const preview = watch();

    useEffect(() => {
        const initData = async () => {
            try {
                const profileResponse = await getMyProfile();
                const data = profileResponse?.data || {};
                setValue('monthlyFee', data.monthlyFee);
                setValue('hourlyRate', data.hourlyRate);
                setValue('experience', data.experience);
                setValue('bio', data.bio);
                setValue('specialization', data.specialization || []);
            } catch (error) {
                console.error('Error fetching coach profile:', error);
            } finally {
                setLoading(false);
            }
        };

        initData();
    }, [setValue]);

    const clearStatusLater = () => window.setTimeout(() => setSubmitStatus(null), 3000);

    const onSubmit = async (data) => {
        setSubmitStatus(null);
        try {
            await createOrUpdateProfile(data);
            setSubmitStatus('success');
            clearStatusLater();
        } catch (error) {
            console.error('Error saving coach profile:', error);
            setSubmitStatus('error');
        }
    };

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
            console.error('Error uploading coach photo:', error);
            setImageError(error.response?.data?.error || 'Failed to upload profile picture.');
        } finally {
            setImageUploading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    const specializations = Array.isArray(preview.specialization) ? preview.specialization : [];

    return (
        <div className="mx-auto max-w-[1280px] space-y-6 pb-10">
            <CoachPageHeader
                eyebrow="Public presence"
                title="Coach profile"
                description="Keep your rates, experience, coaching philosophy, areas of expertise, and profile photo accurate for athletes browsing the directory."
                icon={IdentificationIcon}
                actions={(
                    <>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                            <CameraIcon className="h-4 w-4" />
                            {imageUploading ? 'Uploading...' : 'Change photo'}
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="sr-only"
                                onChange={handleProfilePictureChange}
                                disabled={imageUploading}
                            />
                        </label>
                        <button
                            type="submit"
                            form="coach-profile-form"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-lime-200 disabled:opacity-50"
                        >
                            <CheckCircleIcon className="h-5 w-5" /> {isSubmitting ? 'Saving...' : 'Save profile'}
                        </button>
                    </>
                )}
            />

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

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.65fr)]">
                <form id="coach-profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-7">
                        <div className="flex items-start gap-4 border-b border-slate-100 pb-5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><CurrencyDollarIcon className="h-5 w-5" /></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">Service details</p>
                                <h2 className="mt-1 text-xl font-black text-slate-950">Rates and experience</h2>
                                <p className="mt-1 text-sm text-slate-500">Set clear expectations before an athlete sends a request.</p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-5 md:grid-cols-3">
                            <div>
                                <label className="text-sm font-bold text-slate-700">Hourly rate (PKR)</label>
                                <input type="number" className={fieldClass} placeholder="2500" {...register('hourlyRate', { required: 'Hourly rate is required', min: 0 })} />
                                {errors.hourlyRate && <p className="mt-2 text-xs font-semibold text-rose-600">{errors.hourlyRate.message}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700">Monthly fee (optional)</label>
                                <input type="number" className={fieldClass} placeholder="18000" {...register('monthlyFee', { min: 0 })} />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700">Experience (years)</label>
                                <input type="number" className={fieldClass} placeholder="5" {...register('experience', { required: 'Experience is required', min: 0 })} />
                                {errors.experience && <p className="mt-2 text-xs font-semibold text-rose-600">{errors.experience.message}</p>}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-7">
                        <div className="flex items-start gap-4 border-b border-slate-100 pb-5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><DocumentTextIcon className="h-5 w-5" /></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">Coach story</p>
                                <h2 className="mt-1 text-xl font-black text-slate-950">Professional bio</h2>
                                <p className="mt-1 text-sm text-slate-500">Explain your coaching philosophy, credentials, and the athletes you work best with.</p>
                            </div>
                        </div>
                        <textarea
                            rows={7}
                            className={`${fieldClass} resize-y leading-6`}
                            placeholder="Share your coaching approach, certifications, achievements, and training focus..."
                            {...register('bio', { required: 'Bio is required', maxLength: { value: 1000, message: 'Bio must be 1000 characters or fewer' } })}
                        />
                        <div className="mt-2 flex justify-between gap-3 text-xs text-slate-400">
                            <span>{errors.bio ? <span className="font-semibold text-rose-600">{errors.bio.message}</span> : 'Write in a clear, athlete-friendly voice.'}</span>
                            <span>{preview.bio?.length || 0}/1000</span>
                        </div>
                    </section>

                    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-7">
                        <div className="flex items-start gap-4 border-b border-slate-100 pb-5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-50 text-lime-700"><AcademicCapIcon className="h-5 w-5" /></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime-700">Expertise</p>
                                <h2 className="mt-1 text-xl font-black text-slate-950">Areas of specialization</h2>
                                <p className="mt-1 text-sm text-slate-500">Choose the training outcomes athletes can expect from you.</p>
                            </div>
                        </div>
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            <SpecializationOption label="Tactical strategy" description="Match planning, shot selection, and game intelligence." value="tactics" register={register} />
                            <SpecializationOption label="High performance" description="Advanced drills and preparation for competition." value="high_performance" register={register} />
                            <SpecializationOption label="Fitness & conditioning" description="Movement, stamina, recovery, and athletic capacity." value="fitness" register={register} />
                        </div>
                    </section>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-sky-900 disabled:opacity-50 xl:hidden"
                    >
                        <CheckCircleIcon className="h-5 w-5" /> {isSubmitting ? 'Saving...' : 'Save profile'}
                    </button>
                </form>

                <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
                    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
                        <div className="bg-slate-950 p-6 text-white">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200">Directory preview</p>
                            <div className="mt-5 flex items-center gap-4">
                                <div className="relative">
                                    <UserAvatar user={user} className="h-20 w-20 rounded-2xl bg-white text-slate-950 text-2xl ring-2 ring-white/70" fallbackClassName="text-slate-950" />
                                    <label className="absolute -right-2 -top-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-lime-300 text-slate-950 shadow-lg transition hover:bg-lime-200">
                                        <CameraIcon className="h-4 w-4" />
                                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleProfilePictureChange} disabled={imageUploading} />
                                    </label>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="truncate text-xl font-black">{user?.name || 'Coach profile'}</h2>
                                    <p className="mt-1 text-sm text-slate-400">{preview.experience || 0} years experience</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 p-6 text-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">Hourly rate</span><strong className="text-slate-950">PKR {preview.hourlyRate || '0'}</strong></div>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3"><span className="text-slate-500">Monthly fee</span><strong className="text-slate-950">{preview.monthlyFee ? `PKR ${preview.monthlyFee}` : 'Not set'}</strong></div>
                            <div>
                                <p className="text-slate-500">Specializations</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {specializations.length > 0 ? specializations.map(item => (
                                        <span key={item} className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-700">{item.replace(/_/g, ' ')}</span>
                                    )) : <span className="text-xs text-slate-400">Choose at least one area of expertise.</span>}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
                        <h2 className="font-black text-slate-950">Profile checklist</h2>
                        <div className="mt-4 space-y-3 text-sm text-slate-600">
                            <p className="flex items-center gap-2"><CheckCircleIcon className={`h-4 w-4 ${preview.hourlyRate ? 'text-lime-600' : 'text-slate-300'}`} /> Clear hourly pricing</p>
                            <p className="flex items-center gap-2"><CheckCircleIcon className={`h-4 w-4 ${preview.bio ? 'text-lime-600' : 'text-slate-300'}`} /> Athlete-friendly bio</p>
                            <p className="flex items-center gap-2"><CheckCircleIcon className={`h-4 w-4 ${specializations.length ? 'text-lime-600' : 'text-slate-300'}`} /> Training expertise selected</p>
                            <p className="flex items-center gap-2"><CheckCircleIcon className={`h-4 w-4 ${user?.profilePicture ? 'text-lime-600' : 'text-slate-300'}`} /> Professional profile photo</p>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
};

export default CoachProfileEditor;
