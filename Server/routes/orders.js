   const router = require('express').Router();
   const db = require('../db');
   const { auth } = require('../auth');

   router.get('/', auth('admin', 'waiter'), (req, res) => {
     const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
     const getItems = db.prepare('SELECT name, price, qty FROM order_items WHERE order_id = ?');
     const result = orders.map((o) => {
       const items = getItems.all(o.id);
       const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
       return { ...o, items, subtotal };
     });
     res.json(result);
   });

   router.post('/', auth('admin', 'waiter'), (req, res) => {
     const { table_no, items } = req.body;
     if (!table_no || !Array.isArray(items) || items.length === 0) {
       return res.status(400).json({ error: 'Table number and at least one item are required' });
     }

     const getMenuItem = db.prepare('SELECT * FROM menu_items WHERE id = ?');
     const lines = [];
     for (const it of items) {
       const menuItem = getMenuItem.get(it.menu_item_id);
       const qty = parseInt(it.qty, 10);
       if (!menuItem || !(qty > 0)) {
         return res.status(400).json({ error: 'Invalid item or quantity' });
       }
       lines.push({ name: menuItem.name, price: menuItem.price, qty: qty });
     }

     db.exec('BEGIN');
     try {
       const order = db
         .prepare('INSERT INTO orders (table_no, created_by) VALUES (?, ?)')
         .run(String(table_no), req.user.id);
       const orderId = Number(order.lastInsertRowid);
       const addItem = db.prepare('INSERT INTO order_items (order_id, name, price, qty) VALUES (?, ?, ?, ?)');
       lines.forEach((l) => addItem.run(orderId, l.name, l.price, l.qty));
       db.exec('COMMIT');
       res.status(201).json({ id: orderId });
     } catch (err) {
       db.exec('ROLLBACK');
       res.status(500).json({ error: 'Could not save the order' });
     }
   });

   module.exports = router;