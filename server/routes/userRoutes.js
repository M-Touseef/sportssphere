const express = require('express');
const router = express.Router();
const { getUserProfile, getCoaches, getOrganizers } = require('../controllers/userController');

router.get('/profile/:id', getUserProfile);
router.get('/coaches', getCoaches);
router.get('/organizers', getOrganizers);

module.exports = router;
