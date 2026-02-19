import React, { useState } from 'react';
import {
    format,
    addDays,
    startOfWeek,
    isSameDay,
    addWeeks,
    subWeeks,
    isBefore,
    startOfDay
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Button from '../ui/Button';

// Utility to generate time slots
const generateTimeSlots = (startHour = 6, endHour = 22) => {
    const slots = [];
    for (let i = startHour; i < endHour; i++) {
        slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return slots;
};

export default function BookingCalendar({
    mode = 'booking', // 'booking' | 'scheduling'
    bookedSlots = [], // Array of ISO strings or objects { date, time }
    availableSlots = [], // If provided, only these are enabled (for coaches)
    onSelectSlot,
    initialDate = new Date()
}) {
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(initialDate, { weekStartsOn: 1 }));
    const [selectedSlot, setSelectedSlot] = useState(null);

    const timeSlots = generateTimeSlots();

    const nextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    const prevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));

    // Helper to check slot status
    const getSlotStatus = (day, time) => {
        const dateTimeStr = `${format(day, 'yyyy-MM-dd')}T${time}`;

        // Past check
        const now = new Date();
        const slotDate = new Date(`${format(day, 'yyyy-MM-dd')}T${time}`);
        if (isBefore(slotDate, now)) return 'past';

        // Booked check
        const isBooked = bookedSlots.some(slot => {
            if (typeof slot === 'string') return slot === dateTimeStr;
            return isSameDay(new Date(slot.date), day) && slot.time === time;
        });
        if (isBooked) return 'booked';

        // Availability check (for bookings, if limited availability provided)
        if (mode === 'booking' && availableSlots.length > 0) {
            const isAvailable = availableSlots.some(slot =>
                isSameDay(new Date(slot.date), day) && slot.time === time
            );
            if (!isAvailable) return 'unavailable';
        }

        // Availability set check (for scheduling)
        if (mode === 'scheduling') {
            const isSetAvailable = availableSlots.some(slot =>
                isSameDay(new Date(slot.date), day) && slot.time === time
            );
            if (isSetAvailable) return 'set-available';
        }

        return 'open';
    };

    const handleSlotClick = (day, time, status) => {
        if (status === 'past' || status === 'booked' || status === 'unavailable') return;

        const slotData = { date: format(day, 'yyyy-MM-dd'), time };

        if (mode === 'booking') {
            setSelectedSlot(slotData);
            onSelectSlot(slotData);
        } else {
            // Scheduling mode: toggle availability
            onSelectSlot(slotData); // Parent handles toggle logic
        }
    };

    const days = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow ring-1 ring-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-base font-semibold leading-6 text-gray-900">
                    {format(currentWeekStart, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={prevWeek}
                        className="flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={nextWeek}
                        className="flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                    >
                        <ChevronRightIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-auto overflow-x-auto">
                <div className="min-w-[600px]"> {/* Ensure generic width for scrolling on mobile */}
                    <div className="grid grid-cols-8 divide-x divide-gray-200 border-b border-gray-200 text-sm leading-6 text-gray-500">
                        <div className="py-2 pl-4">Time</div>
                        {days.map((day) => (
                            <div key={day.toString()} className={clsx("py-2 text-center font-semibold", isSameDay(day, new Date()) && "text-indigo-600")}>
                                {format(day, 'EEE')} <span className="font-normal block text-xs">{format(day, 'd')}</span>
                            </div>
                        ))}
                    </div>

                    <div className="divide-y divide-gray-100">
                        {timeSlots.map((time) => (
                            <div key={time} className="grid grid-cols-8 divide-x divide-gray-100">
                                {/* Time Column */}
                                <div className="p-2 text-xs text-right text-gray-400 pr-4 sticky left-0 bg-white">
                                    {time}
                                </div>

                                {/* Days Columns */}
                                {days.map((day) => {
                                    const status = getSlotStatus(day, time);
                                    const isSelected = selectedSlot && selectedSlot.time === time && selectedSlot.date === format(day, 'yyyy-MM-dd');

                                    return (
                                        <div key={`${day}-${time}`} className="h-14 relative group">
                                            <button
                                                type="button"
                                                onClick={() => handleSlotClick(day, time, status)}
                                                className={clsx(
                                                    "absolute inset-1 rounded-sm transition-colors text-xs font-medium flex items-center justify-center",
                                                    status === 'past' && "bg-gray-50 cursor-not-allowed",
                                                    status === 'booked' && "bg-red-50 text-red-700 cursor-not-allowed border border-red-100",
                                                    status === 'unavailable' && "bg-gray-100 cursor-not-allowed diagonal-stripe",
                                                    status === 'set-available' && "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200",
                                                    status === 'open' && "hover:bg-indigo-50 cursor-pointer border border-transparent hover:border-indigo-200",
                                                    mode === 'booking' && isSelected && "!bg-indigo-600 !text-white"
                                                )}
                                                disabled={status === 'past' || status === 'booked' || status === 'unavailable'}
                                            >
                                                {status === 'booked' && 'Booked'}
                                                {status === 'set-available' && 'Avail'}
                                                {isSelected && 'Selected'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend / Actions */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center"><div className="w-3 h-3 bg-white border border-indigo-200 mr-1 rounded-sm"></div> Open</div>
                    <div className="flex items-center"><div className="w-3 h-3 bg-indigo-600 mr-1 rounded-sm"></div> Selected</div>
                    <div className="flex items-center"><div className="w-3 h-3 bg-red-50 border border-red-100 mr-1 rounded-sm"></div> Booked</div>
                    {mode === 'scheduling' && <div className="flex items-center"><div className="w-3 h-3 bg-green-100 border border-green-200 mr-1 rounded-sm"></div> Available</div>}
                </div>
                {mode === 'booking' && (
                    <div className="flex justify-end">
                        <Button
                            disabled={!selectedSlot}
                            onClick={() => alert(`Proceed to book: ${JSON.stringify(selectedSlot)}`)}
                        >
                            Confirm Selection
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
