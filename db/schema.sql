-- Enable foreign keys in SQLite
PRAGMA foreign_keys = ON;

-- Users: auth only
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL  -- bcrypt hash
);

-- Profiles: 1:1 with users
CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY,
  display_name TEXT NOT NULL,
  bio TEXT,
  location TEXT,              --  "San Jose, CA"
  avatar_url TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Listings: items posted by users
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER,        -- NULL for free/borrow
  condition TEXT,             -- 'new','good','fair'
  type TEXT NOT NULL CHECK (type IN ('sell','donate','borrow')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','hidden','closed','sold')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Optional images
CREATE TABLE IF NOT EXISTS listing_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

-- Tags + many-to-many join
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL   -- 'clothing','furniture','free','sell','borrow','tools', etc.
);

CREATE TABLE IF NOT EXISTS listing_tags (
  listing_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (listing_id, tag_id),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Favorites (wishlist)
CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER NOT NULL,
  listing_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, listing_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

-- Simple messages between users
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  listing_id INTEGER,
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
);

-- Helpful indices
CREATE INDEX IF NOT EXISTS idx_listings_user ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listing_tags_tag ON listing_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(to_user_id, created_at DESC);
