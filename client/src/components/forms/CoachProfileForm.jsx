import React from 'react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

const specializations = [
    { value: 'singles', label: 'Singles Strategy' },
    { value: 'doubles', label: 'Doubles Strategy' },
    { value: 'fitness', label: 'Fitness & Conditioning' },
    { value: 'basics', label: 'Fundamentals' }
];

export default function CoachProfileForm({ initialValues, onSuccess }) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: initialValues
    });

    const onSubmit = async (data) => {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Profile Data:', data);
            toast.success('Profile updated!');
            if (onSuccess) onSuccess(data);
        } catch (error) {
            toast.error('Update failed');
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>

                <div>
                    <label htmlFor="bio" className="block text-sm font-medium leading-6 text-gray-900">Bio</label>
                    <div className="mt-2 text-left">
                        <textarea
                            id="bio"
                            rows={4}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            {...register("bio", { required: "Bio is required", maxLength: 500 })}
                        />
                        {errors.bio && <p className="mt-2 text-sm text-red-600">{errors.bio.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                    <Input
                        id="experience"
                        type="number"
                        label="Experience (Years)"
                        {...register("experience", {
                            required: "Required",
                            min: { value: 0, message: "Must be positive" }
                        })}
                        error={errors.experience}
                    />
                    <Input
                        id="hourlyRate"
                        type="number"
                        label="Hourly Rate (₹)"
                        {...register("hourlyRate", {
                            required: "Required",
                            min: { value: 100, message: "Min rate 100" }
                        })}
                        error={errors.hourlyRate}
                    />
                </div>

                <Select
                    id="specialization"
                    label="Primary Specialization"
                    options={specializations}
                    {...register("specialization", { required: true })}
                    error={errors.specialization}
                />

                <div>
                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                    >
                        Save Profile
                    </Button>
                </div>
            </form>
            <Toaster position="top-right" />
        </>
    );
}
