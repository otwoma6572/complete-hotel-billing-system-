   import { api } from './api.js';
   import { showReceipt } from './receipt.js';

   const esc = (s) =>
     String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
   const money = (n) => 'KES ' + Number(n).toFixed(2);

   export async function viewBills(content) {
     const bills = await api('/bills');

     let html = '<h2>Bills</h2>';
     if (bills.length === 0) {
       html += '<p>No bills yet.</p>';
     } else {
       html += '<table><tr><th>#</th><th>Type</th><th>Ref</th><th>Subtotal</th><th>Discount</th><th>Tax</th><th>Total</th><th>Payment</th><th>Time</th><th></th></tr>';
       bills.forEach((b) => {
         html +=
           '<tr><td>' + b.id + '</td><td>' + esc(b.type) + '</td><td>' + b.ref_id + '</td>' +
           '<td>' + money(b.subtotal) + '</td><td>' + money(b.discount) + '</td><td>' + money(b.tax) + '</td>' +
           '<td>' + money(b.total) + '</td><td>' + esc(b.payment_method) + '</td><td>' + esc(b.created_at) + '</td>' +
           '<td><button data-receipt="' + b.id + '">Receipt</button></td></tr>';
       });
       html += '</table>';
     }

     content.innerHTML = html;

     const table = content.querySelector('table');
     if (table) {
       table.addEventListener('click', async (e) => {
         const btn = e.target.closest('button[data-receipt]');
         if (!btn) return;
         try {
           await showReceipt(btn.dataset.receipt);
         } catch (err) {
           alert(err.message);
         }
       });
     }
   }