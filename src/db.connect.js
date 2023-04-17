import { Database } from 'sqlite-async';

class DatabaseConnection {
  constructor() {
    this.dbInstance = null;
  }

  async initialize() {
    if (!this.dbInstance) {
      this.dbInstance = await Database.open('test.db');

      // create a 'users' table if it doesn't already exist
      await this.dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE
        );
        CREATE TABLE IF NOT EXISTS exercises (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          duration INTEGER NOT NULL,
          description TEXT NOT NULL,
          date TEXT NOT NULL
        );
      `);
    }

    return this.dbInstance;
  }
}

const dbConnection = new DatabaseConnection();

export default dbConnection;
