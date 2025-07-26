const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const Category = require('../models/Category');
const { authenticate, optionalAuth, requireOwner } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validatePost = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  body('category')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean')
];

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 */
router.post('/', authenticate, validatePost, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const { title, content, category, status = 'draft', tags = [], featured = false } = req.body;

  // Verify category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new AppError('Category not found', 404);
  }

  // Generate slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');

  // Check if slug already exists
  const existingPost = await Post.findOne({ slug });
  if (existingPost) {
    throw new AppError('A post with this title already exists', 400);
  }

  // Create post
  const post = new Post({
    title,
    content,
    author: req.user._id,
    category,
    slug,
    status,
    tags,
    featured
  });

  await post.save();

  // Populate author and category
  await post.populate('author', 'username email');
  await post.populate('category', 'name');

  logger.info(`New post created: ${title} by ${req.user.email}`);

  res.status(201).json({
    message: 'Post created successfully',
    post
  });
}));

/**
 * @route   GET /api/posts
 * @desc    Get all posts with filtering and pagination
 * @access  Public
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    author,
    status = 'published',
    search = '',
    featured,
    sort = '-createdAt'
  } = req.query;

  // Build query
  const query = {};

  // Filter by status (only show published posts to non-authenticated users)
  if (req.user && req.user.role === 'admin') {
    // Admins can see all posts
    if (status && status !== 'all') {
      query.status = status;
    }
  } else {
    // Non-admins can only see published posts
    query.status = 'published';
  }

  // Filter by category
  if (category) {
    query.category = category;
  }

  // Filter by author
  if (author) {
    query.author = author;
  }

  // Filter by featured
  if (featured !== undefined) {
    query.featured = featured === 'true';
  }

  // Search functionality
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Execute query
  const posts = await Post.find(query)
    .populate('author', 'username email')
    .populate('category', 'name color')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort(sort);

  const total = await Post.countDocuments(query);

  res.json({
    posts,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    total,
    hasNext: page * limit < total,
    hasPrev: page > 1
  });
}));

/**
 * @route   GET /api/posts/:id
 * @desc    Get a single post by ID
 * @access  Public
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await Post.findById(id)
    .populate('author', 'username email')
    .populate('category', 'name color')
    .populate('comments.user', 'username email');

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // Check if user can view this post
  if (post.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
    throw new AppError('Post not found', 404);
  }

  // Increment views if user is not the author
  if (!req.user || req.user._id.toString() !== post.author._id.toString()) {
    await post.incrementViews();
  }

  res.json({ post });
}));

/**
 * @route   GET /api/posts/slug/:slug
 * @desc    Get a single post by slug
 * @access  Public
 */
router.get('/slug/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const post = await Post.findOne({ slug })
    .populate('author', 'username email')
    .populate('category', 'name color')
    .populate('comments.user', 'username email');

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // Check if user can view this post
  if (post.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
    throw new AppError('Post not found', 404);
  }

  // Increment views if user is not the author
  if (!req.user || req.user._id.toString() !== post.author._id.toString()) {
    await post.incrementViews();
  }

  res.json({ post });
}));

/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post
 * @access  Private (Owner or Admin)
 */
router.put('/:id', authenticate, validatePost, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const { id } = req.params;
  const { title, content, category, status, tags, featured } = req.body;

  const post = await Post.findById(id);
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // Check if user can update this post
  if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  // Verify category exists if provided
  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      throw new AppError('Category not found', 404);
    }
  }

  // Generate new slug if title changed
  let slug = post.slug;
  if (title && title !== post.title) {
    slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Check if new slug already exists
    const existingPost = await Post.findOne({ slug, _id: { $ne: id } });
    if (existingPost) {
      throw new AppError('A post with this title already exists', 400);
    }
  }

  // Update post
  const updatedPost = await Post.findByIdAndUpdate(
    id,
    {
      title,
      content,
      category,
      slug,
      status,
      tags,
      featured
    },
    { new: true, runValidators: true }
  )
    .populate('author', 'username email')
    .populate('category', 'name color');

  logger.info(`Post updated: ${title} by ${req.user.email}`);

  res.json({
    message: 'Post updated successfully',
    post: updatedPost
  });
}));

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post
 * @access  Private (Owner or Admin)
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await Post.findById(id);
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // Check if user can delete this post
  if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  await Post.findByIdAndDelete(id);

  logger.info(`Post deleted: ${post.title} by ${req.user.email}`);

  res.json({
    message: 'Post deleted successfully'
  });
}));

/**
 * @route   POST /api/posts/:id/like
 * @desc    Like/unlike a post
 * @access  Private
 */
router.post('/:id/like', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await Post.findById(id);
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // Check if user can view this post
  if (post.status !== 'published' && req.user.role !== 'admin') {
    throw new AppError('Post not found', 404);
  }

  const userId = req.user._id;
  const hasLiked = post.likes.includes(userId);

  if (hasLiked) {
    await post.removeLike(userId);
    logger.info(`Post unliked: ${post.title} by ${req.user.email}`);
  } else {
    await post.addLike(userId);
    logger.info(`Post liked: ${post.title} by ${req.user.email}`);
  }

  res.json({
    message: hasLiked ? 'Post unliked' : 'Post liked',
    liked: !hasLiked,
    likeCount: post.likes.length
  });
}));

/**
 * @route   POST /api/posts/:id/comments
 * @desc    Add a comment to a post
 * @access  Private
 */
router.post('/:id/comments', authenticate, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400);
  }

  const { id } = req.params;
  const { content } = req.body;

  const post = await Post.findById(id);
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // Check if user can comment on this post
  if (post.status !== 'published' && req.user.role !== 'admin') {
    throw new AppError('Post not found', 404);
  }

  await post.addComment(req.user._id, content);

  // Populate the new comment
  await post.populate('comments.user', 'username email');

  logger.info(`Comment added to post: ${post.title} by ${req.user.email}`);

  res.json({
    message: 'Comment added successfully',
    comment: post.comments[post.comments.length - 1]
  });
}));

module.exports = router; 