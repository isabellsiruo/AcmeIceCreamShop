// Import the pg module to connect to PostgreSQL
const pg = require('pg');

// Import express to create our API server
const express = require('express');

// Import morgan for logging incoming requests
const morgan = require('morgan');

// Create a PostgreSQL client and connect to the local database
// If we ever deploy this, we'll replace the hardcoded string with an environment variable
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_ice_cream_db');

// Create an instance of an Express application
const app = express();

// Tell Express to automatically parse incoming JSON (for POST and PUT requests)
app.use(express.json());

// Log every request to the console using morgan in 'dev' format
app.use(morgan('dev'));

// ---------------------------
//ROUTES - REST API
// ---------------------------

// GET /api/flavors - Return all flavors
app.get('/api/flavors', async (req, res, next) => {
  try {
    const SQL = 'SELECT * FROM flavors ORDER BY created_at DESC';
    const response = await client.query(SQL);
    res.send(response.rows); // Send the array of flavors
  } catch (err) {
    next(err);
  }
});

// GET /api/flavors/:id - Return one flavor by ID
app.get('/api/flavors/:id', async (req, res, next) => {
  try {
    const SQL = 'SELECT * FROM flavors WHERE id = $1';
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows[0]); // Send the single flavor (or undefined if not found)
  } catch (err) {
    next(err);
  }
});

// POST /api/flavors - Add a new flavor
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
    res.status(201).send(response.rows[0]); // 201 Created + return the new flavor
  } catch (err) {
    next(err);
  }
});

// PUT /api/flavors/:id - Update an existing flavor
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
    res.send(response.rows[0]); // Return the updated flavor
  } catch (err) {
    next(err);
  }
});

// DELETE /api/flavors/:id - Delete a flavor by ID
app.delete('/api/flavors/:id', async (req, res, next) => {
  try {
    const SQL = 'DELETE FROM flavors WHERE id = $1';
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204); // 204 No Content (success, but no response body)
  } catch (err) {
    next(err);
  }
});

// ---------------------------
// INIT FUNCTION
// ---------------------------

const init = async () => {
  // Connect to the PostgreSQL database
  await client.connect();
  console.log('Connected to the database');

  // Step 1: Drop the table if it already exists
  let SQL = `
    DROP TABLE IF EXISTS flavors;

    -- Step 2: Create the flavors table
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

  // Step 3: Seed the table with initial data
  SQL = `
    INSERT INTO flavors (name, is_favorite) VALUES ('Vanilla', true);
    INSERT INTO flavors (name, is_favorite) VALUES ('Chocolate', false);
    INSERT INTO flavors (name, is_favorite) VALUES ('Strawberry', true);
  `;
  await client.query(SQL);
  console.log('Flavors table seeded with initial data');

  // Step 4: Start the server after DB setup
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server listening on port ${port}`));
};

// Call the init function to kick things off
init();

