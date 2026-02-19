const mongoose = require('mongoose');
const path = require('path');

// Use absolute paths to avoid require errors
const Session = require(path.resolve(__dirname, '../server/models/Session'));
const Court = require(path.resolve(__dirname, '../server/models/Court'));
const User = require(path.resolve(__dirname, '../server/models/User'));

async function verifyLogic() {
    try {
        await mongoose.connect('mongodb://localhost:27017/sportsphere');
        console.log('Connected to DB');

        // 1. Find a coach and a court
        const coach = await User.findOne({ role: 'coach' });
        const court = await Court.findOne();
        if (!coach || !court) throw new Error('Coach or Court missing');

        // 2. Mock a published session
        const duration = 2;
        const courtFee = court.pricePerHour * duration;

        const session = await Session.create({
            coach: coach._id,
            court: court._id,
            date: new Date(),
            startTime: '10:00',
            endTime: '12:00',
            duration,
            totalPrice: 1000,
            courtFee,
            maxStudents: 2,
            students: [],
            isPublished: true,
            status: 'pending'
        });
        console.log(`Session created with courtFee: ${session.courtFee}, maxStudents: ${session.maxStudents}`);

        // 3. Add students
        const student1 = await User.findOne({ role: 'player' });
        if (student1) {
            session.students.push(student1._id);
            await session.save();
            console.log(`Student 1 enrolled. Count: ${session.students.length}`);
        }

        // 4. Pay court fee
        session.courtPaymentStatus = 'paid';
        await session.save();
        console.log(`Court payment status: ${session.courtPaymentStatus}`);

        // Clean up
        await Session.findByIdAndDelete(session._id);
        console.log('Verification finished successfully');
        process.exit(0);
    } catch (err) {
        console.error('Verification failed:', err);
        process.exit(1);
    }
}

verifyLogic();
