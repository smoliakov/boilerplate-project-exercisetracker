import * as dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import * as path from 'path';

const app = express();

import cors from 'cors';

import dbConnection from './db.connect.js';
import users from './users.controller.js';

app.use(bodyParser.json());
app.use(cors());

app.use(express.static('./public'));
app.get('/', (req, res) => {
  res.sendFile(path.resolve('./views/index.html'));
});

// add users route
app.use('/api/users', users);

Promise.resolve()
  .then(async () => {
    // connect to DB
    await dbConnection.initialize();

    const listener = app.listen(process.env.PORT || 3000, () => {
      console.log('Your app is listening on port ' + listener.address().port);
    });
  });
