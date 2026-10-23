   import { api } from './api.js';

   const esc = (s) =>
     String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
   const money = (n) => 'KES ' + Number(n).toFixed(2);

   export async function viewMenu(content, user) {
     const isAdmin = user.role === 'admin';
     const items = await api('/menu');

     let html = '<h2>Menu</h2>';

     if (isAdmin) {
       html +=
         '<form id="add-menu" class="inline">' +
         '<input name="name" placeholder="Item name" required>' +
         '<input name="category" placeholder="Category" required>' +
         '<input name="price" type="number" step="0.01" min="0" placeholder="Price" required>' +
         '<button>Add item</button>' +
         '</form>';
     }

     if (items.length === 0) {
       html += '<p>No menu items yet.</p>';
     } else {
       html += '<table><tr><th>Item</th><th>Category</th><th>Price</th>';
       if (isAdmin) html += '<th>Actions</th>';
       html += '</tr>';
       items.forEach((i) => {
         html += '<tr><td>' + esc(i.name) + '</td><td>' + esc(i.category) + '</td><td>' + money(i.price) + '</td>';
         if (isAdmin) {
           html +=
             '<td><button data-action="edit" data-id="' + i.id + '">Edit price</button> ' +
             '<button data-action="delete" data-id="' + i.id + '">Delete</button></td>';
         }
         html += '</tr>';
       });
       html += '</table>';
     }

     content.innerHTML = html;

     if (!isAdmin) return;

     content.querySelector('#add-menu').addEventListener('submit', async (e) => {
       e.preventDefault();
       try {
         await api('/menu', 'POST', Object.fromEntries(new FormData(e.target)));
         viewMenu(content, user);
       } catch (err) {
         alert(err.message);
       }
     });

     const table = content.querySelector('table');
     if (table) {
       table.addEventListener('click', async (e) => {
         const btn = e.target.closest('button[data-action]');
         if (!btn) return;
         const id = btn.dataset.id;
         try {
           if (btn.dataset.action === 'delete') {
             if (!confirm('Delete this item?')) return;
             await api('/menu/' + id, 'DELETE');
           } else {
             const item = items.find((i) => String(i.id) === id);
             const price = prompt('New price for ' + item.name + ':', item.price);
             if (price === null) return;
             await api('/menu/' + id, 'PUT', { name: item.name, category: item.category, price: price });
           }
           viewMenu(content, user);
         } catch (err) {
           alert(err.message);
         }
       });
     }
   }