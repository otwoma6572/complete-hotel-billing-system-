   import { api } from './api.js';

   const esc = (s) =>
     String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
   const money = (n) => 'KES ' + Number(n).toFixed(2);

   export async function viewRooms(content, user) {
     const rooms = await api('/rooms');
     const isAdmin = user.role === 'admin';

     let html = '<h2>Rooms</h2>';

     if (isAdmin) {
       html +=
         '<form id="add-room" class="inline">' +
         '<input name="number" placeholder="Room number" required>' +
         '<input name="type" placeholder="Type (Single, Double...)" required>' +
         '<input name="price_per_night" type="number" step="0.01" min="0" placeholder="Price per night" required>' +
         '<button>Add room</button>' +
         '</form>';
     }

     if (rooms.length === 0) {
       html += '<p>No rooms yet.</p>';
     } else {
       html += '<table><tr><th>Room</th><th>Type</th><th>Price per night</th></tr>';
       rooms.forEach((r) => {
         html += '<tr><td>' + esc(r.number) + '</td><td>' + esc(r.type) + '</td><td>' + money(r.price_per_night) + '</td></tr>';
       });
       html += '</table>';
     }

     content.innerHTML = html;

     if (!isAdmin) return;

     content.querySelector('#add-room').addEventListener('submit', async (e) => {
       e.preventDefault();
       try {
         await api('/rooms', 'POST', Object.fromEntries(new FormData(e.target)));
         viewRooms(content, user);
       } catch (err) {
         alert(err.message);
       }
     });
   }