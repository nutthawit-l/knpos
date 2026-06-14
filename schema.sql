-- schema.sql
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
