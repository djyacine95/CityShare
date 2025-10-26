// init-db.js
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Paths
const dbFile = './cityshare.db';
const schemaFile = './db/schema.sql'; //DB Schema File

//  Connect or create DB
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error(' Error opening database:', err.message);
  } else {
    console.log('Connected to the cityshare.db database.');
    initializeDatabase();
  }
});

// Function to initialize the DB schema and seed data
function initializeDatabase() {
  // Read SQL schema file
  let schema;
  try {
    schema = fs.readFileSync(schemaFile, 'utf8');
  } catch (err) {
    console.error(' Could not read schema.sql file:', err.message);
    db.close();
    return;
  }

  // Apply schema
  db.exec(schema, (err) => {
    if (err) {
      console.error(' Error applying schema:', err.message);
      db.close();
      return;
    }
    console.log(' Database schema applied successfully.');

    seedTestData();
  });
}

// Function to seed a sample user
function seedTestData() {
  const testEmail = 'yacine.djeddi@gmail.com';
  const testPassword = 'cityshare';
  const hashedPassword = bcrypt.hashSync(testPassword, 10);

  const insertSQL = `INSERT INTO users (email, password) VALUES (?, ?)`;

  db.run(insertSQL, [testEmail, hashedPassword], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        console.log(`Test user (${testEmail}) already exists.`);
      } else {
        console.error('Error inserting test user:', err.message);
      }
    } else {
      console.log(`Test user created with ID: ${this.lastID}`);
    }

    db.close((err) => {
      if (err) console.error(' Error closing database:', err.message);
      else console.log('Closed the database connection.');
    });
  });
}
