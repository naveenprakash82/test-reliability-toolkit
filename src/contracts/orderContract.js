/** Validate only the public example consumer contract. Extra fields are allowed. */
function validateOrderResponse(data) {
  const errors=[];
  if(!data || typeof data!=='object' || Array.isArray(data)) return ['response must be an object'];
  if(typeof data.orderId!=='string'||data.orderId.trim()==='') errors.push('orderId must be a nonempty string');
  if(!['pending','confirmed','cancelled'].includes(data.status)) errors.push('status must be pending, confirmed, or cancelled');
  if(!Number.isSafeInteger(data.totalCents)||data.totalCents<0) errors.push('totalCents must be a nonnegative safe integer');
  if(!Array.isArray(data.items)||data.items.length===0) errors.push('items must be a nonempty array');
  else data.items.forEach((item,index)=>{
    if(!item||typeof item!=='object'||Array.isArray(item)) {errors.push(`items[${index}] must be an object`);return;}
    if(typeof item.sku!=='string'||!item.sku.trim()) errors.push(`items[${index}].sku must be a nonempty string`);
    if(!Number.isSafeInteger(item.quantity)||item.quantity<=0) errors.push(`items[${index}].quantity must be a positive safe integer`);
  });
  return errors;
}
module.exports={validateOrderResponse};
