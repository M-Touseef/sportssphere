import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    AcademicCapIcon,
    BuildingOffice2Icon,
    CheckCircleIcon,
    DocumentArrowUpIcon,
    MapPinIcon,
    PhoneIcon,
    ShieldCheckIcon,
    TrophyIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { LAHORE_AREAS, LAHORE_CITY } from '../constants/lahoreAreas';

const roleConfig = {
    professional: {
        Icon: TrophyIcon,
        eyebrow: 'Competitive verification',
        title: 'Complete your professional profile',
        description: 'Add your playing credentials so organizers and players know you are ready for competitive matches.',
        accent: 'emerald',
        panel: 'border-emerald-200 bg-emerald-50/70 text-emerald-950',
        icon: 'bg-emerald-500 text-white shadow-emerald-900/15',
        chip: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        submit: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-900/15'
    },
    coach: {
        Icon: AcademicCapIcon,
        eyebrow: 'Coach verification',
        title: 'Complete your coach profile',
        description: 'Share your credentials and experience so athletes can trust the profile we publish.',
        accent: 'amber',
        panel: 'border-amber-200 bg-amber-50/70 text-amber-950',
        icon: 'bg-amber-500 text-white shadow-amber-900/15',
        chip: 'bg-amber-100 text-amber-800 border-amber-200',
        submit: 'bg-amber-500 hover:bg-amber-600 shadow-amber-900/15'
    },
    organizer: {
        Icon: BuildingOffice2Icon,
        eyebrow: 'Venue verification',
        title: 'Complete your organizer profile',
        description: 'Upload venue or business proof so your courts and tournaments can go live with confidence.',
        accent: 'sky',
        panel: 'border-sky-200 bg-sky-50/70 text-sky-950',
        icon: 'bg-sky-600 text-white shadow-sky-900/15',
        chip: 'bg-sky-100 text-sky-800 border-sky-200',
        submit: 'bg-sky-600 hover:bg-sky-700 shadow-sky-900/15'
    }
};

const inputShell = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100';

const uploadTone = {
    emerald: {
        icon: 'bg-emerald-50 text-emerald-700',
        file: 'file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200'
    },
    amber: {
        icon: 'bg-amber-50 text-amber-700',
        file: 'file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200'
    },
    sky: {
        icon: 'bg-sky-50 text-sky-700',
        file: 'file:bg-sky-100 file:text-sky-800 hover:file:bg-sky-200'
    }
};

