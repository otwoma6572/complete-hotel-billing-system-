   const jwt = require('jsonwebtoken');
   const SECRET = process.env.JWT_SECRET || 'change-this-secret-later';

   function signToken(user) {
     return jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '12h' });
   }

   function auth(...roles) {
     return (req, res, next) => {
       const token = (req.headers.authorization || '').replace('Bearer ', '');
       try {
         const user = jwt.verify(token, SECRET);
         if (roles.length && !roles.includes(user.role)) {
           return res.status(403).json({ error: 'You do not have permission for this action' });
         }
         req.user = user;
         next();
       } catch {
         res.status(401).json({ error: 'Please log in' });
       }
     };
   }

   module.exports = { signToken, auth };