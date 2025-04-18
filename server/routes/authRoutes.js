const express = require('express');
const router = express.Router();
const { loginUser, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

router.post('/login', loginUser);
router.get('/me', protect, getUserProfile);

// Debug route to check user data and generate tokens directly
router.get('/debug/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
      expiresIn: '30d',
    });
    
    res.json({
      message: 'Debug info',
      userExists: true,
      passwordStored: user.password,
      passwordIsHashed: user.password.startsWith('$2a$'),
      token: token,
      user: {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
