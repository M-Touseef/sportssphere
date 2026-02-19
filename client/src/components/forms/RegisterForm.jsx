import React from 'react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

const roleOptions = [
    { value: 'player', label: 'Player' },
    { value: 'coach', label: 'Coach' },
    { value: 'organizer', label: 'Organizer' }
];

export default function RegisterForm({ onSuccess }) {
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
        defaultValues: { role: 'player' }
    });

    const onSubmit = async (data) => {
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('Register Data:', data);
            toast.success('Account created successfully!');
            if (onSuccess) onSuccess(data);
        } catch (error) {
            toast.error('Registration failed');
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                <Input
                    id="name"
                    label="Full Name"
                    {...register("name", { required: "Name is required" })}
                    error={errors.name}
                />

                <Input
                    id="email"
                    type="email"
                    label="Email address"
                    {...register("email", {
                        required: "Email is required",
                        pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email"
                        }
                    })}
                    error={errors.email}
                />

                <Input
                    id="password"
                    type="password"
                    label="Password"
                    {...register("password", {
                        required: "Password is required",
                        minLength: { value: 6, message: "Min 6 chars" }
                    })}
                    error={errors.password}
                />

                <Select
                    id="role"
                    label="I am a..."
                    options={roleOptions}
                    {...register("role", { required: true })}
                    error={errors.role}
                />

                <div>
                    <Button
                        type="submit"
                        fullWidth
                        isLoading={isSubmitting}
                    >
                        Create Account
                    </Button>
                </div>
            </form>
            <Toaster position="top-right" />
        </>
    );
}
