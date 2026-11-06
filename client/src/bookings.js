   import { api } from './api.js';
   import { createBill } from './billing.js';
   import { showReceipt } from './receipt.js';

   const esc = (s) =>
     String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

   export async function viewBookings(content) {
     const [rooms, bookings] = await Promise.all([api('/rooms'), api('/bookings')]);

     let html = '<h2>New booking</h2>';
     html += '<form id="add-booking" class="inline">';
     html += '<select name="room_id" required>';
     rooms.forEach((r) => {
       html += '<option value="' + r.id + '">Room ' + esc(r.number) + ' - ' + esc(r.type) + '</option>';
     });
     html += '</select>';
     html += '<input name="guest_name" placeholder="Guest name" required>';
     html += '<input name="phone" placeholder="Phone">';
     html += '<label>Check-in <input name="check_in" type="date" required></label>';
     html += '<label>Check-out <input name="check_out" type="date" required></label>';
     html += '<button>Book</button>';
     html += '</form>';

     html += '<h2>Bookings</h2>';
     if (bookings.length === 0) {
       html += '<p>No bookings yet.</p>';
     } else {
       html += '<table><tr><th>#</th><th>Room</th><th>Guest</th><th>Phone</th><th>Check-in</th><th>Check-out</th><th>Status</th><th>Action</th></tr>';
       bookings.forEach((b) => {
         html +=
           '<tr><td>' + b.id + '</td><td>' + esc(b.room_number) + '</td><td>' + esc(b.guest_name) + '</td>' +
           '<td>' + esc(b.phone) + '</td><td>' + esc(b.check_in) + '</td><td>' + esc(b.check_out) + '</td>' +
           '<td>' + esc(b.status) + '</td><td>';
         if (b.status === 'booked') {
           html += '<button data-bill="' + b.id + '">Check out and bill</button>';
         }
         html += '</td></tr>';
       });
       html += '</table>';
     }

     content.innerHTML = html;

     content.querySelector('#add-booking').addEventListener('submit', async (e) => {
       e.preventDefault();
       try {
         await api('/bookings', 'POST', Object.fromEntries(new FormData(e.target)));
         viewBookings(content);
       } catch (err) {
         alert(err.message);
       }
     });

     const table = content.querySelector('table');
     if (table) {
       table.addEventListener('click', async (e) => {
         const btn = e.target.closest('button[data-bill]');
         if (!btn) return;
         try {
           const billId = await createBill('booking', btn.dataset.bill);
           if (billId) {
             await showReceipt(billId);
             viewBookings(content);
           }
         } catch (err) {
           alert(err.message);
         }
       });
     }
   }