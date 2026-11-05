   import { api } from './api.js';

   export async function createBill(type, id) {
     const discount = prompt('Discount amount (0 for none):', '0');
     if (discount === null) return null;
     const method = prompt('Payment method (cash / mpesa / card):', 'cash');
     if (method === null) return null;

     const result = await api('/bills', 'POST', {
       type: type,
       ref_id: Number(id),
       discount: discount,
       payment_method: method
     });
     return result.id;
   }