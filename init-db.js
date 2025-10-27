// init-db.js
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Paths
const DB_PATH = path.join(__dirname, 'db', 'cityshare.db');
const SCHEMA_PATH = path.join(__dirname, 'db', 'schema.sql');

// Open (create if missing)
const db = new sqlite3.Database(
  DB_PATH,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) console.error('Error opening database:', err.message);
    else console.log('Connected to cityshare.db');
  }
);

// ---- tiny promise helpers ----
const run = (sql, params=[]) =>
  new Promise((resolve, reject) => db.run(sql, params, function (err) {
    if (err) reject(err); else resolve(this);
  }));
const get = (sql, params=[]) =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row) => {
    if (err) reject(err); else resolve(row);
  }));
const all = (sql, params=[]) =>
  new Promise((resolve, reject) => db.all(sql, params, (err, rows) => {
    if (err) reject(err); else resolve(rows);
  }));

(async function main() {
  try {
    // 1) Apply schema
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    await run('PRAGMA foreign_keys = ON;');
    await new Promise((res, rej) => db.exec(schema, (e) => e ? rej(e) : res()));
    console.log('Database schema applied successfully.');

    // 2) Seed users (safe to re-run)
    const seedUsers = [
      { email: 'alice@example.com',        password: 'password1' },
      { email: 'bob@example.com',          password: 'password2' },
      { email: 'mago@example.com',         password: 'mago'      },
      { email: 'yacine.djeddi@gmail.com',  password: 'cityshare' }
    ];
    const userStmt = await new Promise((res) =>
      res(db.prepare('INSERT OR IGNORE INTO users (email, password) VALUES (?, ?)'))
    );
    for (const u of seedUsers) {
      const hash = bcrypt.hashSync(u.password, 10);
      await new Promise((res, rej) => userStmt.run([u.email, hash], (e)=> e?rej(e):res()));
    }
    await new Promise((res, rej) => userStmt.finalize((e)=> e?rej(e):res()));
    console.log('Seeded users:', seedUsers.map(u=>u.email).join(', '));

    // 3) Seed categories
    const categories = ['clothing','tools','furniture','electronics','books','toys','kitchen','sports','kids','other'];
    for (const name of categories) {
      await run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [name]);
    }
    const getCatId = (name) => get('SELECT id FROM categories WHERE name = ?', [name]).then(r=>r?.id);

    // helpers
    const getUserId = (email) => get('SELECT id FROM users WHERE email = ?', [email]).then(r=>r?.id);

    const aliceId = await getUserId('alice@example.com');
    const bobId   = await getUserId('bob@example.com');
    const magoId  = await getUserId('mago@example.com');

    const furn  = await getCatId('furniture');
    const cloth = await getCatId('clothing');
    const tools = await getCatId('tools');

    // 4) Seed listings
    const listings = [
      {
        user_id: aliceId, item_name: 'IKEA Poäng Chair', description: 'Lightly used, pickup in SJ',
        image_url: '/images/chair1.jpg', category_id: furn, type: 'sell', condition: 'good',
        price_cents: 3500, status: 'active', usage_status: 'available', borrowed_by_user_id: null
      },
      {
        user_id: bobId, item_name: 'Winter Jacket (M)', description: 'Free to a good home',
        image_url: '/images/jacket.jpg', category_id: cloth, type: 'donate', condition: 'fair',
        price_cents: null, status: 'active', usage_status: 'available', borrowed_by_user_id: null
      },
      {
        user_id: magoId, item_name: 'Cordless Drill', description: 'Borrow for weekend projects',
        image_url: '/images/drill.avif', category_id: tools, type: 'borrow', condition: 'good',
        price_cents: null, status: 'active', usage_status: 'borrowed', borrowed_by_user_id: bobId
      }
    ].filter(x => x.user_id);

    const listStmt = await new Promise((res) =>
      res(db.prepare(
        `INSERT OR IGNORE INTO listings
         (user_id, item_name, description, image_url, category_id, type, condition,
          price_cents, status, usage_status, borrowed_by_user_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`
      ))
    );
    for (const l of listings) {
      await new Promise((res, rej) =>
        listStmt.run(
          [l.user_id, l.item_name, l.description, l.image_url, l.category_id, l.type, l.condition,
           l.price_cents, l.status, l.usage_status, l.borrowed_by_user_id],
          (e)=> e?rej(e):res()
        )
      );
    }
    await new Promise((res, rej) => listStmt.finalize((e)=> e?rej(e):res()));
    console.log('Seeded listings:', listings.map(l=>l.item_name).join(', '));

    console.log('Seeding complete.');
  } catch (e) {
    console.error('Init error:', e.message);
  } finally {
    db.close(() => console.log('Closed the database connection.'));
  }
})();
