// 1. Import Packages
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session'); 
const methodOverride = require('method-override');


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

// ======================
// Run schema.sql on startup
// ======================
const fs = require('fs');
const SCHEMA_PATH = path.join(__dirname, 'db', 'schema.sql');

try {
  const ddl = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(ddl, (err) => {
    if (err) console.error('Error applying schema.sql:', err.message);
    else console.log('DB schema ensured from schema.sql');
  });
} catch (e) {
  console.error('Could not load schema.sql:', e.message);
}


// 4. Set up middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());                                   //API bodies
app.use(express.static(path.join(__dirname, 'public'), { index: false }));
app.use(methodOverride('_method'));

// User Sessions
app.use(session({
  secret: 'cityshare-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}));


// ======================
//      R O U T E S
// ======================

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

// User Profile
app.get('/profile', (req, res) => {
  const p = path.join(__dirname, 'public', 'profile.html');
  console.log('GET /profile ->', p);
  res.sendFile(p);
});


// ======================
//    P O S T 
// ======================
// Login POST
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';

  db.get(sql, [email], (err, user) => {
    if (err) return res.send('<h1>Error</h1><p>Please try again.</p>');
    if (!user) return res.send('<h1>Login Failed</h1><p>Incorrect email or password. <a href="/login">Try again</a>.</p>');

    bcrypt.compare(password, user.password, (err, ok) => {
      if (!ok) return res.send('<h1>Login Failed</h1><p>Incorrect email or password. <a href="/login">Try again</a>.</p>');
      // save who is logged in
      req.session.userId = user.id;
      return res.redirect('/profile');
    });
  });
});

// LogOUt!
app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});


//  Register 
app.post('/register', (req, res) => {
  const { first_name, last_name, username, email, location, address, dob, is_student, password } = req.body;
  const hashed = bcrypt.hashSync(password, 10);
  const studentFlag = is_student ? 1 : 0;   // checkbox returns undefined if not checked

  const sqlUser = `INSERT INTO users (email, password) VALUES (?, ?)`;
  db.run(sqlUser, [email, hashed], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.send('<h1>Email already exists.</h1><a href="/signup">Try again</a>');
      }
      console.error(err.message);
      return res.send('<h1>Server error. Please try again later.</h1>');
    }

    const userId = this.lastID;
    const displayName = `${first_name} ${last_name}`.trim() || email.split('@')[0];

    const sqlProfile = `
      INSERT INTO profiles (
        user_id, display_name, username, location, address_line1, dob, is_student, avatar_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
    `;

    db.run(sqlProfile, [userId, displayName, username, location, address, dob, studentFlag], (profileErr) => {
      if (profileErr) {
        console.error(profileErr);
        return res.send('<h1>Error creating profile.</h1>');
      }

      res.send(`<h1>Account created successfully!</h1><a href="/login">Log In</a>`);
    });
  });
});

