-- schema.sql
-- WARNING: This is a destructive initialization script. Running it will drop existing tables and reset all data.
PRAGMA foreign_keys = OFF;

-- Drop old tables if they exist
DROP TABLE IF EXISTS Transaction_Item;
DROP TABLE IF EXISTS "Transaction";

-- Drop new tables in correct dependency order (children first)
DROP TABLE IF EXISTS session;
DROP TABLE IF EXISTS otp_verification;
DROP TABLE IF EXISTS order_item;
DROP TABLE IF EXISTS product_price;
DROP TABLE IF EXISTS event_member;
DROP TABLE IF EXISTS shop_member;
DROP TABLE IF EXISTS "order";
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS event;
DROP TABLE IF EXISTS "user";
DROP TABLE IF EXISTS shop;

CREATE TABLE shop (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE "user" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    is_verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE shop_member (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner', 'employee')),
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    UNIQUE(shop_id, user_id)
);

CREATE TABLE event (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    start_date TEXT NOT NULL, -- Format: YYYY-MM-DD
    end_date TEXT NOT NULL,   -- Format: YYYY-MM-DD
    booth_rental REAL DEFAULT 0,
    travel REAL DEFAULT 0,
    accommodation REAL DEFAULT 0,
    food_allowance REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE
);

CREATE TABLE event_member (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('event_creator', 'shop_owner', 'employee')),
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    UNIQUE(event_id, user_id)
);

CREATE TABLE category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE,
    UNIQUE(shop_id, name)
);

CREATE TABLE product (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id INTEGER NOT NULL,
    category_id INTEGER,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_product_shop ON product(shop_id);

CREATE TABLE product_price (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    currency_code TEXT NOT NULL CHECK(length(currency_code) = 3), -- บังคับรหัส 3 ตัวอักษรตาม ISO
    price REAL NOT NULL,                                         -- เก็บเป็นทศนิยมใน SQLite หรือใช้ INTEGER หากเก็บเป็นสตางค์
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    UNIQUE(product_id, currency_code)
);

CREATE INDEX IF NOT EXISTS idx_product_price_currency ON product_price(currency_code);

CREATE TABLE IF NOT EXISTS "order" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    currency_code TEXT NOT NULL,         -- เก็บว่าใช้ราคาของประเทศไหน เช่น 'THB', 'SGD'
    total_income REAL NOT NULL,          -- รวมยอดเงินของออร์เดอร์นี้
    total_product_sold INTEGER NOT NULL, -- รวมจำนวนชิ้นที่ขายได้ในออร์เดอร์นี้
    event_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_per_unit REAL NOT NULL,        -- ล็อกราคา ณ วันที่ขายไว้
    FOREIGN KEY (order_id) REFERENCES "order"(id),
    FOREIGN KEY (product_id) REFERENCES product(id)
);

CREATE INDEX IF NOT EXISTS idx_order_created_at ON "order"(created_at);
CREATE INDEX IF NOT EXISTS idx_order_item_order_id ON order_item(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_product_id ON order_item(product_id);

CREATE TABLE otp_verification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE session (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

PRAGMA foreign_keys = ON;
