const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple JSON DB (for demo only). Replace with real DB in production.
const DB_FILE = path.join(__dirname, 'orders.json');
function readDB(){ try{ return JSON.parse(fs.readFileSync(DB_FILE)); }catch(e){ return []; } }
function saveDB(data){ fs.writeFileSync(DB_FILE, JSON.stringify(data,null,2)); }

// Create order
app.post('/api/orders',(req,res)=>{
  const orders = readDB();
  const id = 'OD'+Date.now();
  const order = { id, status:'pending', createdAt:new Date().toISOString(), ...req.body };
  orders.push(order); saveDB(orders);
  res.json(order);
});

// Update status (admin)
app.post('/api/orders/status',(req,res)=>{
  const { id, status } = req.body;
  const orders = readDB();
  const idx = orders.findIndex(o=>o.id===id);
  if(idx===-1) return res.status(404).json({error:'Order not found'});
  orders[idx].status = status;
  saveDB(orders);
  res.json({ok:true});
});

// List / search
app.get('/api/orders',(req,res)=>{
  const phone = req.query.phone;
  const orders = readDB();
  const filtered = phone ? orders.filter(o=>o.telephone && o.telephone.includes(phone)) : orders;
  res.json(filtered);
});

// Payment endpoints (mock). Replace with real provider integration.
app.post('/api/pay/:provider', (req,res)=>{
  const provider = req.params.provider; // wave | orange | mtn
  const { orderId, amount, telephone } = req.body;
  // In production, call provider API here and return checkout/redirect url or payment request id
  console.log('Initiate payment', provider, orderId, amount, telephone);
  return res.json({ success:true, checkout_url: `https://example.com/mock-pay?order=${orderId}&provider=${provider}` });
});

// Webhook receiver (provider will call this)
app.post('/api/webhook',(req,res)=>{
  // verify signature in production
  console.log('webhook', req.body);
  // Example: update order status based on webhook payload
  res.sendStatus(200);
});

app.listen(PORT, ()=>console.log('Server running on', PORT));