// Listings
// body: { item_name, description?, image_url?, category?, type, condition?, price_cents?, status?, usage_status?, images?: [url,url,...] }
app.post('/listings', (req, res) => {
  const uid = req.session?.userId;
  if (!uid) return res.status(401).json({ error: 'Not logged in' });

  const {
    item_name, description, image_url,
    category,                // NAME (e.g., "tools")
    type,                    // 'sell' | 'donate' | 'borrow'
    condition,
    price_cents,
    status = 'active',       // 'active','paused','deleted','closed','sold'
    usage_status = 'available', //  'available','reserved','borrowed'
    images = []              // extra image URLs
  } = req.body;

  if (!item_name || !type) {
    return res.status(400).json({ error: 'item_name and type are required' });
  }
  if (!['sell','donate','borrow'].includes(type)) {
    return res.status(400).json({ error: 'bad_type' });
  }

  db.serialize(() => {
    // Ensure category exists if provided
    if (category) {
      db.run(`INSERT OR IGNORE INTO categories (name) VALUES (?)`, [category]);
    }

    const getCat = category ? `SELECT id FROM categories WHERE name = ?` : null;

    const insertListing = (category_id) => {
      const sql = `
        INSERT INTO listings
          (item_name, description, image_url, category_id, type, condition,
           price_cents, status, usage_status, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        item_name, description || null, image_url || null, category_id || null,
        type, condition || null, price_cents ?? null, status, usage_status, uid
      ];

      db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: 'db_error', detail: err.message });

        const listingId = this.lastID;

        // Insert extra images if provided
        if (!images || images.length === 0) {
          return res.status(201).json({ id: listingId });
        }
        const stmt = db.prepare(`INSERT INTO listing_images (listing_id, url) VALUES (?, ?)`);
        images.forEach(u => stmt.run([listingId, u || '']));
        stmt.finalize((e2) => {
          if (e2) return res.status(500).json({ error: 'db_error', detail: e2.message });
          res.status(201).json({ id: listingId });
        });
      });
    };

    if (!getCat) return insertListing(null);
    db.get(getCat, [category], (e, row) => insertListing(row?.id || null));
  });
});

// POST /listings/:id/images  body: { url }
app.post('/listings/:id/images', (req, res) => {
  const uid = req.session?.userId;
  if (!uid) return res.status(401).json({ error: 'Not logged in' });

  const id = Number(req.params.id);
  const { url } = req.body;
  if (!Number.isFinite(id) || !url) return res.status(400).json({ error: 'bad_input' });

  db.get(`SELECT user_id FROM listings WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'db_error' });
    if (!row) return res.status(404).json({ error: 'not_found' });
    if (row.user_id !== uid) return res.status(403).json({ error: 'forbidden' });

    db.run(`INSERT INTO listing_images (listing_id, url) VALUES (?, ?)`, [id, url], function (e2) {
      if (e2) return res.status(500).json({ error: 'db_error' });
      res.status(201).json({ image_id: this.lastID });
    });
  });
});

// DELETE /listings/:id/images/:imageId
app.delete('/listings/:id/images/:imageId', (req, res) => {
  const uid = req.session?.userId;
  if (!uid) return res.status(401).json({ error: 'Not logged in' });

  const id = Number(req.params.id);
  const imageId = Number(req.params.imageId);
  if (!Number.isFinite(id) || !Number.isFinite(imageId)) return res.status(400).json({ error: 'bad_id' });

  db.get(`SELECT user_id FROM listings WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'db_error' });
    if (!row) return res.status(404).json({ error: 'not_found' });
    if (row.user_id !== uid) return res.status(403).json({ error: 'forbidden' });

    db.run(`DELETE FROM listing_images WHERE id = ? AND listing_id = ?`, [imageId, id], (e2) => {
      if (e2) return res.status(500).json({ error: 'db_error' });
      res.json({ ok: true });
    });
  });
});

// ======================
//      P U T
// ======================
// PUT /listings/:id
app.put('/listings/:id', (req, res) => {
  const uid = req.session?.userId;
  if (!uid) return res.status(401).json({ error: 'Not logged in' });

  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'bad_id' });

  const { item_name, description, image_url, category, type, condition, price_cents, status, usage_status } = req.body;

  db.get(`SELECT user_id FROM listings WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'db_error' });
    if (!row) return res.status(404).json({ error: 'not_found' });
    if (row.user_id !== uid) return res.status(403).json({ error: 'forbidden' });

    db.serialize(() => {
      if (category) db.run(`INSERT OR IGNORE INTO categories (name) VALUES (?)`, [category]);

      const getCat = category ? `SELECT id FROM categories WHERE name = ?` : null;

      const doUpdate = (category_id) => {
        const sql = `
          UPDATE listings
          SET item_name = COALESCE(?, item_name),
              description = COALESCE(?, description),
              image_url = COALESCE(?, image_url),
              category_id = COALESCE(?, category_id),
              type = COALESCE(?, type),
              condition = COALESCE(?, condition),
              price_cents = COALESCE(?, price_cents),
              status = COALESCE(?, status),
              usage_status = COALESCE(?, usage_status)
          WHERE id = ?
        `;
        db.run(sql, [
          item_name ?? null, description ?? null, image_url ?? null,
          category_id ?? null, type ?? null, condition ?? null,
          (price_cents ?? null), status ?? null, usage_status ?? null,
          id
        ], (e2) => {
          if (e2) return res.status(500).json({ error: 'db_error' });
          res.json({ ok: true });
        });
      };

      if (!getCat) return doUpdate(null);
      db.get(getCat, [category], (e, r) => doUpdate(r?.id || null));
    });
  });
});


