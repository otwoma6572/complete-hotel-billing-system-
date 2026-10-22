   const crypto = require('crypto');

   function hashPassword(password) {
     const salt = crypto.randomBytes(8).toString('hex');
     const hash = crypto.scryptSync(password, salt, 32).toString('hex');
     return salt + ':' + hash;
   }

   function checkPassword(password, stored) {
     const [salt, hash] = stored.split(':');
     return crypto.scryptSync(password, salt, 32).toString('hex') === hash;
   }

   module.exports = { hashPassword, checkPassword };