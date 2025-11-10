-- Enable foreign keys in SQLite
PRAGMA foreign_keys = ON;

-- USERS (auth)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,             -- bcrypt hash
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PROFILES (1:1 with users)
CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY,        -- same as users.id
  display_name TEXT NOT NULL,
  username TEXT UNIQUE,               -- optional: @handle
  bio TEXT,
  location TEXT,                      -- general location (“San Jose, CA”)
  
  -- Detailed address (I think we should have it just for security reasons)
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  region TEXT,                        -- state/province
  postal_code TEXT,
  country TEXT,                       -- e.g. "US"

  dob TEXT,                           -- YYYY-MM-DD (used for 18+ check)
  is_student INTEGER DEFAULT 0,       -- 0 = false, 1 = true 
  avatar_url TEXT,                    -- /uploads/avatars/filename.ext
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- CATEGORIES (normalized)
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL   -- e.g. clothing, tools, furniture, electronics, books, toys, etc.
);

-- LISTINGS
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- business fields
  item_name TEXT NOT NULL,                              -- short title/name of item
  listing_number TEXT UNIQUE,                           
  description TEXT,
  image_url TEXT,                                       -- optional primary image

  category_id INTEGER,                                  -- FK to categories
  type TEXT NOT NULL CHECK (type IN ('sell','donate','borrow')),
  condition TEXT,                                       -- 'new','like-new','good','fair','poor' (

  price_cents INTEGER,                                  -- NULL for donate/borrow

  -- lifecycle/status
  status TEXT NOT NULL DEFAULT 'active'
         CHECK (status IN ('active','paused','deleted','closed','sold')),

  -- availability/usage (borrow/loan scenarios)
  usage_status TEXT NOT NULL DEFAULT 'available'
         CHECK (usage_status IN ('available','reserved','borrowed')),
  borrowed_by_user_id INTEGER,                          -- who currently borrowed it
  borrowed_until DATETIME,                              -- optional due date

  -- audit
  user_id INTEGER NOT NULL,                             -- owner (who posted)
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (borrowed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- TRIGGER: keep updated_at fresh
CREATE TRIGGER IF NOT EXISTS trg_listings_updated_at
AFTER UPDATE ON listings
FOR EACH ROW BEGIN
  UPDATE listings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- TRIGGER: auto-generate listing_number after insert (L + zero-padded id)
CREATE TRIGGER IF NOT EXISTS trg_listings_number
AFTER INSERT ON listings
FOR EACH ROW WHEN NEW.listing_number IS NULL
BEGIN
  UPDATE listings
     SET listing_number = 'L' || printf('%08d', NEW.id)
   WHERE id = NEW.id;
END;

-- OPTIONAL: multiple images per listing
CREATE TABLE IF NOT EXISTS listing_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
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

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_listings_user        ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_category    ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_type        ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_status      ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_usage       ON listings(usage_status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at  ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(to_user_id, created_at DESC);
