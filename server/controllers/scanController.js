const asyncHandler = require('express-async-handler');
const Scan = require('../models/scanModel');
const Vulnerability = require('../models/vulnerabilityModel');
const { executeScan } = require('../services/nuclei/scanner');
const { formatDuration } = require('../utils/formatDuration');

// @desc    Get all scans
// @route   GET /api/scans
// @access  Private
const getScans = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  const searchQuery = search
    ? {
        $or: [
          { address: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const total = await Scan.countDocuments({
    ...searchQuery,
  });

  const scans = await Scan.find({
    ...searchQuery,
  })
    .populate({
      path: 'checkedBy',
      select: 'firstName lastName',
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const formattedScans = scans.map((scan) => ({
    id: scan._id,
    address: scan.address,
    date: new Date(scan.createdAt).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    checkedBy: `${scan.checkedBy.firstName} ${scan.checkedBy.lastName.charAt(0)}.`,
    vulnerabilitiesCount: scan.vulnerabilitiesCount,
    priorities: scan.priorities.map((p) => ({
      level: p.level,
      count: p.count,
    })),
    status: scan.status,
  }));

  res.json({
    scans: formattedScans,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// @desc    Get scan by ID
// @route   GET /api/scans/:id
// @access  Private
const getScanById = asyncHandler(async (req, res) => {
  const scan = await Scan.findById(req.params.id).populate({
    path: 'checkedBy',
    select: 'firstName lastName',
  });

  if (!scan) {
    res.status(404);
    throw new Error('Scan not found');
  }

  const formattedScan = {
    id: scan._id,
    address: scan.address,
    status: scan.status === 'Успешно' ? 'Успешно' : scan.status,
    startTime: new Date(scan.startTime).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    endTime: scan.endTime
      ? new Date(scan.endTime).toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-',
    duration: scan.duration || '-',
    checkedBy: `${scan.checkedBy.firstName} ${scan.checkedBy.lastName.charAt(0)}.`,
    vulnerabilitiesCount: scan.vulnerabilitiesCount,
    stats: scan.stats,
  };

  res.json(formattedScan);
});

// @desc    Create new scan
// @route   POST /api/scans
// @access  Private
const createScan = asyncHandler(async (req, res) => {
  const { address } = req.body;

  if (!address) {
    res.status(400);
    throw new Error('Address is required');
  }

  // Create scan
  const scan = await Scan.create({
    address,
    checkedBy: req.user._id,
  });

  // Start scan in background
  executeScan(scan._id, address);

  res.status(201).json({
    id: scan._id,
    address: scan.address,
    status: scan.status,
  });
});

// @desc    Delete scan
// @route   DELETE /api/scans/:id
// @access  Private
const deleteScan = asyncHandler(async (req, res) => {
  const scan = await Scan.findById(req.params.id);

  if (!scan) {
    res.status(404);
    throw new Error('Scan not found');
  }

  // Delete related vulnerabilities
  await Vulnerability.deleteMany({ scan: scan._id });

  // Delete scan
  await scan.deleteOne();

  res.json({ message: 'Scan removed' });
});

// @desc    Rescan
// @route   POST /api/scans/:id/rescan
// @access  Private
const rescanById = asyncHandler(async (req, res) => {
  const scan = await Scan.findById(req.params.id);

  if (!scan) {
    res.status(404);
    throw new Error('Scan not found');
  }

  // Delete related vulnerabilities
  await Vulnerability.deleteMany({ scan: scan._id });

  // Update scan status
  scan.status = 'Идет анализ';
  scan.vulnerabilitiesCount = 0;
  scan.priorities = [];
  scan.stats = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  scan.startTime = Date.now();
  scan.endTime = null;
  scan.duration = null;

  await scan.save();

  // Start scan in background
  executeScan(scan._id, scan.address);

  res.json({
    id: scan._id,
    address: scan.address,
    status: scan.status,
  });
});

// @desc    Get vulnerabilities by scan ID
// @route   GET /api/scans/:id/vulnerabilities
// @access  Private
const getVulnerabilitiesByScanId = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const scan = await Scan.findById(req.params.id);

  if (!scan) {
    res.status(404);
    throw new Error('Scan not found');
  }

  const total = await Vulnerability.countDocuments({ scan: req.params.id });

  const vulnerabilities = await Vulnerability.find({ scan: req.params.id })
    .sort({ priority: 1, name: 1 })
    .skip(skip)
    .limit(limit);

  const formattedVulnerabilities = vulnerabilities.map((vulnerability) => ({
    id: vulnerability._id,
    name: vulnerability.name,
    priority: vulnerability.priority,
    family: vulnerability.family,
    count: vulnerability.count,
    details: vulnerability.details,
  }));

  res.json({
    vulnerabilities: formattedVulnerabilities,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

module.exports = {
  getScans,
  getScanById,
  createScan,
  deleteScan,
  rescanById,
  getVulnerabilitiesByScanId,
};