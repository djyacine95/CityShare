// init-db.js
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Paths
const dbFile = path.join(__dirname, 'db', 'cityshare.db');
const schemaFile = path.join(__dirname, 'db', 'schema.sql');

// Connect or create DB
const db = new sqlite3.Database(
  dbFile,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to the cityshare.db database.');
      initializeDatabase();
    }
  }
);

// Apply schema then seed
function initializeDatabase() {
  let schema;
  try {
    schema = fs.readFileSync(schemaFile, 'utf8');
  } catch (err) {
    console.error('Could not read schema.sql:', err.message);
    return db.close();
  }

  db.exec(schema, (err) => {
    if (err) {
      console.error('Error applying schema:', err.message);
      return db.close();
    }
    console.log('Database schema applied successfully.');
    seedTestData();
  });
}

// Seed users (safe to re-run)
function seedTestData() {
  const users = [
    { email: 'yacine.djeddi@gmail.com', password: 'cityshare' },
    { email: 'mago@example.com',        password: 'mago' }   // 
  ];

  db.serialize(() => {
    const stmt = db.prepare('INSERT OR IGNORE INTO users (email, password) VALUES (?, ?)');
    for (const u of users) {
      const hash = bcrypt.hashSync(u.password, 10);
      stmt.run([u.email, hash]);
    }
    stmt.finalize((err) => {
      if (err) {
        console.error('Seeding error:', err.message);
      } else {
        console.log('Seeded users:', users.map(u => u.email).join(', '));
      }
      db.close((err) => {
        if (err) console.error('Error closing DB:', err.message);
        else console.log('Closed the database connection.');
      });
    });
  });
}
