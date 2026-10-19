const express = require('express');
   require('./db');
const app = express ();

app.use(express.json());

app.get('/api/health' , (req, res) => {
    res.json({ status: 'ok'});
});

app.listen(3000, () => console.log('API running on http://localhost3000'));