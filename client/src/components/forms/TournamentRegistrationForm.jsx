import React from 'react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

const categories = [
    { value: 'mens_singles', label: "Men's Singles" },
    { value: 'womens_singles', label: "Women's Singles" },
    { value: 'mens_doubles', label: "Men's Doubles" },
    { value: 'womens_doubles', label: "Women's Doubles" },
    { value: 'mixed_doubles', label: "Mixed Doubles" }
];

export default function TournamentRegistrationForm({ tournamentName, onSuccess }) {
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

    const selectedCategory = watch('category');
    const isDoubles = selectedCategory?.includes('doubles');

    const onSubmit = async (data) => {
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('Reg Data:', data);
            toast.success(`Registered for ${tournamentName}!`);
            if (onSuccess) onSuccess(data);
        } catch (error) {
            toast.error('Registration failed');
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>

                <Select
                    id="category"
                    label="Select Category"
                    options={categories}
                    placeholder="Choose category..."
                    {...register("category", { required: "Category is required" })}
                    error={errors.category}
                />

                {isDoubles && (
                    <Input
                        id="partnerName"
                        label="Partner Name"
                        placeholder="Enter partner's name"
                        {...register("partnerName", { required: "Partner name is required for doubles" })}
                        error={errors.partnerName}
                    />
                )}

                <div>
                    <Button
                        type="submit"
                        fullWidth
                        isLoading={isSubmitting}
                    >
                        Register Now
                    </Button>
                </div>
            </form>
            <Toaster position="top-right" />
        </>
    );
}
