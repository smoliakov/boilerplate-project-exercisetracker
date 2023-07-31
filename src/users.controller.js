import express from 'express';
import { Database } from 'sqlite-async';

import { userSchema, exerciseSchema, logsQuerySchema, userIdSchema } from './schemas.js';

const router = express.Router();

const dbFile = 'test.db';

async function openDatabase() {
  return await Database.open(dbFile);
}

// POST /api/users
router.post('/', async (req, res) => {
  const db = await openDatabase();

  try {
    const { error } = userSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { username } = req.body;

    const searchResult = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (searchResult) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const result = await db.run('INSERT INTO users (username) VALUES (?)', [username]);
    const user = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create user.' });
  } finally {
    await db.close();
  }
});

// GET /api/users
router.get('/', async (req, res) => {
  const db = await openDatabase();

  try {
    const users = await db.all('SELECT * FROM users ORDER BY id ASC');

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve users.' });
  } finally {
    await db.close();
  }
});

// GET /api/users/:userId
router.get('/:userId', async (req, res) => {
  const db = await openDatabase();

  try {
    // Validate userId
    const { error: userIdValidationError, value: userId } = userIdSchema.validate(req.params.userId);
    if (userIdValidationError) {
      return res.status(400).json({ message: userIdValidationError.details[0].message });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve user.' });
  } finally {
    await db.close();
  }
});

// POST /api/users/:userId/exercises
router.post('/:userId/exercises', async (req, res) => {
  const db = await openDatabase();

  try {
    // Validate userId
    const { error: userIdValidationError, value: userId } = userIdSchema.validate(req.params.userId);
    if (userIdValidationError) {
      return res.status(400).json({ message: userIdValidationError.details[0].message });
    }

    // Validate exercise
    const { error } = exerciseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { description, duration, date } = req.body;

    const parsedDate = date ? new Date(date) : new Date();
    const formattedDate = parsedDate.toISOString().slice(0, 10);

    const result = await db.run(
      'INSERT INTO exercises (user_id, description, duration, date) VALUES (?, ?, ?, ?)',
      [userId, description, duration, formattedDate],
    );
    const exerciseId = result.lastID;
    const exercise = await db.get('SELECT * FROM exercises WHERE id = ?', [exerciseId]);

    const response = {
      userId: exercise.user_id,
      exerciseId: exercise.id,
      duration: exercise.duration,
      description: exercise.description,
      date: exercise.date,
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create exercise.' });
  } finally {
    await db.close();
  }
});

// GET /api/users/:userId/logs
router.get('/:userId/logs', async (req, res) => {
  const db = await openDatabase();

  try {
    // Validate userId
    const { error: userIdValidationError, value: userId } = userIdSchema.validate(req.params.userId);
    if (userIdValidationError) {
      return res.status(400).json({ message: userIdValidationError.details[0].message });
    }

    // Validate query params
    const { error: validationError } = logsQuerySchema.validate(req.query);
    if (validationError) {
      return res.status(400).json({ message: validationError.details[0].message });
    }

    // Get user from DB
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get records count
    let countQuery = 'SELECT COUNT(*) FROM exercises WHERE user_id = ?';
    const countResult = await db.get(countQuery, [userId]);

    // Get logs from DB
    let query = 'SELECT id, duration, description, date FROM exercises WHERE user_id = ?';
    const queryParams = [userId];

    const { from, to, limit } = req.query;

    if (from) {
      query += ' AND date >= ?';
      queryParams.push(from);
    }

    if (to) {
      query += ' AND date <= ?';
      queryParams.push(to);
    }

    query += ' ORDER BY date ASC';

    if (limit) {
      query += ' LIMIT ?';
      queryParams.push(limit);
    }

    const logs = await db.all(query, queryParams);

    const userExerciseLog = {
      ...user,
      logs,
      count: countResult['COUNT(*)'],
    };

    res.status(200).json(userExerciseLog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await db.close();
  }
});

export default router;
