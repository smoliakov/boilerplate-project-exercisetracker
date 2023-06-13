import express from 'express';
import { Database } from 'sqlite-async';

// create an instance of the express router
const router = express.Router();

// POST /api/users
router.post('/', async (req, res) => {
  try {
    console.log(req.body);
    // Extract username from form data
    const { username } = req.body;

    // Open database connection
    const db = await Database.open('test.db');

    // Insert new user into database
    const result = await db.run(`
      INSERT INTO users (username)
      VALUES (?)
    `, username);

    // Retrieve new user from database
    const user = await db.get('SELECT * FROM users WHERE id = ?', result.lastID);

    // Close database connection
    await db.close();

    // Send response with new user data
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create user.' });
  }
});

// GET /api/users
router.get('/', async (req, res) => {
  try {
    // Open a connection to the database
    const db = await Database.open('test.db');

    // Query the database for all users
    const users = await db.all('SELECT * FROM users');

    // Close the database connection
    await db.close();

    // Return the users as a JSON response
    res.json(users);
  } catch (error) {
    // Handle any errors that occur during user retrieval
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve users.' });
  }
});

// GET /api/users/:id
router.get('/:userId', async (req, res) => {
  try {
    // Extract the user ID from the request parameters
    const userId = parseInt(req.params.userId);

    // Open a connection to the database
    const db = await Database.open('test.db');

    // Query the database for the user with the specified ID
    const user = await db.get('SELECT * FROM users WHERE id = ?', userId);

    // Close the database connection
    await db.close();

    // If the user doesn't exist, return a 404 error
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Return the user as a JSON response
    res.json(user);
  } catch (error) {
    // Handle any errors that occur during user retrieval
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve user.' });
  }
});

// POST /api/users/:_id/exercises
router.post('/:userId/exercises', async (req, res) => {
  try {
    // get user ID from the request URL parameter
    const userId = parseInt(req.params.userId);

    // get exercise details from the request body
    const { description, duration, date } = req.body;

    // validate exercise details
    if (!description || !duration) {
      return res.status(400).json({ message: 'Description and duration are required.' });
    }

    // parse date or use current date if not provided
    const parsedDate = date ? new Date(date) : new Date();
    const formattedDate = parsedDate.toISOString().slice(0, 10);

    // open a connection to the database
    const db = await Database.open('test.db');

    // create a new exercise record in the database
    const result = await db.run(`
      INSERT INTO exercises (user_id, description, duration, date)
      VALUES (?, ?, ?, ?)
    `, userId, description, duration, formattedDate);

    // get the ID of the newly created exercise
    const exerciseId = result.lastID;

    // get the newly created exercise from the database
    const exercise = await db.get(`
      SELECT * FROM exercises
      WHERE id = ?
    `, exerciseId);

    // close the database connection
    await db.close();

    // create response object
    const response = {
      userId: exercise.user_id,
      exerciseId: exercise.id,
      duration: exercise.duration,
      description: exercise.description,
      date: exercise.date,
    };

    // send the response
    res.json(response);

  } catch (error) {
    // handle any errors that occur during exercise creation
    console.error(error);
    res.status(500).json({ message: 'Failed to create exercise.' });
  }
});

router.get('/:id/logs', async (req, res) => {
  try {
    const db = await Database.open('test.db');
    const userId = parseInt(req.params.id);

    // Get user object from the database
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Construct the SQL query for fetching the logs
    let query = 'SELECT id, duration, description, date FROM exercises WHERE user_id = ?';
    const queryParams = [userId];

    // Check for the optional query parameters
    const { from, to, limit } = req.query;

    // Check for the optional "from" parameter
    if (from) {
      query += ' AND date >= ?';
      queryParams.push(from);
    }

    // Check for the optional "to" parameter
    if (to) {
      query += ' AND date <= ?';
      queryParams.push(to);
    }

    // Add ordering by date
    query += ' ORDER BY date DESC';

    // Limit the logs if necessary
    if (limit) {
      query += ' LIMIT ?';
      queryParams.push(parseInt(limit));
    }

    // Execute the SQL query to fetch the logs
    const logs = await db.all(query, queryParams);

    const logCount = logs.length;

    const userExerciseLog = {
      ...user,
      logs,
      count: logCount,
    };

    return res.status(200).json(userExerciseLog);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


export default router;
