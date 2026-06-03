const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { sendVerificationCodeEmail } = require('../utils/mailer');
const { LAHORE_CITY, normalizeArea } = require('../constants/lahoreAreas');

// Generate JWT Token (include verified so middleware and routes stay aligned with DB)
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            role: user.role,
            status: user.status,
            skillLevel: user.skillLevel,
            verified: user.verified === true,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE || '7d',
        }
    );
};

// Helper to infer status for backward compatibility with existing users
const inferUserStatus = (user) => {
    // IMPORTANT: Check verified FIRST because Mongoose applies default 'pending' 
    // to the status field for existing users who don't have it in the database
    if (user.verified === true) return 'approved';

    // If status is explicitly set to something other than 'pending', use it
    // (pending might be the Mongoose default being applied)
    if (user.status && user.status !== 'pending') return user.status;

    // For users with status='pending' or no status:
    // - If they have a role and city set, they're likely approved (legacy users)
    // - If they have only role, they might be waiting
    // - Otherwise, they're pending
    if (user.role && (user.area || user.city)) return 'approved';
    if (user.role && user.isProfileComplete) return 'waiting_for_approval';
    if (user.status === 'pending') return 'pending';

    return 'pending';
};

// Helper to build user response object with backward compatibility
const buildUserResponse = (user) => {
    const status = inferUserStatus(user);

    // Infer isProfileComplete for legacy users
    // If they're verified or have status=approved, their profile is complete
    const isProfileComplete = user.isProfileComplete === true ||
        user.verified === true ||
        status === 'approved' ||
        !!(user.area || user.city);

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: status,
        city: user.city,
        area: user.area,
        phone: user.phone,
        emailVerified: user.emailVerified === true,
        skillLevel: user.skillLevel,
        profilePicture: user.role === 'admin' ? undefined : user.profilePicture,
        rank: user.rank,
        achievements: user.achievements,
        coachLevel: user.coachLevel,
        isProfileComplete: isProfileComplete,
        rejectionReason: user.rejectionReason
    };
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const hashVerificationCode = (email, code) => {
    const secret = process.env.JWT_SECRET || 'sportssphere-email-verification';
    return crypto
        .createHmac('sha256', secret)
        .update(`${normalizeEmail(email)}:${code}`)
        .digest('hex');
};

const generateVerificationCode = () => {
    return String(crypto.randomInt(100000, 1000000));
};

const verifyRegistrationCode = async (email, code) => {
    const normalizedEmail = normalizeEmail(email);
    const verification = await EmailVerification.findOne({
        email: normalizedEmail,
        purpose: 'registration'
    });

    if (!verification) {
        return { ok: false, status: 400, error: 'Please request a new verification code.' };
    }

    if (verification.expiresAt <= new Date()) {
        await EmailVerification.deleteOne({ _id: verification._id });
        return { ok: false, status: 400, error: 'Verification code expired. Please request a new code.' };
    }

    if (verification.attempts >= 5) {
        await EmailVerification.deleteOne({ _id: verification._id });
        return { ok: false, status: 429, error: 'Too many incorrect attempts. Please request a new code.' };
    }

    const submittedHash = hashVerificationCode(normalizedEmail, code);
    if (submittedHash !== verification.codeHash) {
        verification.attempts += 1;
        await verification.save();
        return { ok: false, status: 400, error: 'Invalid verification code.' };
    }

    await EmailVerification.deleteOne({ _id: verification._id });
    return { ok: true };
};

