const express = require('express');
const router = express.Router();
const {
  getScans,
  getScanById,
  createScan,
  deleteScan,
  rescanById,
  getVulnerabilitiesByScanId,
} = require('../controllers/scanController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getScans).post(protect, createScan);
router
  .route('/:id')
  .get(protect, getScanById)
  .delete(protect, deleteScan);
router.post('/:id/rescan', protect, rescanById);
router.get('/:id/vulnerabilities', protect, getVulnerabilitiesByScanId);

module.exports = router;