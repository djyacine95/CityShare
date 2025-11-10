// init-db.js 
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'db', 'cityshare.db');
const SCHEMA_PATH = path.join(__dirname, 'db', 'schema.sql');

const db = new sqlite3.Database(
  DB_PATH,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) console.error('Error opening database:', err.message);
    else console.log('Connected to', DB_PATH);
  }
);

// tiny helpers
const run = (sql, params=[]) => new Promise((res, rej) => db.run(sql, params, function (e) { e ? rej(e) : res(this); }));
const get = (sql, params=[]) => new Promise((res, rej) => db.get(sql, params, (e, r) => e ? rej(e) : res(r)));
const all = (sql, params=[]) => new Promise((res, rej) => db.all(sql, params, (e, r) => e ? rej(e) : res(r)));
const exec = (sql) => new Promise((res, rej) => db.exec(sql, (e) => e ? rej(e) : res()));

(async function main() {
  try {
    await run('PRAGMA foreign_keys = ON;');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    await exec(schema);
    console.log('Schema applied.');

    // users
    const users = [
      { email: 'alice@example.com', password: 'password1' },
      { email: 'bob@example.com',   password: 'password2' },
      { email: 'mago@example.com',  password: 'mago' }
    ];
    const ustmt = db.prepare('INSERT OR IGNORE INTO users (email, password) VALUES (?, ?)');
    for (const u of users) ustmt.run([u.email, bcrypt.hashSync(u.password, 10)]);
    await new Promise((res, rej) => ustmt.finalize((e)=> e?rej(e):res()));
    const alice = (await get('SELECT id FROM users WHERE email=?', ['alice@example.com']))?.id;
    const bob   = (await get('SELECT id FROM users WHERE email=?', ['bob@example.com']))?.id;
    const mago  = (await get('SELECT id FROM users WHERE email=?', ['mago@example.com']))?.id;

    // categories 
    const cats = ['clothing','tools','furniture','electronics'];
    const cstmt = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
    cats.forEach(n => cstmt.run([n]));
    await new Promise((res, rej) => cstmt.finalize((e)=> e?rej(e):res()));
    const byName = {};
    for (const n of cats) byName[n] = (await get('SELECT id FROM categories WHERE name=?', [n]))?.id;

    // listings 
    const L = [
      {
        user_id: alice, item_name: 'IKEA Poäng Chair', description: 'Lightly used, pickup in SJ',
        image_url: '/images/chair1.jpg', category_id: byName['furniture'], type: 'sell', condition: 'good',
        price_cents: 3500, status: 'active'
      },
      {
        user_id: bob, item_name: 'Winter Jacket (M)', description: 'Free to a good home',
        image_url: '/images/jacket.jpg', category_id: byName['clothing'], type: 'donate', condition: 'fair',
        price_cents: null, status: 'active'
      },
      {
        user_id: mago, item_name: 'Cordless Drill', description: 'Borrow for weekend projects',
        image_url: '/images/drill.avif', category_id: byName['tools'], type: 'borrow', condition: 'good',
        price_cents: null, status: 'active'
      },
      {
        user_id: mago, item_name: 'Nintendo Switch + 2 controllers', description: 'Weekend party rental. Includes Mario Kart.',
        image_url: '/images/switch.jpg', category_id: byName['electronics'], type: 'borrow', condition: 'excellent',
        price_cents: null, status: 'active'
      }
    ].filter(x => x.user_id && x.category_id);

    const sql =
      `INSERT INTO listings
       (user_id, item_name, description, image_url, category_id, type, condition, price_cents, status)
       VALUES (?,?,?,?,?,?,?,?,?)`;
    const lst = db.prepare(sql);
    for (const r of L) {
      await new Promise((res, rej) =>
        lst.run(
          [r.user_id, r.item_name, r.description, r.image_url, r.category_id, r.type, r.condition, r.price_cents, r.status],
          (e) => e ? rej(e) : res()
        )
      );
    }
    await new Promise((res, rej) => lst.finalize((e)=> e?rej(e):res()));
    console.log(`Seeded ${L.length} listings.`);

    const count = (await get('SELECT COUNT(*) AS n FROM listings')).n;
    console.log('Total listings in DB:', count);
  } catch (e) {
    console.error('Init error:', e); // full error
  } finally {
    db.close(() => console.log('Closed DB.'));
  }
})();
