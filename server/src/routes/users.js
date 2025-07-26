const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateUserUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be user or admin'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', role, isActive } = req.query;

  // Build query
  const query = {};

  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (role) {
    query.role = role;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const users = await User.find(query)
    .select('-password')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  res.json({
    users,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    total
  });
}));

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (admin only or own profile)
 * @access  Private
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Users can only view their own profile unless they're admin
  if (req.user._id.toString() !== id && req.user.role !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ user });
}));

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (admin only or own profile)
 * @access  Private
 */
router.put('/:id', authenticate, validateUserUpdate, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const { id } = req.params;
  const { username, email, role, isActive } = req.body;

  // Users can only update their own profile unless they're admin
  if (req.user._id.toString() !== id && req.user.role !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  // Non-admins cannot change role or isActive
  if (req.user.role !== 'admin' && (role !== undefined || isActive !== undefined)) {
    throw new AppError('Access denied', 403);
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if username or email already exists
  if (username || email) {
    const existingUser = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(username ? [{ username }] : [])
      ],
      _id: { $ne: id }
    });

    if (existingUser) {
      throw new AppError('Username or email already exists', 400);
    }
  }

  // Update user
  const updates = {};
  if (username) updates.username = username;
  if (email) updates.email = email;
  if (role && req.user.role === 'admin') updates.role = role;
  if (isActive !== undefined && req.user.role === 'admin') updates.isActive = isActive;

  const updatedUser = await User.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  logger.info(`User updated: ${updatedUser.email} by ${req.user.email}`);

  res.json({
    message: 'User updated successfully',
    user: updatedUser
  });
}));

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (admin only)
 * @access  Private/Admin
 */
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (req.user._id.toString() === id) {
    throw new AppError('Cannot delete your own account', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if user has posts
  const postCount = await Post.countDocuments({ author: id });
  if (postCount > 0) {
    throw new AppError('Cannot delete user with existing posts', 400);
  }

  await User.findByIdAndDelete(id);

  logger.info(`User deleted: ${user.email} by ${req.user.email}`);

  res.json({
    message: 'User deleted successfully'
  });
}));

/**
 * @route   GET /api/users/:id/posts
 * @desc    Get posts by user
 * @access  Public
 */
router.get('/:id/posts', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10, status = 'published' } = req.query;

  // Verify user exists
  const user = await User.findById(id).select('username email');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Build query
  const query = { author: id };

  // Filter by status
  if (status && status !== 'all') {
    query.status = status;
  }

  const posts = await Post.find(query)
    .populate('category', 'name color')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await Post.countDocuments(query);

  res.json({
    posts,
    user,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    total
  });
}));

/**
 * @route   GET /api/users/:id/stats
 * @desc    Get user statistics (admin only or own stats)
 * @access  Private
 */
router.get('/:id/stats', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Users can only view their own stats unless they're admin
  if (req.user._id.toString() !== id && req.user.role !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get post statistics
  const [totalPosts, publishedPosts, draftPosts, totalViews, totalLikes] = await Promise.all([
    Post.countDocuments({ author: id }),
    Post.countDocuments({ author: id, status: 'published' }),
    Post.countDocuments({ author: id, status: 'draft' }),
    Post.aggregate([
      { $match: { author: user._id } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]),
    Post.aggregate([
      { $match: { author: user._id } },
      { $group: { _id: null, totalLikes: { $sum: { $size: '$likes' } } } }
    ])
  ]);

  const stats = {
    totalPosts,
    publishedPosts,
    draftPosts,
    totalViews: totalViews[0]?.totalViews || 0,
    totalLikes: totalLikes[0]?.totalLikes || 0,
    averageViews: totalPosts > 0 ? Math.round((totalViews[0]?.totalViews || 0) / totalPosts) : 0,
    averageLikes: totalPosts > 0 ? Math.round((totalLikes[0]?.totalLikes || 0) / totalPosts) : 0
  };

  res.json({
    user,
    stats
  });
}));

/**
 * @route   POST /api/users/:id/deactivate
 * @desc    Deactivate user (admin only)
 * @access  Private/Admin
 */
router.post('/:id/deactivate', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent admin from deactivating themselves
  if (req.user._id.toString() === id) {
    throw new AppError('Cannot deactivate your own account', 400);
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.isActive = false;
  await user.save();

  logger.info(`User deactivated: ${user.email} by ${req.user.email}`);

  res.json({
    message: 'User deactivated successfully'
  });
}));

/**
 * @route   POST /api/users/:id/activate
 * @desc    Activate user (admin only)
 * @access  Private/Admin
 */
router.post('/:id/activate', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.isActive = true;
  await user.save();

  logger.info(`User activated: ${user.email} by ${req.user.email}`);

  res.json({
    message: 'User activated successfully'
  });
}));

module.exports = router; 