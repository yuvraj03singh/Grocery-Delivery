const { Pool } = require('pg'); 
require('dotenv').config({path: './.env'}); 
const pool = new Pool({ connectionString: process.env.DATABASE_URL }); 
pool.query('SELECT total, id, status, "paymentMethod", "isPaid" FROM "Order" ORDER BY "createdAt" DESC LIMIT 5', (err, res) => { 
  if (err) console.log('Error:', err); 
  else console.log(res.rows); 
  pool.end(); 
});
