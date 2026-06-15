-- schema.sql
-- WARNING: This is a destructive initialization script. Running it will drop existing tables and reset all data.
DROP TABLE IF EXISTS Transaction_Item;
DROP TABLE IF EXISTS "Transaction";
DROP TABLE IF EXISTS Product;
CREATE TABLE Product (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    tha_price REAL NOT NULL,
    sgp_price REAL,
    idn_price REAL,
    deu_price REAL,
    jpn_price REAL,
    chn_price REAL,
    twn_price REAL,
    kor_price REAL,
    image_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Transaction" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    currency_code TEXT NOT NULL,         -- เก็บว่าใช้ราคาของประเทศไหน เช่น 'THB', 'SGD'
    total_income REAL NOT NULL,          -- รวมยอดเงินของออร์เดอร์นี้
    total_product_sold INTEGER NOT NULL, -- รวมจำนวนชิ้นที่ขายได้ในออร์เดอร์นี้
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Transaction_Item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_per_unit REAL NOT NULL,        -- ล็อกราคา ณ วันที่ขายไว้
    FOREIGN KEY (transaction_id) REFERENCES "Transaction"(id),
    FOREIGN KEY (product_id) REFERENCES Product(id)
);

CREATE INDEX IF NOT EXISTS idx_transaction_created_at ON "Transaction"(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_item_transaction_id ON Transaction_Item(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_item_product_id ON Transaction_Item(product_id);
