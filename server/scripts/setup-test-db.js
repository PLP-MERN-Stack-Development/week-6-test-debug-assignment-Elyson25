// server/scripts/setup-test-db.js - Test database setup script

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Post = require('../src/models/Post');
const { generateToken } = require('../src/utils/auth');

const setupTestDatabase = async () => {
  try {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/mern-testing-test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to test database');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Post.deleteMany({});

    console.log('Cleared existing test data');

    // Create test categories
    const categories = await Category.insertMany([
      {
        name: 'Technology',
        description: 'Technology related posts',
        slug: 'technology',
        color: '#007bff'
      },
      {
        name: 'Sports',
        description: 'Sports related posts',
        slug: 'sports',
        color: '#28a745'
      },
      {
        name: 'Politics',
        description: 'Politics related posts',
        slug: 'politics',
        color: '#dc3545'
      },
      {
        name: 'Entertainment',
        description: 'Entertainment related posts',
        slug: 'entertainment',
        color: '#ffc107'
      }
    ]);

    console.log('Created test categories');

    // Create test users
    const users = await User.insertMany([
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'AdminPass123!',
        role: 'admin'
      },
      {
        username: 'user1',
        email: 'user1@example.com',
        password: 'UserPass123!',
        role: 'user'
      },
      {
        username: 'user2',
        email: 'user2@example.com',
        password: 'UserPass123!',
        role: 'user'
      },
      {
        username: 'moderator',
        email: 'moderator@example.com',
        password: 'ModPass123!',
        role: 'admin'
      }
    ]);

    console.log('Created test users');

    // Create test posts
    const posts = await Post.insertMany([
      {
        title: 'Getting Started with React',
        content: 'React is a popular JavaScript library for building user interfaces. In this post, we will explore the basics of React and how to get started with it.',
        author: users[1]._id,
        category: categories[0]._id,
        slug: 'getting-started-with-react',
        status: 'published',
        tags: ['react', 'javascript', 'frontend'],
        featured: true
      },
      {
        title: 'The Future of Web Development',
        content: 'Web development is constantly evolving. Let\'s explore the latest trends and technologies that are shaping the future of web development.',
        author: users[1]._id,
        category: categories[0]._id,
        slug: 'future-of-web-development',
        status: 'published',
        tags: ['web-development', 'trends', 'technology']
      },
      {
        title: 'Best Practices for API Design',
        content: 'Designing good APIs is crucial for the success of any application. Here are some best practices to follow when designing REST APIs.',
        author: users[2]._id,
        category: categories[0]._id,
        slug: 'api-design-best-practices',
        status: 'published',
        tags: ['api', 'design', 'best-practices']
      },
      {
        title: 'Understanding Authentication',
        content: 'Authentication is a critical aspect of web security. Learn about different authentication methods and how to implement them securely.',
        author: users[2]._id,
        category: categories[0]._id,
        slug: 'understanding-authentication',
        status: 'published',
        tags: ['authentication', 'security', 'web']
      },
      {
        title: 'The Rise of Electric Vehicles',
        content: 'Electric vehicles are becoming increasingly popular as we move towards a more sustainable future. Let\'s explore the benefits and challenges.',
        author: users[1]._id,
        category: categories[1]._id,
        slug: 'rise-of-electric-vehicles',
        status: 'published',
        tags: ['electric-vehicles', 'sustainability', 'technology']
      },
      {
        title: 'Draft Post - Not Published',
        content: 'This is a draft post that should not be visible to regular users.',
        author: users[1]._id,
        category: categories[0]._id,
        slug: 'draft-post',
        status: 'draft',
        tags: ['draft', 'testing']
      }
    ]);

    console.log('Created test posts');

    // Generate tokens for testing
    const adminToken = generateToken(users[0]);
    const userToken = generateToken(users[1]);

    console.log('\n=== Test Database Setup Complete ===');
    console.log('\nTest Users:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Role: ${user.role}`);
    });

    console.log('\nTest Categories:');
    categories.forEach(category => {
      console.log(`- ${category.name} (${category.slug})`);
    });

    console.log('\nTest Posts:');
    posts.forEach(post => {
      console.log(`- ${post.title} (${post.status})`);
    });

    console.log('\nSample Tokens:');
    console.log(`Admin Token: ${adminToken}`);
    console.log(`User Token: ${userToken}`);

    console.log('\nTest Database URL:', mongoUri);
    console.log('\nYou can now run your tests!');

    await mongoose.disconnect();
    console.log('\nDisconnected from test database');

  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupTestDatabase();
}

module.exports = setupTestDatabase; 