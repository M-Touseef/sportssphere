const express = require('express');
const router = express.Router();
const {
    register,
    requestRegistrationCode,
    forgotPassword,
    resetPassword,
    login,
    getMe,
    updateDetails,
    completeProfile,
    selectRole,
    uploadProfilePicture
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const {
    registerValidation,
    registrationCodeValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    loginValidation,
    updateProfileValidation
} = require('../middleware/validation');

const upload = require('../middleware/uploadMiddleware');

router.post('/request-registration-code', registrationCodeValidation, requestRegistrationCode);
router.post('/register', registerValidation, register);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.post('/login', loginValidation, login);
router.get('/me', auth, getMe);
router.put('/updatedetails', auth, updateProfileValidation, updateDetails);
router.put('/select-role', auth, selectRole);
router.put('/complete-profile', auth, upload.single('verificationDocument'), completeProfile);
router.put('/profile-picture', auth, upload.imageUpload.single('profilePicture'), uploadProfilePicture);

module.exports = router;