const ProfileSetup = () => {
    const { completeProfile, user } = useAuth();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues: {
            area: '',
            phone: '',
            rank: '',
            achievements: '',
            coachLevel: ''
        }
    });

    const profileType = useMemo(() => {
        if (user?.role === 'player' && user?.skillLevel === 'professional') return 'professional';
        if (user?.role === 'coach') return 'coach';
        if (user?.role === 'organizer') return 'organizer';
        return 'professional';
    }, [user]);

    const config = roleConfig[profileType];
    const RoleIcon = config.Icon;
    const needsDocument = profileType === 'professional' || profileType === 'coach' || profileType === 'organizer';

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const formData = new FormData();

            formData.append('city', LAHORE_CITY);
            formData.append('area', data.area);
            if (data.phone) formData.append('phone', data.phone);

            if (profileType === 'professional') {
                if (data.rank) formData.append('rank', data.rank);
                if (data.achievements) formData.append('achievements', data.achievements);
            }

            if (profileType === 'coach') {
                if (data.coachLevel) formData.append('coachLevel', data.coachLevel);
                if (data.achievements) formData.append('achievements', data.achievements);
            }

            if (data.verificationDocument?.[0]) {
                formData.append('verificationDocument', data.verificationDocument[0]);
            }

            await completeProfile(formData);
            success('Profile submitted. Your account is pending admin verification.');
            navigate('/pending-verification');
        } catch (err) {
            toastError(err.response?.data?.error || 'Profile setup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen sports-canvas px-4 py-8 sm:px-6 lg:px-8">
            <div
                className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.35fr] lg:items-start"
            >
                <aside className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl shadow-slate-900/15">
                    <div className="relative p-7 sm:p-9">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-lime-300 via-sky-400 to-indigo-500" />
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                            <RoleIcon className="h-8 w-8 text-lime-200" />
                        </div>
                        <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-200">
                            {config.eyebrow}
                        </p>
                        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                            {config.title}
                        </h1>
                        <p className="mt-4 max-w-md text-sm font-medium leading-6 text-slate-300">
                            {config.description}
                        </p>

                        <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
                            {[
                                'Location and contact details',
                                profileType === 'organizer' ? 'Business or venue document' : 'Credentials and achievements',
                                'Admin review before full access'
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                                    <CheckCircleIcon className="h-5 w-5 shrink-0 text-lime-300" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
                >
                    <div className="border-b border-slate-100 bg-white px-5 py-5 sm:px-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                    Verification request
                                </p>
                                <h2 className="mt-1 text-xl font-black text-slate-950">Profile details</h2>
                            </div>
                            <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${config.chip}`}>
                                <ShieldCheckIcon className="h-4 w-4" />
                                {profileType === 'professional' ? 'Professional player' : profileType}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6 p-5 sm:p-8">
                        {profileType === 'professional' && (
                            <section className={`rounded-2xl border p-5 ${config.panel}`}>
                                <div className="mb-5 flex items-start gap-3">
                                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md ${config.icon}`}>
                                        <TrophyIcon className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <h3 className="font-black">Professional details</h3>
                                        <p className="mt-1 text-sm opacity-75">Rank and achievements help admins verify your competitive status.</p>
                                    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input
                                        label="Current rank"
                                        placeholder="e.g. National Rank #5"
                                        error={errors.rank}
                                        {...register('rank', { required: 'Rank is required for professionals' })}
                                    />
                                    <DocumentUpload register={register} errors={errors} required={needsDocument} tone={config.accent} label="Verification document" />
                                </div>
                                <TextareaField
                                    label="Key achievements"
                                    placeholder="List tournament wins, titles, or notable competitive results..."
                                    className="mt-4"
                                    {...register('achievements')}
                                />
                            </section>
                        )}

                        {profileType === 'coach' && (
                            <section className={`rounded-2xl border p-5 ${config.panel}`}>
                                <div className="mb-5 flex items-start gap-3">
                                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md ${config.icon}`}>
                                        <AcademicCapIcon className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <h3 className="font-black">Coaching credentials</h3>
                                        <p className="mt-1 text-sm opacity-75">Add the qualification admins should review before approving your profile.</p>
                                    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input
                                        label="Certification level"
                                        placeholder="e.g. BWF Level 1"
                                        error={errors.coachLevel}
                                        {...register('coachLevel', { required: 'Certification level is required' })}
                                    />
                                    <DocumentUpload register={register} errors={errors} required={needsDocument} tone={config.accent} label="Verification document" />
                                </div>
                                <TextareaField
                                    label="Experience and achievements"
                                    placeholder="Describe your coaching background and student successes..."
                                    className="mt-4"
                                    {...register('achievements')}
                                />
                            </section>
                        )}

                        {profileType === 'organizer' && (
                            <section className={`rounded-2xl border p-5 ${config.panel}`}>
                                <div className="mb-5 flex items-start gap-3">
                                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md ${config.icon}`}>
                                        <BuildingOffice2Icon className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <h3 className="font-black">Business verification</h3>
                                        <p className="mt-1 text-sm opacity-75">Upload proof tied to your venue, business, or organizer identity.</p>
                                    </div>
                                </div>
                                <DocumentUpload register={register} errors={errors} required={needsDocument} tone={config.accent} label="Business or venue document" wide />
                            </section>
                        )}

                        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                            <div className="mb-5 flex items-start gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm ring-1 ring-slate-200">
                                    <MapPinIcon className="h-5 w-5" />
                                </span>
                                <div>
                                    <h3 className="font-black text-slate-950">Location and contact</h3>
                                    <p className="mt-1 text-sm text-slate-500">SportsSphere currently verifies profiles for Lahore.</p>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="block pl-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        Lahore area
                                    </label>
                                    <select
                                        className={inputShell}
                                        {...register('area', { required: 'Area is required' })}
                                    >
                                        <option value="">Select Lahore area</option>
                                        {LAHORE_AREAS.map((area) => (
                                            <option key={area} value={area}>{area}</option>
                                        ))}
                                    </select>
                                    {errors.area && <p className="pl-1 text-xs font-bold text-rose-600">{errors.area.message}</p>}
                                </div>
                                <Input
                                    label="Phone number"
                                    placeholder="+92 300 1234567"
                                    leftIcon={<PhoneIcon className="h-4 w-4" />}
                                    error={errors.phone}
                                    {...register('phone')}
                                />
                            </div>
                        </section>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                        <p className="text-xs font-semibold text-slate-500">
                            Your account will unlock after an admin approves this request.
                        </p>
                        <Button
                            type="submit"
                            isLoading={loading}
                            className={`h-12 px-6 text-white ${config.submit}`}
                        >
                            Submit for verification
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DocumentUpload = ({ register, errors, required, tone, label, wide = false }) => (
    <div className={wide ? 'w-full' : undefined}>
        <label className="mb-2 block pl-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
            {label}
        </label>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${uploadTone[tone].icon}`}>
                    <DocumentArrowUpIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className={`w-full text-sm font-semibold text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:px-4 file:py-2 file:text-sm file:font-bold ${uploadTone[tone].file}`}
                        {...register('verificationDocument', required ? { required: `${label} is required` } : undefined)}
                    />
                    <p className="mt-2 text-xs font-medium text-slate-400">PDF, JPG, or PNG files are accepted.</p>
                </div>
            </div>
        </div>
        {errors.verificationDocument && (
            <p className="mt-2 pl-1 text-xs font-bold text-rose-600">{errors.verificationDocument.message}</p>
        )}
    </div>
);

const TextareaField = ({ label, className = '', ...props }) => (
    <div className={className}>
        <label className="mb-2 block pl-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
            {label}
        </label>
        <textarea
            rows={4}
            className={`${inputShell} min-h-28 resize-y leading-6`}
            {...props}
        />
    </div>
);

export default ProfileSetup;
