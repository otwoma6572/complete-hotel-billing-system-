   const router = require('express').Router();
   const db = require('../db');
   const { auth } = require('../auth');

   const TAX_RATE = 0.16; // change to your local tax rate
   const round2 = (n) => Math.round(n * 100) / 100;
   const nightsBetween = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000));
   const NO_PERMISSION = { error: 'You do not have permission for this action' };

   router.get('/', auth(), (req, res) => {
     res.json(db.prepare('SELECT * FROM bills ORDER BY id DESC').all());
   });

   router.post('/', auth(), (req, res) => {
     const { type, payment_method } = req.body;
     const ref_id = Number(req.body.ref_id);
     const discount = Number(req.body.discount || 0);
     let subtotal;

     if (type === 'order') {
       if (!['admin', 'waiter'].includes(req.user.role)) return res.status(403).json(NO_PERMISSION);
       const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(ref_id);
       if (!order || order.status !== 'open') {
         return res.status(400).json({ error: 'Order not found or already billed' });
       }
       subtotal = db.prepare('SELECT COALESCE(SUM(price * qty), 0) AS s FROM order_items WHERE order_id = ?').get(ref_id).s;
     } else if (type === 'booking') {
       if (!['admin', 'receptionist'].includes(req.user.role)) return res.status(403).json(NO_PERMISSION);
       const b = db
         .prepare('SELECT b.*, r.price_per_night FROM bookings b JOIN rooms r ON r.id = b.room_id WHERE b.id = ?')
         .get(ref_id);
       if (!b || b.status !== 'booked') {
         return res.status(400).json({ error: 'Booking not found or already billed' });
       }
       subtotal = nightsBetween(b.check_in, b.check_out) * b.price_per_night;
     } else {
       return res.status(400).json({ error: 'Invalid bill type' });
     }

     if (isNaN(discount) || discount < 0 || discount > subtotal) {
       return res.status(400).json({ error: 'Invalid discount' });
     }

     const taxable = subtotal - discount;
     const tax = round2(taxable * TAX_RATE);
     const total = round2(taxable + tax);

     db.exec('BEGIN');
     try {
       const bill = db
         .prepare(
           'INSERT INTO bills (type, ref_id, subtotal, discount, tax, total, payment_method, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
         )
         .run(type, ref_id, subtotal, discount, tax, total, payment_method || 'cash', req.user.id);
       const table = type === 'order' ? 'orders' : 'bookings';
       db.prepare("UPDATE " + table + " SET status = 'billed' WHERE id = ?").run(ref_id);
       db.exec('COMMIT');
       res.status(201).json({ id: Number(bill.lastInsertRowid) });
     } catch (err) {
       db.exec('ROLLBACK');
       res.status(500).json({ error: 'Could not save the bill' });
     }
   });

   router.get('/:id', auth(), (req, res) => {
     const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(req.params.id);
     if (!bill) return res.status(404).json({ error: 'Bill not found' });

     if (bill.type === 'order') {
       const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(bill.ref_id);
       const items = db.prepare('SELECT name, price, qty FROM order_items WHERE order_id = ?').all(bill.ref_id);
       res.json({
         ...bill,
         heading: 'Table ' + order.table_no,
         lines: items.map((i) => ({ desc: i.name, qty: i.qty, price: i.price }))
       });
     } else {
       const b = db
         .prepare(
           'SELECT b.*, r.number, r.type AS room_type, r.price_per_night FROM bookings b JOIN rooms r ON r.id = b.room_id WHERE b.id = ?'
         )
         .get(bill.ref_id);
       res.json({
         ...bill,
         heading: 'Guest: ' + b.guest_name,
         lines: [
           {
             desc: 'Room ' + b.number + ' (' + b.room_type + ') ' + b.check_in + ' to ' + b.check_out,
             qty: nightsBetween(b.check_in, b.check_out),
             price: b.price_per_night
           }
         ]
       });
     }
   });

   module.exports = router;