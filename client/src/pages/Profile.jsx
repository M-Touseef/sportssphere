import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SKILL_LEVELS } from '../shared/constants';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    IdentificationIcon,
    PencilSquareIcon,
    XMarkIcon,
    ChartBarIcon,
    ShieldCheckIcon,
    SparklesIcon,
    CameraIcon
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';
import UserAvatar from '../components/ui/UserAvatar';
import { LAHORE_AREAS, LAHORE_CITY } from '../constants/lahoreAreas';

const ROLE_THEME = {
    coach: {
        gradient: 'from-indigo-600 via-violet-600 to-indigo-800',
        glow: 'shadow-indigo-500/25',
        chip: 'bg-white/15 text-white ring-white/20',
        accent: 'text-indigo-600',
        ring: 'ring-indigo-100',
        bar: 'bg-indigo-500'
    },
    organizer: {
        gradient: 'from-amber-500 via-orange-500 to-amber-700',
        glow: 'shadow-amber-500/25',
        chip: 'bg-white/15 text-white ring-white/20',
        accent: 'text-amber-600',
        ring: 'ring-amber-100',
        bar: 'bg-amber-500'
    },
    player: {
        gradient: 'from-sky-500 via-blue-600 to-indigo-700',
        glow: 'shadow-sky-500/25',
        chip: 'bg-white/15 text-white ring-white/20',
        accent: 'text-sky-600',
        ring: 'ring-sky-100',
        bar: 'bg-sky-500'
    },
    admin: {
        gradient: 'from-slate-700 via-slate-800 to-slate-900',
        glow: 'shadow-slate-500/25',
        chip: 'bg-white/15 text-white ring-white/20',
        accent: 'text-slate-600',
        ring: 'ring-slate-100',
        bar: 'bg-slate-600'
    }
};

const defaultTheme = ROLE_THEME.player;

