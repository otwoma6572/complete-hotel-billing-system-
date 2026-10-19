   fetch('/api/health')
     .then(res => res.json())
     .then(data => {
       document.querySelector('#app').textContent = 'API says: ' + data.status;
     });