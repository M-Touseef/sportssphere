const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Seed admin user from environment variables
 * Creates or updates admin user with credentials from .env
 */
const seedAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.log('[SeedAdmin] No admin credentials found in .env, skipping admin seeding');
            return;
        }

        // Check if admin already exists
        let admin = await User.findOne({ email: adminEmail });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        if (admin) {
            // Update existing admin password from .env
            admin.password = hashedPassword;
            admin.role = 'admin';
            admin.status = 'approved';
            admin.isProfileComplete = true;
            await admin.save();
            console.log('[SeedAdmin] Admin user updated:', adminEmail);
        } else {
            // Create new admin user
            admin = await User.create({
                name: 'System Administrator',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                status: 'approved',
                isProfileComplete: true,
                city: 'System'
            });
            console.log('[SeedAdmin] Admin user created:', adminEmail);
        }
    } catch (error) {
        console.error('[SeedAdmin] Error seeding admin:', error.message);
    }
};

module.exports = seedAdmin;
