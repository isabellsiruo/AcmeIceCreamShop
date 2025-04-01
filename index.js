//import pg module to connect to PostgreSQL
const pg = require('pg');

//import express to create API server
const express = require('express');

//import morgan for logging incoming requests
const morgan = require('morgan');

//create PostgreSQL client + connect to local database
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_ice_cream_db');

//create instance of Express application
const app = express();

//tell Express to automatically parse incoming JSON (for POST + PUT requests)
app.use(express.json());

//log every request to console using morgan in 'dev' format
app.use(morgan('dev'));

//Routes - REST API

//GET /api/flavors - return all flavors
app.get('/api/flavors', async (req, res, next) => {
  try {
    const SQL = 'SELECT * FROM flavors ORDER BY created_at DESC';
    const response = await client.query(SQL);
    //send array of flavors
    res.send(response.rows); 
  } catch (err) {
    next(err);
  }
});

//GET /api/flavors/:id - return one flavor by ID
app.get('/api/flavors/:id', async (req, res, next) => {
  try {
    const SQL = 'SELECT * FROM flavors WHERE id = $1';
    const response = await client.query(SQL, [req.params.id]);
    //send single flavor (undefined if not found)
    res.send(response.rows[0]); 
  } catch (err) {
    next(err);
  }
});

//POST /api/flavors - add new flavor
app.post('/api/flavors', async (req, res, next) => {
  try {
    const SQL = `
      INSERT INTO flavors(name, is_favorite)
      VALUES($1, $2)
      RETURNING *;
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
    ]);
    //201 created + return new flavor
    res.status(201).send(response.rows[0]); 
  } catch (err) {
    next(err);
  }
});

//PUT /api/flavors/:id - update existing flavor
app.put('/api/flavors/:id', async (req, res, next) => {
  try {
    const SQL = `
      UPDATE flavors
      SET name = $1,
          is_favorite = $2,
          updated_at = now()
      WHERE id = $3
      RETURNING *;
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
      req.params.id,
    ]);
    //return updated flavor
    res.send(response.rows[0]); 
  } catch (err) {
    next(err);
  }
});

//DELETE /api/flavors/:id - delete flavor by ID
app.delete('/api/flavors/:id', async (req, res, next) => {
  try {
    const SQL = 'DELETE FROM flavors WHERE id = $1';
    await client.query(SQL, [req.params.id]);
    //204 No Content (success, but no response body)
    res.sendStatus(204); 
  } catch (err) {
    next(err);
  }
});

// init function

const init = async () => {
  //connect to PostgreSQL database
  await client.connect();
  console.log('Connected to the database');

  //step 1: drop table if already exists
  let SQL = `
    DROP TABLE IF EXISTS flavors;

    -- Step 2: create flavors table
    CREATE TABLE flavors (
      id SERIAL PRIMARY KEY,                -- auto-incrementing ID
      name VARCHAR(100) NOT NULL,           -- name of the flavor (string, required)
      is_favorite BOOLEAN DEFAULT false,    -- boolean flag for favorite, default false
      created_at TIMESTAMP DEFAULT now(),   -- timestamp of when the row was created
      updated_at TIMESTAMP DEFAULT now()    -- timestamp of last update
    );
  `;
  await client.query(SQL);
  console.log('Flavors table created');

  //step 3: seed table with initial data
  SQL = `
    INSERT INTO flavors (name, is_favorite) VALUES ('Vanilla', true);
    INSERT INTO flavors (name, is_favorite) VALUES ('Chocolate', false);
    INSERT INTO flavors (name, is_favorite) VALUES ('Strawberry', true);
  `;
  await client.query(SQL);
  console.log('Flavors table seeded with initial data');

  //step 4: start server after database setup
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server listening on port ${port}`));
};

//call init function to start
init();

