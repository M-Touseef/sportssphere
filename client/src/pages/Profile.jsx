import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
    AcademicCapIcon,
    IdentificationIcon,
    ShieldCheckIcon,
    PencilSquareIcon,
    LockClosedIcon,
    TrashIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

const Profile = () => {
    const { user, updateProfile } = useAuth();
    const { success, error: toastError } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

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
            city: user?.city || '',
            skillLevel: user?.skillLevel || ''
        }
    });

    useEffect(() => {
        if (user) {
            reset({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                city: user.city || '',
                skillLevel: user.skillLevel || ''
            });
        }
    }, [user, reset]);

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

    if (!user) return null;

    const ProfileField = ({ icon: Icon, label, value }) => (
        <div className="group px-6 py-6 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-slate-800">{value || 'Not provided'}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 pb-32">
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 border-b-4 border-indigo-600 w-fit pb-1">Profile Settings</h1>
                    <p className="mt-4 text-lg text-slate-500 max-w-2xl font-medium">Manage your personal information, contact details, and account preferences.</p>
                </div>
                <div className="flex shrink-0">
                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)} className="gap-2 px-8 h-12 font-bold shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700">
                            <PencilSquareIcon className="h-5 w-5" />
                            Edit Profile
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2 px-8 h-12 font-bold border-slate-200">
                            <LockClosedIcon className="h-5 w-5" />
                            Lock Fields
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Visual Identity */}
                <div className="lg:col-span-4">
                    <div className="bg-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)] border border-slate-100 rounded-[2.5rem] p-10 text-center flex flex-col items-center sticky top-28">
                        <div className="relative mb-8">
                            <div className="h-32 w-32 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-indigo-100 ring-8 ring-white group-hover:scale-105 transition-transform duration-500">
                                {user.name?.[0]?.toUpperCase()}
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-slate-900 mb-2 truncate max-w-full">{user.name}</h2>
                        <div className="flex items-center gap-2">
                            <span className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                                {user.role} Member
                            </span>
                        </div>
                    </div>


                </div>

                {/* Account Details */}
                <div className="lg:col-span-8">
                    <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 rounded-[2.5rem] overflow-hidden">
                        {isEditing ? (
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="p-10 space-y-8">
                                    <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                                        <IdentificationIcon className="h-5 w-5 text-indigo-600" />
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Basic Information</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input
                                            label="Full Name"
                                            placeholder="John Doe"
                                            error={errors.name}
                                            {...register('name', { required: 'Name is required' })}
                                        />
                                        <Input
                                            label="Email Address"
                                            type="email"
                                            placeholder="john@example.com"
                                            error={errors.email}
                                            disabled
                                            {...register('email')}
                                        />
                                        <Input
                                            label="Phone Number"
                                            placeholder="+92 000 0000000"
                                            error={errors.phone}
                                            {...register('phone')}
                                        />
                                        <Input
                                            label="Location"
                                            placeholder="Islamabad"
                                            error={errors.city}
                                            {...register('city', { required: 'City is required' })}
                                        />
                                        {user.role === 'player' && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                                                    Skill Proficiency
                                                </label>
                                                <select
                                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-100 font-bold text-sm text-slate-500 cursor-not-allowed outline-none transition-all shadow-sm"
                                                    disabled
                                                    {...register('skillLevel')}
                                                >
                                                    <option value="">Select level</option>
                                                    {Object.values(SKILL_LEVELS).map((level) => (
                                                        <option key={level} value={level}>{level.toUpperCase()}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-8 px-10 flex justify-end gap-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-all mr-4"
                                    >
                                        Discard Changes
                                    </button>
                                    <Button type="submit" isLoading={loading} className="px-10 h-12 font-bold shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700">
                                        Save Profile
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex flex-col">
                                <div className="p-10 pb-6 border-b border-slate-50 bg-slate-50/50">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 leading-none">Account Details</h3>
                                </div>
                                <div className="px-4">
                                    <ProfileField icon={UserIcon} label="Full Name" value={user.name} />
                                    <ProfileField icon={EnvelopeIcon} label="Email Address" value={user.email} />
                                    <ProfileField icon={PhoneIcon} label="Phone Number" value={user.phone} />
                                    <ProfileField icon={MapPinIcon} label="Location" value={user.city} />
                                    {user.role === 'player' && (
                                        <ProfileField icon={ChartBarIcon} label="Skill Level" value={user.skillLevel?.toUpperCase()} />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 bg-rose-50/30 rounded-[2.5rem] p-10 border border-rose-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <TrashIcon className="h-6 w-6 text-rose-500" />
                                    <h3 className="text-2xl font-extrabold text-rose-600">Danger Zone</h3>
                                </div>
                                <p className="text-slate-500 font-medium max-w-lg">Permanently terminate your account and wipe all participation data from the network. This cannot be undone.</p>
                            </div>
                            <Button variant="danger" className="px-8 h-12 whitespace-nowrap shadow-xl shadow-rose-100 font-bold">
                                Purge Account
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Profile;