// @desc    Send registration email verification code
// @route   POST /api/auth/request-registration-code
// @access  Public
exports.requestRegistrationCode = async (req, res, next) => {
    try {
        const { name, email } = req.body;
        const normalizedEmail = normalizeEmail(email);

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const existingVerification = await EmailVerification.findOne({
            email: normalizedEmail,
            purpose: 'registration'
        });

        if (existingVerification && Date.now() - existingVerification.lastSentAt.getTime() < 60000) {
            return res.status(429).json({
                error: 'Please wait before requesting another verification code.'
            });
        }

        const code = generateVerificationCode();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

        await EmailVerification.findOneAndUpdate(
            { email: normalizedEmail, purpose: 'registration' },
            {
                email: normalizedEmail,
                purpose: 'registration',
                codeHash: hashVerificationCode(normalizedEmail, code),
                expiresAt,
                lastSentAt: now,
                attempts: 0
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        try {
            await sendVerificationCodeEmail({ to: normalizedEmail, name, code });
        } catch (mailError) {
            await EmailVerification.deleteOne({ email: normalizedEmail, purpose: 'registration' });
            throw mailError;
        }

        res.status(200).json({
            success: true,
            message: 'Verification code sent to your email.',
            expiresInMinutes: 10
        });
    } catch (error) {
        if (error.message === 'Mail service is not configured') {
            return res.status(500).json({ error: 'Email verification is not configured on the server.' });
        }
        next(error);
    }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, emailVerificationCode } = req.body;
        const normalizedEmail = normalizeEmail(email);

        // Check if user exists
        let user = await User.findOne({ email: normalizedEmail });
        if (user) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const verificationResult = await verifyRegistrationCode(normalizedEmail, emailVerificationCode);
        if (!verificationResult.ok) {
            return res.status(verificationResult.status).json({ error: verificationResult.error });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user with pending status and no role
        user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: null,
            status: 'pending',
            skillLevel: null,
            isProfileComplete: false,
            emailVerified: true,
            emailVerifiedAt: new Date()
        });

        // Create token
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            token,
            user: buildUserResponse(user)
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check for user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create token
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            token,
            user: buildUserResponse(user)
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json({
            success: true,
            data: buildUserResponse(user)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Select user role
// @route   PUT /api/auth/select-role
// @access  Private
exports.selectRole = async (req, res, next) => {
    try {
        const { role, skillLevel } = req.body;

        // Validate role
        const validRoles = ['player', 'coach', 'organizer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role selected' });
        }

        // Determine updates based on role
        let updates = { role };

        if (role === 'player') {
            // For players, skillLevel determines if they need profile completion
            if (skillLevel === 'non-professional') {
                updates.skillLevel = 'non-professional';
                updates.status = 'approved'; // Non-professional players are auto-approved
                updates.isProfileComplete = true; // No profile needed
            } else if (skillLevel === 'professional') {
                updates.skillLevel = 'professional';
                updates.status = 'pending'; // Will need to complete profile
                updates.isProfileComplete = false;
            } else {
                return res.status(400).json({ error: 'Invalid skill level for player' });
            }
        } else {
            // Coach and Organizer need profile completion and admin approval
            updates.status = 'pending';
            updates.isProfileComplete = false;
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            user: buildUserResponse(user)
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Complete user profile
// @route   PUT /api/auth/complete-profile
// @access  Private
exports.completeProfile = async (req, res, next) => {
    try {
        const { phone, area, city, rank, achievements, coachLevel } = req.body;

        let verificationDocument = '';
        if (req.file) {
            try {
                // Upload to Cloudinary
                const result = await uploadToCloudinary(req.file.buffer, 'verification_docs');
                verificationDocument = result.secure_url; // Store the direct HTTPS URL
            } catch (err) {
                console.error('[VerificationUpload] Cloudinary Error:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to upload verification document to Cloudinary.'
                });
            }
        }

        const fieldsToUpdate = {
            phone,
            city: LAHORE_CITY,
            area: normalizeArea(area || city),
            isProfileComplete: true,
            status: 'waiting_for_approval'
        };

        if (rank) fieldsToUpdate.rank = rank;
        if (achievements) fieldsToUpdate.achievements = typeof achievements === 'string' ? achievements.split(',').map(s => s.trim()) : achievements;
        if (coachLevel) fieldsToUpdate.coachLevel = coachLevel;
        if (verificationDocument) fieldsToUpdate.verificationDocument = verificationDocument;

        const before = await User.findById(req.user.id).select('status name email');

        const user = await User.findByIdAndUpdate(
            req.user.id,
            fieldsToUpdate,
            { new: true, runValidators: true }
        ).select('-password');

        const newlyAwaitingReview =
            before &&
            before.status !== 'waiting_for_approval' &&
            user.status === 'waiting_for_approval';

        if (newlyAwaitingReview) {
            try {
                const admins = await User.find({ role: 'admin' }).select('_id').lean();
                const title = 'Profile pending review';
                const message = `${user.name} (${user.email}) submitted a profile for admin approval.`;
                await Promise.all(
                    admins.map((admin) =>
                        Notification.create({
                            user: admin._id,
                            type: 'system',
                            title,
                            message,
                            meta: {
                                kind: 'pending_verification',
                                applicantId: user._id.toString()
                            },
                            isRead: false
                        })
                    )
                );
            } catch (notifyErr) {
                console.error('[completeProfile] Admin notification error:', notifyErr);
            }
        }

        res.status(200).json({
            success: true,
            user: buildUserResponse(user)
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            city: LAHORE_CITY,
            area: req.body.area !== undefined || req.body.city !== undefined
                ? normalizeArea(req.body.area || req.body.city)
                : undefined
        };

        // Remove undefined fields
        Object.keys(fieldsToUpdate).forEach(key =>
            fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
        );

        const user = await User.findByIdAndUpdate(
            req.user.id,
            fieldsToUpdate,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// @desc    Upload or replace the current user's profile picture
// @route   PUT /api/auth/profile-picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id).select('role');
        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (currentUser.role === 'admin') {
            return res.status(403).json({ error: 'Admin accounts do not use profile pictures.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Profile image is required.' });
        }

        const result = await uploadToCloudinary(req.file.buffer, 'profile_pictures');
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profilePicture: result.secure_url },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            user: buildUserResponse(user)
        });
    } catch (error) {
        console.error('[ProfilePictureUpload] Error:', error);
        res.status(500).json({ error: 'Failed to upload profile picture.' });
    }
};
