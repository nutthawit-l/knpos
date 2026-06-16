-- schema.sql
-- WARNING: This is a destructive initialization script. Running it will drop existing tables and reset all data.
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS Transaction_Item;
DROP TABLE IF EXISTS sale_item;
DROP TABLE IF EXISTS order_item;
DROP TABLE IF EXISTS product_price;
DROP TABLE IF EXISTS "Transaction";
DROP TABLE IF EXISTS sale;
DROP TABLE IF EXISTS "order";
DROP TABLE IF EXISTS product;

CREATE TABLE product (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE product_price (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    currency_code TEXT NOT NULL CHECK(length(currency_code) = 3), -- บังคับรหัส 3 ตัวอักษรตาม ISO
    price REAL NOT NULL,                                         -- เก็บเป็นทศนิยมใน SQLite หรือใช้ INTEGER หากเก็บเป็นสตางค์
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    
    -- ลิงก์กลับไปที่ตารางสินค้า ถ้าลบสินค้า ให้ลบราคาตามไปด้วย (CASCADE)
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    
    -- ข้อนี้สำคัญมาก: ห้ามไม่ให้สินค้า 1 ชิ้น มีราคาของสกุลเงินเดิมซ้ำซ้อน (เช่น เสื้อยืดมีราคา THB ได้แค่แถวเดียว)
    UNIQUE(product_id, currency_code)
);

CREATE INDEX IF NOT EXISTS idx_product_price_currency ON product_price(currency_code);

CREATE TABLE IF NOT EXISTS "order" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    currency_code TEXT NOT NULL,         -- เก็บว่าใช้ราคาของประเทศไหน เช่น 'THB', 'SGD'
    total_income REAL NOT NULL,          -- รวมยอดเงินของออร์เดอร์นี้
    total_product_sold INTEGER NOT NULL, -- รวมจำนวนชิ้นที่ขายได้ในออร์เดอร์นี้
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
