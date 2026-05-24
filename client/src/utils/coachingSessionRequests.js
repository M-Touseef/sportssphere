/**
 * Normalize coach Session documents into request rows for dashboards.
 * Legacy rows may have multiple students on one pending session; split for display.
 */
export const expandCoachingSessionsForCoach = (sessions) => {
    const list = Array.isArray(sessions) ? sessions : [];

    return list.flatMap((session) => {
        const students = (session.students || []).filter(Boolean);
        const isLegacyMergedPending =
            session.status === 'pending' &&
            students.length > 1 &&
            (session.maxStudents || 1) <= 1;

        const rows = isLegacyMergedPending ? students.map((s) => [s]) : [students];

        return rows.map((studentsForRow) => {
            const requester =
                typeof studentsForRow[0] === 'object' ? studentsForRow[0] : null;

            return {
                _id: session._id,
                type: 'COACHING_SESSION',
                requester,
                students: studentsForRow,
                maxStudents: session.maxStudents || 1,
                availabilitySlot: {
                    date: session.date,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    courtName: session.court?.name,
                    courtFee: session.courtFee,
                    courtPaymentStatus: session.courtPaymentStatus
                },
                message: session.notes || 'Coaching session request',
                paymentPlan: session.planType,
                responseDeadline: session.responseDeadline,
                status:
                    session.status === 'pending'
                        ? 'PENDING_RESPONSE'
                        : session.status === 'pending_payment'
                          ? 'ACCEPTED'
                          : session.status === 'confirmed'
                            ? 'PAID & CONFIRMED'
                            : session.status === 'cancelled'
                              ? 'REJECTED'
                              : session.status,
                createdAt: session.createdAt,
                isLegacyMergedPending
            };
        });
    });
};
