const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const authenticateToken = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
dotenv.config();

const DEFAULT_USER_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'password123';

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// Helper function to connect to MongoDB using credentials from JWT
async function connectToMongoDB(req) {
  const { mongodbUrl, mongodbUser, mongodbPassword } = req;

  const url = `mongodb://${encodeURIComponent(mongodbUser)}:${encodeURIComponent(mongodbPassword)}@${mongodbUrl}/`;
  const client = new MongoClient(url);

  await client.connect();
  return client;
}


/**
 * GET /admin/databases
 * Lists all databases 
 */
router.get('/databases', async (req, res) => {
  try {
    let client = await connectToMongoDB(req);
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    res.status(200).json({ databases: dbs.databases });
  } catch (error) {
    console.error('Error fetching databases:', error);
    res.status(500).json({ message: 'Failed to fetch databases.' });
  }
});

/**
 * GET /admin/users
 * Lists all users across all databases
 */
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const client = await connectToMongoDB(req);

    const database = client.db('admin');

    // 'system.users' koleksiyonunu seçin
    const usersCollection = database.collection('system.users');

    // Kullanıcıları sorgulayın
    const usersCursor = usersCollection.find({}, { projection: { _id: 1, roles: 1, user: 1 } });

    // Sonuçları diziye dönüştürün
    const users = await usersCursor.toArray();

    res.status(200).json({ users: users });
  } catch (error) {
    console.error('Error fetching users', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

/**
 * GET /admin/getUser/:user
 * Get user by username
 */
router.get('/getUser/:user', authenticateToken, async (req, res) => {
  try {
    const client = await connectToMongoDB(req);
    const database = client.db('admin');
    const usersCollection = database.collection('system.users');
    const user = await usersCollection.findOne({ _id: req.params.user }, { projection: { _id: 1, roles: 1, user: 1 } });
    res.status(200).json({ user: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});



// Create Database and Assign to User
router.post('/create-database', async (req, res) => {
  const { dbName } = req.body;

  // Validate input
  if (!dbName) {
    return res.status(400).json({ message: 'dbName is required.' });
  }

  let client;

  try {
    // Connect to MongoDB using credentials from JWT
    client = await connectToMongoDB(req);

    // 2. Check if the database already exists
    const databases = await client.db().admin().listDatabases();
    const dbExists = databases.databases.some(db => db.name === dbName);

    if (dbExists) {
      return res.status(400).json({ message: `Database '${dbName}' already exists.` });
    }

    // 3. Create the database by creating an initial collection
    const db = client.db(dbName);
    await db.createCollection('initialCollection'); // This implicitly creates the database

    res.status(201).json({ message: `Database '${dbName}' created successfully.` });
  } catch (error) {
    console.error('Error creating database:', error);
    res.status(500).json({ message: `Failed to create database: ${error.message}` });
  } finally {
    if (client) {
      await client.close();
    }
  }
});


// Create User
router.post(
  '/create-user',
  [
    body('username')
      .isAlphanumeric()
      .withMessage('Username must be alphanumeric.')
      .trim()
      .escape(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long.')
      .trim()
      .escape(),
    body('roles')
      .isArray({ min: 1 })
      .withMessage('At least one role must be assigned.')
      .custom((roles) => {
        // Validate that each role has 'role' and 'db' properties
        return roles.every(role => role.role && role.db);
      })
      .withMessage('Each role must have a role name and associated database.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, roles } = req.body;

    try {
      let client = await connectToMongoDB(req);

      // Predefined database
      const targetDbName = 'admin'; // You can set this via environment variables if preferred 

      // Access the target database
      const db = client.db(targetDbName);

      // Validate roles against allowed roles
      const allowedRoles = ['readWrite', 'dbAdmin', 'userAdmin']; // Define allowed roles
      const invalidRoles = roles.filter(role => !allowedRoles.includes(role.role));

      if (invalidRoles.length > 0) {
        return res.status(400).json({
          message: `Invalid roles detected: ${invalidRoles.map(r => r.role).join(', ')}`,
        });
      }

      // Create the user with the provided roles
      await db.command({
        createUser: username,
        pwd: password,
        roles: roles,
      });

      res
        .status(201)
        .json({ message: `User '${username}' created successfully in database '${targetDbName}'.` });
    } catch (error) {
      console.error('Error creating user:', error);

      // Handle duplicate user error (MongoDB error code 11000)
      if (error.code === 11000) {
        return res.status(409).json({ message: 'Username already exists.' });
      }

      res.status(500).json({ message: 'Failed to create user.' });
    }
  }
);

// Change Password
router.post('/change-password', async (req, res) => {


  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
    return res.status(400).json({ message: 'Username and newPassword are required.' });
  }

  let client;

  try {
    client = await connectToMongoDB(req);
    const adminDb = client.db('admin');

    // 1. Check if the user exists in the admin database
    const users = await adminDb.command({ usersInfo: { user: username, db: 'admin' } });
    const userExists = users.users && users.users.length > 0;

    if (!userExists) {
      return res.status(400).json({ message: `User '${username}' does not exist in the admin database.` });
    }

    await adminDb.command({
      updateUser: username,
      pwd: newPassword,
    });

    res.status(200).json({ message: `Password for user '${username}' has been changed successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// Delete User
router.post('/delete-user', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: ' username is required.' });
  }

  let client;

  try {
    client = await connectToMongoDB(req);
    const adminDb = client.db('admin');

    // 1. Check if the user exists in the admin database
    const users = await adminDb.command({ usersInfo: { user: username, db: 'admin' } });
    const userExists = users.users && users.users.length > 0;

    if (!userExists) {
      return res.status(400).json({ message: `User '${username}' does not exist in the admin database.` });
    }

    await adminDb.removeUser(username);
    res.status(200).json({ message: `User '${username}' has been deleted from database admin.users.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// Edit Roles
// PUT /admin/edit-roles
router.put('/edit-roles', async (req, res) => {
  const { username, roles } = req.body;

  // Check if username and roles are provided
  if (!username || !roles) {
    return res.status(400).json({ message: 'Username and roles are required.' });
  }

  // Check if roles array is empty
  if (!Array.isArray(roles) || roles.length === 0) {
    return res.status(400).json({ message: 'Roles cannot be empty.' });
  }

  let client;

  try {

    
    client = await connectToMongoDB(req);
    const database = client.db('admin');
    const usersCollection = database.collection('system.users');

    // Fetch the user and their roles
    const user = await usersCollection.findOne(
      { user: username },
      { projection: { _id: 1, roles: 1, user: 1 } }
    );

    if (!user) {
      return res.status(404).json({ message: `User '${username}' does not exist in the admin database.` });
    }

    // Check if the user has the root role
    const hasRootRole = user.roles.some(role => role.role === 'root' && role.db === 'admin');
    if (hasRootRole) {
      return res.status(403).json({ message: 'Cannot edit roles for a user with root privileges.' });
    }

    // Update the user's roles
    await database.command({
      updateUser: username,
      roles: roles.map(role => ({
        role: role.role,
        db: role.db,
      })),
    });

    res.status(200).json({ message: `Roles for user '${username}' have been updated successfully.` });


    res.status(200).json({ message: `Roles for user '${username}' have been updated successfully.` });
  } catch (error) {
    console.error('Error updating roles:', error);
    res.status(500).json({ message: error.message || 'An error occurred while updating roles.' });
  } finally {
    if (client) {
      await client.close();
    }
  }
});




module.exports = router;
