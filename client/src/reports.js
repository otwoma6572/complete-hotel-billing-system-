   import { api } from './api.js';

   const esc = (s) =>
     String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
   const money = (n) => 'KES ' + Number(n).toFixed(2);
   const typeNames = { order: 'Restaurant orders', booking: 'Hotel bookings' };

   export async function viewReports(content, user, date) {
     const day = date || new Date().toLocaleDateString('sv-SE');
     const r = await api('/reports/daily?date=' + day);

     let html = '<h2>Daily sales report</h2>';
     html +=
       '<form id="report-form" class="inline">' +
       '<input type="date" name="date" value="' + esc(day) + '" required>' +
       '<button>Show</button></form>';

     html += '<h2>Totals for ' + esc(day) + '</h2>';
     html +=
       '<table><tr><th>Bills</th><th>Subtotal</th><th>Discount</th><th>Tax</th><th>Total</th></tr>' +
       '<tr><td>' + r.overall.bills + '</td><td>' + money(r.overall.subtotal) + '</td><td>' + money(r.overall.discount) +
       '</td><td>' + money(r.overall.tax) + '</td><td><strong>' + money(r.overall.total) + '</strong></td></tr></table>';

     html += '<h2>By type</h2>';
     if (r.byType.length === 0) {
       html += '<p>No sales on this day.</p>';
     } else {
       html += '<table><tr><th>Type</th><th>Bills</th><th>Total</th></tr>';
       r.byType.forEach((t) => {
         html += '<tr><td>' + esc(typeNames[t.type] || t.type) + '</td><td>' + t.bills + '</td><td>' + money(t.total) + '</td></tr>';
       });
       html += '</table>';
     }

     html += '<h2>By payment method</h2>';
     if (r.byPayment.length === 0) {
       html += '<p>No sales on this day.</p>';
     } else {
       html += '<table><tr><th>Method</th><th>Bills</th><th>Total</th></tr>';
       r.byPayment.forEach((p) => {
         html += '<tr><td>' + esc(p.payment_method) + '</td><td>' + p.bills + '</td><td>' + money(p.total) + '</td></tr>';
       });
       html += '</table>';
     }

     content.innerHTML = html;

     content.querySelector('#report-form').addEventListener('submit', (e) => {
       e.preventDefault();
       const chosen = new FormData(e.target).get('date');
       viewReports(content, user, chosen).catch((err) => alert(err.message));
     });
   }