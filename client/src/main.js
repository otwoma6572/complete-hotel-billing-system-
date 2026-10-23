      import './style.css';
   import { api } from './api.js';
   import { viewMenu } from './menu.js';

   const loginView = document.querySelector('#login-view');
   const appView = document.querySelector('#app-view');
   const errorBox = document.querySelector('#login-error');

   
   const tabsByRole = {
     admin: ['Menu', 'Orders', 'Rooms', 'Bookings', 'Bills', 'Users'],
     waiter: ['Orders', 'Menu', 'Bills'],
     receptionist: ['Bookings', 'Rooms', 'Bills']
   };

      function showTab(name) {
     document.querySelectorAll('#tabs button').forEach((b) => {
       b.classList.toggle('active', b.dataset.tab === name);
     });
     const content = document.querySelector('#content');
     const user = JSON.parse(localStorage.getItem('user'));

     if (name === 'Menu') {
       viewMenu(content, user).catch((err) => {
         content.textContent = err.message;
       });
     } else {
       content.innerHTML = '<h2>' + name + '</h2><p>This page is coming soon.</p>';
     }
   }

   function showApp() {
     const user = JSON.parse(localStorage.getItem('user'));
     document.querySelector('#who').textContent = user.username + ' (' + user.role + ')';

     const tabs = document.querySelector('#tabs');
     tabs.innerHTML = '';
     tabsByRole[user.role].forEach((name) => {
       const b = document.createElement('button');
       b.textContent = name;
       b.dataset.tab = name;
       b.addEventListener('click', () => showTab(name));
       tabs.appendChild(b);
     });
     showTab(tabsByRole[user.role][0]);

     loginView.hidden = true;
     appView.hidden = false;
   }

   function showLogin() {
     appView.hidden = true;
     loginView.hidden = false;
   }

   document.querySelector('#login-form').addEventListener('submit', async (e) => {
     e.preventDefault();
     try {
       const data = await api('/login', 'POST', {
         username: document.querySelector('#username').value,
         password: document.querySelector('#password').value
       });
       localStorage.setItem('token', data.token);
       localStorage.setItem('user', JSON.stringify(data.user));
       errorBox.textContent = '';
       e.target.reset();
       showApp();
     } catch (err) {
       errorBox.textContent = err.message;
     }
   });

   document.querySelector('#logout').addEventListener('click', () => {
     localStorage.removeItem('token');
     localStorage.removeItem('user');
     showLogin();
   });

   
   if (localStorage.getItem('token') && localStorage.getItem('user')) {
     showApp();
   }