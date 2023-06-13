import { Database } from 'sqlite-async';

class DatabaseConnection {
  constructor() {
    this.dbInstance = null;
  }

  async initialize() {
    if (!this.dbInstance) {
      this.dbInstance = await Database.open('test.db');

      await this.createTables();
    }

    return this.dbInstance;
  }

  async createTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL
      );
    `;
    const createExercisesTable = `
      CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        description TEXT NOT NULL,
        date TEXT NOT NULL
      );
    `;

    await this.dbInstance.exec(`${createUsersTable} ${createExercisesTable}`);
  }
}

const dbConnection = new DatabaseConnection();

export default dbConnection;
