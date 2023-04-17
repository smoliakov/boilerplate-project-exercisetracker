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

router.get('/:userId/logs', async (req, res) => {
  try {
    const db = await Database.open('test.db');
    const userId = parseInt(req.params.userId);

    // Get user object from the database
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all exercises associated with the user
    let logs = await db.all('SELECT * FROM exercises WHERE user_id = ?', [userId]);

    // Filter logs by date if necessary
    const { from, to } = req.query;
    if (from && to) {
      logs = logs.filter((exercise) => {
        const exerciseDate = new Date(exercise.date).getTime();
        return exerciseDate >= new Date(from).getTime() && exerciseDate <= new Date(to).getTime();
      });
    }

    const logCount = logs.length;
    const userExerciseLog = {
      ...user,
      count: logCount,
      log: logs,
    };

    return res.status(200).json(userExerciseLog);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


export default router;
