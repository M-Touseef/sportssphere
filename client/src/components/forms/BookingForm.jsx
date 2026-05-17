import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import courtService from '../../services/courtService';
import HourSlotSelect from '../ui/HourSlotSelect';

export default function BookingForm({ onSuccess }) {
    const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
        defaultValues: { startTime: '09:00', endTime: '10:00' }
    });
    const [courtOptions, setCourtOptions] = useState([]);
    const [loadingCourts, setLoadingCourts] = useState(true);

    useEffect(() => {
        const fetchCourts = async () => {
            try {
                const response = await courtService.getCourts();
                const options = response.data.map(court => ({
                    value: court._id,
                    label: `${court.name} (${court.surfaceType})`
                }));
                setCourtOptions(options);
            } catch (error) {
                console.error('Failed to fetch courts', error);
                toast.error('Failed to load court list');
            } finally {
                setLoadingCourts(false);
            }
        };

        fetchCourts();
    }, []);

    const onSubmit = async (data) => {
        if (data.startTime >= data.endTime) {
            toast.error('End time must be after start time');
            return;
        }

        try {
            await courtService.createBooking({
                courtId: data.courtId,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime
            });
            toast.success('Court booked successfully!');
            if (onSuccess) onSuccess(data);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Booking failed');
        }
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                <Select
                    id="courtId"
                    label="Select Court"
                    options={courtOptions}
                    placeholder={loadingCourts ? 'Loading courts...' : 'Choose a court...'}
                    {...register('courtId', { required: 'Please select a court' })}
                    error={errors.courtId}
                    disabled={loadingCourts}
                />

                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                        <Input
                            id="date"
                            type="date"
                            label="Date"
                            min={today}
                            {...register('date', { required: 'Date is required' })}
                            error={errors.date}
                        />
                    </div>
                    <div className="sm:col-span-1">
                        <Controller
                            name="startTime"
                            control={control}
                            rules={{ required: 'Start time is required' }}
                            render={({ field }) => (
                                <HourSlotSelect
                                    id="startTime"
                                    label="Start hour"
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                        {errors.startTime && (
                            <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                        )}
                    </div>
                    <div className="sm:col-span-1">
                        <Controller
                            name="endTime"
                            control={control}
                            rules={{ required: 'End time is required' }}
                            render={({ field }) => (
                                <HourSlotSelect
                                    id="endTime"
                                    label="End hour"
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                        {errors.endTime && (
                            <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                        )}
                    </div>
                </div>

                <div>
                    <Button type="submit" fullWidth isLoading={isSubmitting}>
                        Confirm Booking
                    </Button>
                </div>
            </form>
            <Toaster position="top-right" />
        </>
    );
}
