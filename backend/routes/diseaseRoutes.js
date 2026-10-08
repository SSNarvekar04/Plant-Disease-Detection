/**
 * Disease routes.
 *
 * Read operations are public (the landing page and result page show disease
 * information without forcing a login); write operations are admin only.
 */

const express = require('express');

const controller = require('../controllers/diseaseController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

const router = express.Router();

// Public read
router.get('/', controller.listDiseases);
router.get('/plants', controller.listPlantOptions);
router.get('/:id', controller.getDisease);

// Admin write (`...adminOnly` expands to `protect` + `authorize('admin')`)
router.post('/', ...adminOnly, controller.createDisease);
router.put('/:id', ...adminOnly, controller.updateDisease);
router.delete('/:id', ...adminOnly, controller.deleteDisease);

module.exports = router;
