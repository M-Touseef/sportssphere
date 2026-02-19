const express = require('express');
const router = express.Router();
const {
    submitMatchResult
} = require('../controllers/matchController');
const { auth, authorize } = require('../middleware/auth');

// Match result submission
router.put('/:id/result', auth, authorize('organizer', 'admin', 'referee'), submitMatchResult);

module.exports = router;
