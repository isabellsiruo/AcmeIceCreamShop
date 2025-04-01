A backend-only project where I built a complete RESTful API with full CRUD functionality using Express.js and PostgreSQL

Summary:
-set up a PostgreSQL database named acme_ice_cream_db
-created a table called flavors with the following columns:
  -id, name (string), is_favorite (boolean), created_at, updated_at
-seeded the table with 3 flavors: Vanilla, Chocolate, Strawberry
-built the following RESTful API routes:
   -GET /api/flavors → Return all flavors
   -GET /api/flavors/:id → Return one flavor by ID
   -POST /api/flavors → Add a new flavor
   -PUT /api/flavors/:id → Update a flavor
   -DELETE /api/flavors/:id → Delete a flavor
-used morgan to log all HTTP requests
-used Postman to test each route
-used curl commands to verify functionality from the terminal
-GitHub repo structured cleanly with a .gitignore, package.json, and seed/setup logic
