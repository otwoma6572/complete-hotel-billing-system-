   const router = require('express').Router();
   const db = require('../db');
   const { auth } = require('../auth');

   router.get('/daily', auth('admin'), (req, res) => {
     const date = req.query.date || new Date().toLocaleDateString('sv-SE');
     if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
       return res.status(400).json({ error: 'Invalid date' });
     }

     const overall = db
       .prepare(
         'SELECT COUNT(*) AS bills, COALESCE(SUM(subtotal), 0) AS subtotal, COALESCE(SUM(discount), 0) AS discount, ' +
           'COALESCE(SUM(tax), 0) AS tax, COALESCE(SUM(total), 0) AS total FROM bills WHERE date(created_at) = ?'
       )
       .get(date);

     const byType = db
       .prepare('SELECT type, COUNT(*) AS bills, SUM(total) AS total FROM bills WHERE date(created_at) = ? GROUP BY type')
       .all(date);

     const byPayment = db
       .prepare(
         'SELECT payment_method, COUNT(*) AS bills, SUM(total) AS total FROM bills WHERE date(created_at) = ? GROUP BY payment_method'
       )
       .all(date);

     res.json({ date, overall, byType, byPayment });
   });

   module.exports = router;