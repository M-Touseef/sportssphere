const express = require('express');
const router = express.Router();
const { register, requestRegistrationCode, login, getMe, updateDetails, completeProfile, selectRole, uploadProfilePicture } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { registerValidation, registrationCodeValidation, loginValidation, updateProfileValidation } = require('../middleware/validation');

const upload = require('../middleware/uploadMiddleware');

router.post('/request-registration-code', registrationCodeValidation, requestRegistrationCode);
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', auth, getMe);
router.put('/updatedetails', auth, updateProfileValidation, updateDetails);
router.put('/select-role', auth, selectRole);
router.put('/complete-profile', auth, upload.single('verificationDocument'), completeProfile);
router.put('/profile-picture', auth, upload.imageUpload.single('profilePicture'), uploadProfilePicture);

module.exports = router;
