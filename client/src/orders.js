   import { api } from './api.js';

   const esc = (s) =>
     String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
   const money = (n) => 'KES ' + Number(n).toFixed(2);

   export async function viewOrders(content) {
     const [menu, orders] = await Promise.all([api('/menu'), api('/orders')]);

     let html = '<h2>New order</h2>';
     html += '<form id="add-order">';
     html += '<input name="table_no" placeholder="Table number" required>';
     html += '<div class="menu-pick">';
     menu.forEach((m) => {
       html +=
         '<label>' + esc(m.name) + ' (' + money(m.price) + ') ' +
         '<input type="number" min="0" value="0" name="qty_' + m.id + '"></label>';
     });
     html += '</div>';
     html += '<button>Place order</button></form>';

     html += '<h2>Orders</h2>';
     if (orders.length === 0) {
       html += '<p>No orders yet.</p>';
     } else {
       html += '<table><tr><th>#</th><th>Table</th><th>Items</th><th>Subtotal</th><th>Status</th><th>Time</th></tr>';
       orders.forEach((o) => {
         const itemText = o.items.map((i) => i.qty + 'x ' + i.name).join(', ');
         html +=
           '<tr><td>' + o.id + '</td><td>' + esc(o.table_no) + '</td><td>' + esc(itemText) + '</td>' +
           '<td>' + money(o.subtotal) + '</td><td>' + esc(o.status) + '</td><td>' + esc(o.created_at) + '</td></tr>';
       });
       html += '</table>';
     }

     content.innerHTML = html;

     content.querySelector('#add-order').addEventListener('submit', async (e) => {
       e.preventDefault();
       const data = Object.fromEntries(new FormData(e.target));
       const items = [];
       Object.keys(data).forEach((key) => {
         const qty = parseInt(data[key], 10);
         if (key.startsWith('qty_') && qty > 0) {
           items.push({ menu_item_id: Number(key.slice(4)), qty: qty });
         }
       });
       if (items.length === 0) {
         alert('Choose at least one item');
         return;
       }
       try {
         await api('/orders', 'POST', { table_no: data.table_no, items: items });
         viewOrders(content);
       } catch (err) {
         alert(err.message);
       }
     });
   }