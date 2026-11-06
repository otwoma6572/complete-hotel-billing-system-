   import { api } from './api.js';

   const esc = (s) =>
     String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
   const money = (n) => 'KES ' + Number(n).toFixed(2);

   export async function showReceipt(billId) {
     const b = await api('/bills/' + billId);

     let rows = '';
     b.lines.forEach((l) => {
       rows +=
         '<tr><td>' + esc(l.desc) + '</td><td>' + l.qty + '</td><td>' + money(l.price) + '</td>' +
         '<td class="right">' + money(l.qty * l.price) + '</td></tr>';
     });

     const html =
       '<div id="receipt">' +
       '<h2>HOTEL & RESTAURANT</h2>' +
       '<p class="center">Receipt #' + b.id + '</p>' +
       '<p class="center">' + esc(b.created_at) + '</p>' +
       '<p class="center">' + esc(b.heading) + '</p>' +
       '<table><tr><th>Item</th><th>Qty</th><th>Price</th><th class="right">Total</th></tr>' + rows + '</table>' +
       '<p class="right">Subtotal: ' + money(b.subtotal) + '</p>' +
       '<p class="right">Discount: ' + money(b.discount) + '</p>' +
       '<p class="right">Tax: ' + money(b.tax) + '</p>' +
       '<p class="right"><strong>TOTAL: ' + money(b.total) + '</strong></p>' +
       '<p class="center">Paid by: ' + esc(b.payment_method) + '</p>' +
       '<p class="center">Thank you!</p>' +
       '</div>' +
       '<div class="no-print"><button id="print-receipt">Print</button> <button id="close-receipt">Close</button></div>';

     const overlay = document.createElement('div');
     overlay.id = 'modal';
     overlay.innerHTML = '<div id="modal-box">' + html + '</div>';
     document.body.appendChild(overlay);

     overlay.querySelector('#print-receipt').addEventListener('click', () => window.print());
     overlay.querySelector('#close-receipt').addEventListener('click', () => overlay.remove());
   }