// ======================
//      G E T 
// ======================
// Listings
app.get('/api/listings', (req, res) => {
  const {
    q,
    type,                  // 'sell' | 'donate' | 'borrow'
    category,              // category NAME, e.g., 'tools'
    usage,                 // 'available' | 'reserved' | 'borrowed'
    status,                // 'active' | 'paused' | 'deleted' | 'closed' | 'sold'
    limit = 12,
    offset = 0
  } = req.query;

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
    // filter by category NAME from categories table
    where += ' AND LOWER(c.name) = LOWER(?)';
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
      l.id,
      l.listing_number,
      l.item_name,
      l.description,
      l.image_url,
      l.type,
      l.condition,
      l.price_cents,
      l.usage_status,
      l.status,
      COALESCE(c.name, 'other') AS category,
      l.created_at
    FROM listings l
    LEFT JOIN categories c ON c.id = l.category_id
    ${where}
    ORDER BY datetime(l.created_at) DESC
    LIMIT ? OFFSET ?
  `;

  params.push(Number(limit), Number(offset));

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('listings query error:', err.message);
      return res.status(500).json({ error: 'db_error' });
    }
    res.json(rows || []);
  });
});


// Listings. Gated
app.get('/listings/:id', (req, res) => {
  res.redirect('/?login=required');
});

// GET /api/listings/:id  -> listing + images[]
app.get('/api/listings/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'bad_id' });

  const sqlListing = `
    SELECT l.id, l.listing_number, l.item_name, l.description, l.image_url,
           l.type, l.condition, l.price_cents, l.status, l.usage_status,
           COALESCE(c.name, 'other') AS category, l.created_at, l.user_id
    FROM listings l
    LEFT JOIN categories c ON c.id = l.category_id
    WHERE l.id = ?
  `;
  const sqlImages = `SELECT id, url, created_at FROM listing_images WHERE listing_id = ? ORDER BY id`;

  db.get(sqlListing, [id], (err, listing) => {
    if (err) return res.status(500).json({ error: 'db_error' });
    if (!listing) return res.status(404).json({ error: 'not_found' });

    db.all(sqlImages, [id], (err2, images) => {
      if (err2) return res.status(500).json({ error: 'db_error' });
      res.json({ ...listing, images });
    });
  });
});

// Current user info
app.get('/api/me', (req, res) => {
  const uid = req.session?.userId;
  if (!uid) return res.status(401).json({ error: 'Not logged in' });

  const sql = `
    SELECT u.email,
           p.display_name, p.username, p.location, p.avatar_url, p.is_student, p.dob
    FROM users u
    JOIN profiles p ON p.user_id = u.id
    WHERE u.id = ?
  `;
  db.get(sql, [uid], (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'DB error' });
    res.json({
      user: { email: row.email },
      profile: {
        display_name: row.display_name,
        username: row.username,
        location: row.location,
        avatar_url: row.avatar_url,
        is_student: row.is_student,
        dob: row.dob
      }
    });
  });
});

// User Listings for profile and more
app.get('/api/my-items', (req, res) => {
  const uid = req.session?.userId;
  if (!uid) return res.status(401).json({ error: 'Not logged in' });

  const sql = `
    SELECT
      l.id,
      l.listing_number,
      l.item_name,
      l.description,
      l.image_url,
      l.type,
      l.condition,
      l.price_cents,
      l.usage_status,
      l.status,
      COALESCE(c.name, 'other') AS category,
      l.created_at
    FROM listings l
    LEFT JOIN categories c ON c.id = l.category_id
    WHERE l.user_id = ?
    ORDER BY datetime(l.created_at) DESC
  `;

  db.all(sql, [uid], (err, rows) => {
    if (err) {
      console.error('my-items query error:', err.message);
      return res.status(500).json({ error: 'db_error' });
    }

    res.json(rows || []);
  });
});

// ======================
// 404 fallback to error page
// ======================
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'error.html'));
});


// ======================
// 6. Start the server
// ======================
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

