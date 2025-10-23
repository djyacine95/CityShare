const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./cityshare.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the cityshare.db database.');
});

//hash the password 'cityshare' before storing it
const testPassword = 'cityshare';
const salt = bcrypt.genSaltSync(10);
const hashedPassword = bcrypt.hashSync(testPassword, salt);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`, (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Created 'users' table.");
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