const Profile = () => {
    const { user, updateProfile, updateProfilePicture } = useAuth();
    const { success, error: toastError } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);

    const theme = ROLE_THEME[user?.role] || defaultTheme;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            area: user?.area || '',
            skillLevel: user?.skillLevel || ''
        }
    });

    useEffect(() => {
        if (user) {
            reset({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                area: user.area || '',
                skillLevel: user.skillLevel || ''
            });
        }
    }, [user, reset]);

    const profileFields = useMemo(() => {
        const base = [
            { key: 'name', icon: UserIcon, label: 'Full name', value: user?.name },
            { key: 'email', icon: EnvelopeIcon, label: 'Email', value: user?.email },
            { key: 'phone', icon: PhoneIcon, label: 'Phone', value: user?.phone },
            { key: 'area', icon: MapPinIcon, label: 'Lahore area', value: user?.area ? `${user.area}, ${LAHORE_CITY}` : user?.city }
        ];
        if (user?.role === 'player') {
            base.push({
                key: 'skillLevel',
                icon: ChartBarIcon,
                label: 'Skill level',
                value: user?.skillLevel?.replace(/_/g, ' ')
            });
        }
        return base;
    }, [user]);

    const completion = useMemo(() => {
        const filled = profileFields.filter((f) => f.value?.toString().trim()).length;
        return Math.round((filled / profileFields.length) * 100);
    }, [profileFields]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await updateProfile(data);
            success('Your profile has been updated successfully.');
            setIsEditing(false);
        } catch (err) {
            toastError(err.response?.data?.error || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleProfilePictureChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toastError('Please choose an image file.');
            return;
        }

        if (file.size > 3 * 1024 * 1024) {
            toastError('Profile image must be 3MB or smaller.');
            return;
        }

        setImageUploading(true);
        try {
            await updateProfilePicture(file);
            success('Profile picture updated successfully.');
        } catch (err) {
            toastError(err.response?.data?.error || 'Failed to upload profile picture.');
        } finally {
            setImageUploading(false);
        }
    };

    if (!user) return null;

    const roleLabel = user.role?.charAt(0).toUpperCase() + user.role?.slice(1);
    const canUploadProfilePicture = user.role !== 'admin';

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32"
        >
            {/* Hero */}
            <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] shadow-xl shadow-slate-200/60">
                <div className={twMerge('absolute inset-0 bg-gradient-to-br', theme.gradient)} />
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-black/10 blur-2xl" />

                <div className="relative px-6 sm:px-10 pt-10 pb-8 sm:pt-12 sm:pb-10">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                        <div className="flex items-end gap-5 sm:gap-6">
                            <div className="relative">
                                <UserAvatar
                                    user={user}
                                    className={twMerge(
                                        'h-24 w-24 sm:h-28 sm:w-28 rounded-[1.75rem] bg-white text-4xl sm:text-5xl text-slate-800 shadow-2xl ring-2 ring-white/70',
                                        theme.glow
                                    )}
                                    fallbackClassName="text-slate-800"
                                />
                                <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white ring-4 ring-white/90">
                                    <ShieldCheckIcon className="h-4 w-4" />
                                </span>
                                {canUploadProfilePicture && (
                                    <label className="absolute -top-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white text-indigo-700 shadow-lg ring-1 ring-slate-200 transition hover:bg-indigo-50">
                                        <CameraIcon className="h-4 w-4" />
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="sr-only"
                                            onChange={handleProfilePictureChange}
                                            disabled={imageUploading}
                                        />
                                    </label>
                                )}
                            </div>
                            <div className="pb-1 min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 mb-1">
                                    Account
                                </p>
                                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
                                    {user.name}
                                </h1>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span
                                        className={twMerge(
                                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ring-1',
                                            theme.chip
                                        )}
                                    >
                                        <SparklesIcon className="h-3.5 w-3.5" />
                                        {roleLabel}
                                    </span>
                                    <span className="text-xs font-medium text-white/60 truncate max-w-[200px]">
                                        {user.email}
                                    </span>
                                </div>
                                {canUploadProfilePicture && (
                                    <label className="mt-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-white/12 px-3 text-xs font-bold text-white ring-1 ring-white/20 transition hover:bg-white/18">
                                        <CameraIcon className="h-4 w-4" />
                                        {imageUploading ? 'Uploading...' : user.profilePicture ? 'Change photo' : 'Upload photo'}
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="sr-only"
                                            onChange={handleProfilePictureChange}
                                            disabled={imageUploading}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 sm:pb-1">
                            {!isEditing ? (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    className="gap-2 h-11 px-5 font-bold bg-white text-slate-900 hover:bg-white/90 shadow-lg border-0"
                                >
                                    <PencilSquareIcon className="h-4 w-4" />
                                    Edit profile
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditing(false)}
                                    className="gap-2 h-11 px-5 font-bold bg-white/10 text-white border-white/30 hover:bg-white/20"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 max-w-md">
                        <div className="flex items-center justify-between text-xs font-semibold text-white/80 mb-2">
                            <span>Profile completeness</span>
                            <span>{completion}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${completion}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className={twMerge('h-full rounded-full', theme.bar)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {isEditing ? (
                    <motion.form
                        key="edit"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        onSubmit={handleSubmit(onSubmit)}
                        className="mt-8"
                    >
                        <div className="rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
                            <div className="border-b border-slate-100 bg-slate-50/80 px-6 sm:px-8 py-5">
                                <div className="flex items-center gap-3">
                                    <div className={twMerge('flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm', theme.accent)}>
                                        <IdentificationIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">Edit your details</h2>
                                        <p className="text-sm text-slate-500">Changes apply across SportsSphere immediately.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                                    <Input
                                        label="Full name"
                                        placeholder="Your name"
                                        error={errors.name}
                                        {...register('name', { required: 'Name is required' })}
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        disabled
                                        error={errors.email}
                                        {...register('email')}
                                    />
                                    <Input
                                        label="Phone"
                                        placeholder="+92 300 0000000"
                                        error={errors.phone}
                                        {...register('phone')}
                                    />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                            Lahore area
                                        </label>
                                        <select
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white font-semibold text-sm text-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
                                            {...register('area', { required: 'Area is required' })}
                                        >
                                            <option value="">Select area</option>
                                            {LAHORE_AREAS.map((area) => (
                                                <option key={area} value={area}>{area}</option>
                                            ))}
                                        </select>
                                        {errors.area && <p className="text-xs text-rose-500 pl-1">{errors.area.message}</p>}
                                    </div>
                                    {user.role === 'player' && (
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                                Skill level
                                            </label>
                                            <select
                                                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-sm text-slate-500 cursor-not-allowed"
                                                disabled
                                                {...register('skillLevel')}
                                            >
                                                <option value="">Select level</option>
                                                {Object.values(SKILL_LEVELS).map((level) => (
                                                    <option key={level} value={level}>
                                                        {level.replace(/_/g, ' ').toUpperCase()}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-slate-400 pl-1">
                                                Skill level is set during onboarding and cannot be changed here.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 sm:px-8 py-5">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="h-11 px-6 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                    Discard
                                </button>
                                <Button type="submit" isLoading={loading} className="h-11 px-8 font-bold shadow-lg">
                                    Save changes
                                </Button>
                            </div>
                        </div>
                    </motion.form>
                ) : (
                    <motion.div
                        key="view"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
                    >
                        {profileFields.map((field, index) => {
                            const Icon = field.icon;
                            return (
                                <motion.div
                                    key={field.key}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.35 }}
                                    className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-300"
                                >
                                    <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-slate-50 group-hover:bg-slate-100/80 transition-colors" />
                                    <div className="relative flex items-start gap-4">
                                        <div
                                            className={twMerge(
                                                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 group-hover:scale-105 transition-transform ring-1',
                                                theme.ring
                                            )}
                                        >
                                            <Icon className={twMerge('h-5 w-5', theme.accent)} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                                {field.label}
                                            </p>
                                            <p className="text-base font-semibold text-slate-900 truncate capitalize">
                                                {field.value?.toString().trim() || (
                                                    <span className="text-slate-300 font-medium italic">Not set</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: profileFields.length * 0.05 }}
                            className="sm:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm">
                                    <ShieldCheckIcon className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Verified member</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Your account is active on the SportsSphere network.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(true)}
                                className="shrink-0 h-10 px-5 text-sm font-bold border-slate-200"
                            >
                                Update details
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Profile;
