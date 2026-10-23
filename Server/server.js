   const express = require('express');
   const db = require('./db');
   const { checkPassword } = require('./password');
   const { signToken, auth } = require('./auth');

   const app = express();
   app.use(express.json());
      app.use('/api/menu', require('./routes/menu'));

   app.get('/api/health', (req, res) => {
     res.json({ status: 'ok' });
   });

   app.post('/api/login', (req, res) => {
     const { username, password } = req.body;
     const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username || '');
     if (!user || !checkPassword(password || '', user.password_hash)) {
       return res.status(401).json({ error: 'Wrong username or password' });
     }
     res.json({
       token: signToken(user),
       user: { id: user.id, username: user.username, role: user.role }
     });
   });

   app.get('/api/me', auth(), (req, res) => {
     res.json(req.user);
   });

      
   app.get('/api/admin-test', auth('admin'), (req, res) => {
     res.json({ message: 'Welcome, admin' });
   });

   app.listen(3000, () => console.log('API running on http://localhost:3000'));