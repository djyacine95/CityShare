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
app.use(express.static(path.join(__dirname, 'public')));

// 5. Define Routes

// Home -> public/index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//  serve the signup page file directly
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Login
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

// (Optional) 404 fallback to error page
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'error.html'));
});

// 6. Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

