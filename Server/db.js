   const { DatabaseSync } = require('node:sqlite');
   const path = require('path');

   const db = new DatabaseSync(path.join(__dirname, 'hotel.db'));
   db.exec('PRAGMA foreign_keys = ON');

   db.exec(`
   CREATE TABLE IF NOT EXISTS users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     username TEXT UNIQUE NOT NULL,
     password_hash TEXT NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('admin','waiter','receptionist'))
   );
   CREATE TABLE IF NOT EXISTS menu_items (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     category TEXT NOT NULL,
     price REAL NOT NULL CHECK (price >= 0)
   );
   CREATE TABLE IF NOT EXISTS orders (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     table_no TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','billed')),
     created_by INTEGER REFERENCES users(id),
     created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
   );
   CREATE TABLE IF NOT EXISTS order_items (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     price REAL NOT NULL,
     qty INTEGER NOT NULL CHECK (qty > 0)
   );
   CREATE TABLE IF NOT EXISTS rooms (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     number TEXT UNIQUE NOT NULL,
     type TEXT NOT NULL,
     price_per_night REAL NOT NULL CHECK (price_per_night >= 0)
   );
   CREATE TABLE IF NOT EXISTS bookings (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     room_id INTEGER NOT NULL REFERENCES rooms(id),
     guest_name TEXT NOT NULL,
     phone TEXT,
     check_in TEXT NOT NULL,
     check_out TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','billed'))
   );
   CREATE TABLE IF NOT EXISTS bills (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     type TEXT NOT NULL CHECK (type IN ('order','booking')),
     ref_id INTEGER NOT NULL,
     subtotal REAL NOT NULL,
     discount REAL NOT NULL DEFAULT 0,
     tax REAL NOT NULL,
     total REAL NOT NULL,
     payment_method TEXT NOT NULL,
     created_by INTEGER REFERENCES users(id),
     created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
   );
   `);

   // Sample menu items (only on first run)
   if (db.prepare('SELECT COUNT(*) AS c FROM menu_items').get().c === 0) {
     const addMenu = db.prepare('INSERT INTO menu_items (name, category, price) VALUES (?, ?, ?)');
     [
       ['Chicken Stew', 'Main', 650],
       ['Beef Pilau', 'Main', 550],
       ['Ugali Fish', 'Main', 700],
       ['Chips', 'Side', 250],
       ['Soda', 'Drinks', 100],
       ['Ugali Samaki', 'Main', 750],
       ['Ugali Omena', 'Side', 150],
       ['Fresh Juice', 'Drinks', 200],
       ['Tea', 'Drinks', 80],
       ['Fruit Salad', 'Dessert', 300]
     ].forEach(m => addMenu.run(m[0], m[1], m[2]));
   }

   // Sample rooms (only on first run)
   if (db.prepare('SELECT COUNT(*) AS c FROM rooms').get().c === 0) {
     const addRoom = db.prepare('INSERT INTO rooms (number, type, price_per_night) VALUES (?, ?, ?)');
     [
       ['101', 'Single', 3000],
       ['102', 'Double', 4500],
       ['201', 'Two Bedrooms', 7000]
     ].forEach(r => addRoom.run(r[0], r[1], r[2]));
   }

      const { hashPassword } = require('./password');

   
   if (db.prepare('SELECT COUNT(*) AS c FROM users').get().c === 0) {
     const addUser = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
     addUser.run('admin', hashPassword('otwoma6572'), 'admin');
     addUser.run('waiter', hashPassword('marvine6572'), 'waiter');
     addUser.run('reception', hashPassword('otwoma123'), 'receptionist');
     console.log('Default users created');
   }
   const menuCount = db.prepare('SELECT COUNT(*) AS c FROM menu_items').get().c;
   const roomCount = db.prepare('SELECT COUNT(*) AS c FROM rooms').get().c;
   console.log(`Database ready. Menu items: ${menuCount}, rooms: ${roomCount}`);

   module.exports = db;