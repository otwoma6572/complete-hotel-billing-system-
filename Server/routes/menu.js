   const router = require('express').Router();
   const db = require('../db');
   const { auth } = require('../auth');

   function validMenuItem(body) {
     const price = Number(body.price);
     return body.name && body.category && body.price !== '' && body.price != null && !isNaN(price) && price >= 0;
   }

   router.get('/', auth(), (req, res) => {
     res.json(db.prepare('SELECT * FROM menu_items ORDER BY category, name').all());
   });

   router.post('/', auth('admin'), (req, res) => {
     if (!validMenuItem(req.body)) {
       return res.status(400).json({ error: 'Name, category and a valid price are required' });
     }
     const { name, category, price } = req.body;
     const result = db
       .prepare('INSERT INTO menu_items (name, category, price) VALUES (?, ?, ?)')
       .run(name.trim(), category.trim(), Number(price));
     res.status(201).json({ id: Number(result.lastInsertRowid) });
   });

   router.put('/:id', auth('admin'), (req, res) => {
     if (!validMenuItem(req.body)) {
       return res.status(400).json({ error: 'Name, category and a valid price are required' });
     }
     const { name, category, price } = req.body;
     const result = db
       .prepare('UPDATE menu_items SET name = ?, category = ?, price = ? WHERE id = ?')
       .run(name.trim(), category.trim(), Number(price), req.params.id);
     if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });
     res.json({ ok: true });
   });

   router.delete('/:id', auth('admin'), (req, res) => {
     const result = db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
     if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });
     res.json({ ok: true });
   });

   module.exports = router;