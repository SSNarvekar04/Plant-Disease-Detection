/**
 * User profile routes. Every route requires a valid JWT.
 */

const express = require('express');

const controller = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // everything below requires authentication

router.get('/profile', controller.getProfile);
router.put('/profile', controller.updateProfile);
router.put('/password', controller.changePassword);
router.put('/email', controller.changeEmail);
router.delete('/profile', controller.deleteAccount);

module.exports = router;
