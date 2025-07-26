const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Simple in-memory posts storage for testing
const posts = [];

// Create a new post
router.post('/', [
  body('title').isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('content').isLength({ min: 10 }).withMessage('Content must be at least 10 characters')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content } = req.body;

    const post = {
      id: Date.now().toString(),
      title,
      content,
      author: 'testuser',
      createdAt: new Date()
    };

    posts.push(post);

    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get all posts
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

// Get a single post
router.get('/:id', (req, res) => {
  try {
    const post = posts.find(p => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to get post' });
  }
});

module.exports = router; 