// 1. Import Packages
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');



// 2. Initialize the Express app
const app = express();
const port = 3000;

const DB_PATH = path.join(__dirname, 'db', 'cityshare.db');
console.log('Using DB at:', DB_PATH);

const db = new sqlite3.Database(
  DB_PATH,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, // create if missing
  (err) => {
    if (err) {
      console.error('DB open error:', err.message);
    } else {
      console.log('Connected to the cityshare.db database.');
    }
  }
);

// 4. Set up middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { index: false }));


// 5. Define Routes

// Home -> dashboard
app.get('/', (req, res) => {
  const p = path.join(__dirname, 'public', 'dashboard.html');
  console.log('GET /  ->', p);
  res.sendFile(p);
});

// Explicit dashboard route
app.get('/dashboard', (req, res) => {
  const p = path.join(__dirname, 'public', 'dashboard.html');
  console.log('GET /dashboard ->', p);
  res.sendFile(p);
});


// Login page (GET)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Signup page
app.get('/signup', (req, res) => {
  const p = path.join(__dirname, 'public', 'signUp.html');
  console.log('GET /signup ->', p);
  res.sendFile(p);
});


// Login POST
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';

  db.get(sql, [email], (err, user) => {
    if (err) return res.send('<h1>Error</h1><p>Please try again.</p>');
    if (!user) return res.send('<h1>Login Failed</h1><p>Incorrect email or password. <a href="/">Try again</a>.</p>');

    bcrypt.compare(password, user.password, (err, ok) => {
      if (ok) res.send('<h1>Login Successful!</h1><p>Welcome to CityShare!</p>');
      else res.send('<h1>Login Failed</h1><p>Incorrect email or password. <a href="/">Try again</a>.</p>');
    });
  });
});


//  Register 
app.post('/register', (req, res) => {
  const { first_name, last_name, email, address, is_student, password } = req.body;
  const hashed = bcrypt.hashSync(password, 10);

  // For now we only store auth in users; later add a profiles table
  const sql = `INSERT INTO users (email, password) VALUES (?, ?)`;

  db.run(sql, [email, hashed], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.send('<h1>Email already exists.</h1><a href="/signup.html">Try again</a>');
      }
      console.error(err.message);
      return res.send('<h1>Server error. Please try again later.</h1>');
    }
    console.log(`New user registered: ${email}`);
    res.send(`<h1>Welcome, ${first_name || 'CitySharer'}!</h1><a href="/">Go to login</a>`);
  });
});



// Public API: listings
app.get('/api/listings', (req, res) => {
  const { q, type, category, usage, status, limit = 12 } = req.query;
  const params = [];
  let where = 'WHERE 1=1';

  if (q) {
    where += ' AND (l.item_name LIKE ? OR l.description LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (type && ['sell','donate','borrow'].includes(type)) {
    where += ' AND l.type = ?';
    params.push(type);
  }
  if (category) {
    where += ' AND c.name = ?';
    params.push(category);
  }
  if (usage && ['available','reserved','borrowed'].includes(usage)) {
    where += ' AND l.usage_status = ?';
    params.push(usage);
  }
  if (status && ['active','paused','deleted','closed','sold'].includes(status)) {
    where += ' AND l.status = ?';
    params.push(status);
  }

  const sql = `
    SELECT
      l.id, l.listing_number, l.item_name, l.description, l.image_url,
      l.type, l.condition, l.price_cents, l.usage_status, l.status,
      COALESCE(c.name, 'other') AS category, l.created_at
    FROM listings l
    LEFT JOIN categories c ON c.id = l.category_id
    ${where}
    ORDER BY datetime(l.created_at) DESC
    LIMIT ?
  `;
  params.push(Number(limit));

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'db_error' });
    res.json(rows);
  });
});

// (still gated for now)
app.get('/listings/:id', (req, res) => {
  res.redirect('/?login=required');
});

// (Optional) 404 fallback to error page
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'error.html'));
});

// 6. Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

