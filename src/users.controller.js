import express from 'express';
import { Database } from 'sqlite-async';

const router = express.Router();

const dbFile = 'test.db';

async function openDatabase() {
  return await Database.open(dbFile);
}

// POST /api/users
router.post('/', async (req, res) => {
  try {
    const { username } = req.body;

    const db = await openDatabase();
    const result = await db.run('INSERT INTO users (username) VALUES (?)', username);
    const user = await db.get('SELECT * FROM users WHERE id = ?', result.lastID);
    await db.close();

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create user.' });
  }
});

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const db = await openDatabase();
    const users = await db.all('SELECT * FROM users');
    await db.close();

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve users.' });
  }
});

// GET /api/users/:id
router.get('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const db = await openDatabase();
    const user = await db.get('SELECT * FROM users WHERE id = ?', userId);
    await db.close();

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve user.' });
  }
});

// POST /api/users/:userId/exercises
router.post('/:userId/exercises', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { description, duration, date } = req.body;

    if (!description || !duration) {
      return res.status(400).json({ message: 'Description and duration are required.' });
    }

    const parsedDate = date ? new Date(date) : new Date();
    const formattedDate = parsedDate.toISOString().slice(0, 10);

    const db = await openDatabase();
    const result = await db.run(
      'INSERT INTO exercises (user_id, description, duration, date) VALUES (?, ?, ?, ?)',
      userId, description, duration, formattedDate
    );
    const exerciseId = result.lastID;
    const exercise = await db.get('SELECT * FROM exercises WHERE id = ?', exerciseId);
    await db.close();

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
  }
});

// GET /api/users/:id/logs
router.get('/:id/logs', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const db = await openDatabase();

    const user = await db.get('SELECT * FROM users WHERE id = ?', userId);
    if (!user) {
      await db.close();
      return res.status(404).json({ message: 'User not found' });
    }

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

    query += ' ORDER BY date DESC';

    if (limit) {
      query += ' LIMIT ?';
      queryParams.push(parseInt(limit));
    }

    const logs = await db.all(query, queryParams);
    const logCount = logs.length;

    const userExerciseLog = {
      ...user,
      logs,
      count: logCount,
    };

    await db.close();

    res.status(200).json(userExerciseLog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
