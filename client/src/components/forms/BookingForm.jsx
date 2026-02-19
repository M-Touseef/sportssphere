import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import courtService from '../../services/courtService';

export default function BookingForm({ onSuccess }) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const [courtOptions, setCourtOptions] = useState([]);
    const [loadingCourts, setLoadingCourts] = useState(true);

    useEffect(() => {
        const fetchCourts = async () => {
            try {
                const response = await courtService.getCourts();
                // Assuming response.data is the array of courts based on CourtList.jsx usage
                const options = response.data.map(court => ({
                    value: court._id,
                    label: `${court.name} (${court.surfaceType})`
                }));
                setCourtOptions(options);
            } catch (error) {
                console.error("Failed to fetch courts", error);
                toast.error("Failed to load court list");
            } finally {
                setLoadingCourts(false);
            }
        };

        fetchCourts();
    }, []);

    const onSubmit = async (data) => {
        // Validate logic (e.g. End > Start)
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
                    placeholder={loadingCourts ? "Loading courts..." : "Choose a court..."}
                    {...register("courtId", { required: "Please select a court" })}
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
                            {...register("date", { required: "Date is required" })}
                            error={errors.date}
                        />
                    </div>
                    <div className="sm:col-span-1">
                        <Input
                            id="startTime"
                            type="time"
                            label="Start Time"
                            {...register("startTime", { required: "Start time is required" })}
                            error={errors.startTime}
                        />
                    </div>
                    <div className="sm:col-span-1">
                        <Input
                            id="endTime"
                            type="time"
                            label="End Time"
                            {...register("endTime", { required: "End time is required" })}
                            error={errors.endTime}
                        />
                    </div>
                </div>

                <div>
                    <Button
                        type="submit"
                        fullWidth
                        isLoading={isSubmitting}
                    >
                        Confirm Booking
                    </Button>
                </div>
            </form>
            <Toaster position="top-right" />
        </>
    );
}
