const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// This will create a file named 'cityshare.db' in your folder
const db = new sqlite3.Database('./cityshare.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the cityshare.db database.');
});

// --- HASH OUR TEST PASSWORD ---
// We hash the password 'cityshare' before storing it
const testPassword = 'cityshare';
const salt = bcrypt.genSaltSync(10);
const hashedPassword = bcrypt.hashSync(testPassword, salt);

// --- RUN SQL COMMANDS ---
// db.serialize() ensures commands run one after the other
db.serialize(() => {
  // 1. Create the 'users' table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`, (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Created 'users' table.");

    // 2. Insert our test user (using the hashed password)
    // We use a placeholder (?) to safely insert data
    const sql = `INSERT INTO users (email, password) VALUES (?, ?)`;

    db.run(sql, ['yacine.djeddi@gmail.com', hashedPassword], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          console.log('Test user (yacine.djeddi@gmail.com) already exists.');
        } else {
          return console.error(err.message);
        }
      } else {
        console.log(`A test user has been created with ID: ${this.lastID}`);
      }
      
      // 3. Close the database connection
      db.close((err) => {
        if (err) {
          console.error(err.message);
        }
        console.log('Closed the database connection.');
      });
    });
  });
});