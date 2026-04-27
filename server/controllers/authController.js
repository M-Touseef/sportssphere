const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { uploadToCloudinary } = require('../utils/cloudinary');

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
    if (user.role && user.city) return 'approved';
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
        !!user.city;

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: status,
        city: user.city,
        skillLevel: user.skillLevel,
        isProfileComplete: isProfileComplete,
        rejectionReason: user.rejectionReason
    };
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user with pending status and no role
        user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: null,
            status: 'pending',
            skillLevel: null,
            isProfileComplete: false
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
        const { phone, city, rank, achievements, coachLevel } = req.body;

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
            city,
            isProfileComplete: true,
            status: 'waiting_for_approval'
        };

        if (rank) fieldsToUpdate.rank = rank;
        if (achievements) fieldsToUpdate.achievements = typeof achievements === 'string' ? achievements.split(',').map(s => s.trim()) : achievements;
        if (coachLevel) fieldsToUpdate.coachLevel = coachLevel;
        if (verificationDocument) fieldsToUpdate.verificationDocument = verificationDocument;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            fieldsToUpdate,
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

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            city: req.body.city
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
