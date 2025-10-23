// 1. Import Packages
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// 2. Initialize the Express app
const app = express();
const port = 3000;

// 3. Connect to the database
const db = new sqlite3.Database('./cityshare.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the cityshare.db database.');
});

// 4. Set up middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


// 5. Define Routes

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ?';

  db.get(sql, [email], (err, user) => {
    if (err) {
      console.error(err.message);
      return res.send('<h1>Error</h1><p>Something went wrong. Please try again.</p>');
    }

    if (!user) {
      console.log(`Login failed: No user found with email ${email}`);
      return res.send('<h1>Login Failed</h1><p>Incorrect email or password. <a href="/">Try again</a>.</p>');
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (result === true) {
        // Passwords match!
        console.log(`Login successful for user: ${email}`);
        res.send('<h1>Login Successful!</h1><p>Welcome to CityShare!</p>');
      } else {
        // Passwords do NOT match
        console.log(`Login failed: Incorrect password for user ${email}`);
        res.send('<h1>Login Failed</h1><p>Incorrect email or password. <a href="/">Try again</a>.</p>');
      }
    });
  });
});


// 6. Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);

});
