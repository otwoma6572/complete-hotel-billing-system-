   const router = require('express').Router();
   const db = require('../db');
   const { auth } = require('../auth');

   router.get('/', auth(), (req, res) => {
     res.json(db.prepare('SELECT * FROM rooms ORDER BY number').all());
   });

   router.post('/', auth('admin'), (req, res) => {
     const { number, type, price_per_night } = req.body;
     const price = Number(price_per_night);
     if (!number || !type || price_per_night === '' || price_per_night == null || isNaN(price) || price < 0) {
       return res.status(400).json({ error: 'Room number, type and a valid price are required' });
     }
     try {
       db.prepare('INSERT INTO rooms (number, type, price_per_night) VALUES (?, ?, ?)')
         .run(String(number).trim(), String(type).trim(), price);
       res.status(201).json({ ok: true });
     } catch (err) {
       res.status(400).json({ error: 'Room number already exists' });
     }
   });

   module.exports = router;