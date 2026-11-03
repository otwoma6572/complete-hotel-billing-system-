   const router = require('express').Router();
   const db = require('../db');
   const { auth } = require('../auth');

   const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d));

   router.get('/', auth('admin', 'receptionist'), (req, res) => {
     res.json(
       db
         .prepare(
           'SELECT b.*, r.number AS room_number, r.type AS room_type, r.price_per_night ' +
             'FROM bookings b JOIN rooms r ON r.id = b.room_id ORDER BY b.id DESC'
         )
         .all()
     );
   });

   router.post('/', auth('admin', 'receptionist'), (req, res) => {
     const { guest_name, phone, check_in, check_out } = req.body;
     const room_id = Number(req.body.room_id);

     if (!room_id || !guest_name || !isDate(check_in) || !isDate(check_out)) {
       return res.status(400).json({ error: 'Room, guest name and valid dates are required' });
     }
     if (check_out <= check_in) {
       return res.status(400).json({ error: 'Check-out must be after check-in' });
     }
     if (!db.prepare('SELECT id FROM rooms WHERE id = ?').get(room_id)) {
       return res.status(400).json({ error: 'Room not found' });
     }

     const clash = db
       .prepare("SELECT 1 FROM bookings WHERE room_id = ? AND status = 'booked' AND check_in < ? AND check_out > ?")
       .get(room_id, check_out, check_in);
     if (clash) {
       return res.status(400).json({ error: 'Room is already booked for those dates' });
     }

     const result = db
       .prepare('INSERT INTO bookings (room_id, guest_name, phone, check_in, check_out) VALUES (?, ?, ?, ?, ?)')
       .run(room_id, guest_name.trim(), phone || '', check_in, check_out);
     res.status(201).json({ id: Number(result.lastInsertRowid) });
   });

   module.exports = router;