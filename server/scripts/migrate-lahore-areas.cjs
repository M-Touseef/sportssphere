require('dotenv').config();
const mongoose = require('mongoose');
const Court = require('../models/Court');
const User = require('../models/User');
const Tournament = require('../models/Tournament');
const CoachProfile = require('../models/CoachProfile');
const { LAHORE_CITY, LAHORE_AREAS, normalizeArea } = require('../constants/lahoreAreas');

const DEFAULT_AREA = 'Johar Town';

const inferArea = (...values) => {
    for (const value of values) {
        const raw = String(value || '').trim();
        if (!raw) continue;
        const found = LAHORE_AREAS.find((area) => area.toLowerCase() === raw.toLowerCase());
        if (found) return found;
    }
    return DEFAULT_AREA;
};

async function run() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGO_URI or MONGODB_URI is required');

    await mongoose.connect(uri);

    const users = await User.find({});
    for (const user of users) {
        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    area: normalizeArea(user.area || inferArea(user.city), DEFAULT_AREA),
                    city: LAHORE_CITY
                }
            }
        );
    }

    const courts = await Court.find({});
    for (const court of courts) {
        await Court.updateOne(
            { _id: court._id },
            {
                $set: {
                    'location.area': normalizeArea(court.location?.area || inferArea(court.location?.city, court.location?.address), DEFAULT_AREA),
                    'location.city': LAHORE_CITY
                }
            }
        );
    }

    const tournaments = await Tournament.find({}).populate('court', 'location');
    for (const tournament of tournaments) {
        const update = { city: LAHORE_CITY };
        if (tournament.court?.location?.area && !String(tournament.venue || '').includes(tournament.court.location.area)) {
            update.venue = [tournament.venue, tournament.court.location.area].filter(Boolean).join(', ');
        }
        await Tournament.updateOne({ _id: tournament._id }, { $set: update });
    }

    const coachProfiles = await CoachProfile.find({});
    for (const profile of coachProfiles) {
        const areas = Array.isArray(profile.location?.areas) ? profile.location.areas : [];
        await CoachProfile.updateOne(
            { _id: profile._id },
            {
                $set: {
                    'location.city': LAHORE_CITY,
                    'location.areas': areas.length ? areas.map((area) => normalizeArea(area, DEFAULT_AREA)) : [DEFAULT_AREA]
                }
            }
        );
    }

    console.log(`Migrated ${users.length} users, ${courts.length} courts, ${tournaments.length} tournaments, ${coachProfiles.length} coach profiles to Lahore area data.`);
    await mongoose.disconnect();
}

run().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
