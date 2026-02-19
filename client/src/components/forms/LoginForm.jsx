import React from 'react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function LoginForm({ onSuccess }) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

    const onSubmit = async (data) => {
        try {
            // Simulate API
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('Login Data:', data);
            toast.success('Login successful!');
            if (onSuccess) onSuccess(data);
        } catch (error) {
            toast.error('Invalid credentials');
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                <Input
                    id="email"
                    type="email"
                    label="Email address"
                    placeholder="you@example.com"
                    {...register("email", {
                        required: "Email is required",
                        pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address"
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
                        minLength: {
                            value: 6,
                            message: "Password must be at least 6 characters"
                        }
                    })}
                    error={errors.password}
                />

                <div>
                    <Button
                        type="submit"
                        fullWidth
                        isLoading={isSubmitting}
                    >
                        Sign in
                    </Button>
                </div>
            </form>
            <Toaster position="top-right" />
        </>
    );
}
