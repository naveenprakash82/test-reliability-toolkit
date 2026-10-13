const test=require('node:test');const assert=require('node:assert/strict');
const {validateOrderResponse}=require('../../src/contracts/orderContract');
const valid={orderId:'order-100',status:'confirmed',totalCents:1500,items:[{sku:'notebook',quantity:1},{sku:'pen',quantity:1}]};
test('accepts a compatible response and additive fields',()=>{assert.deepEqual(validateOrderResponse(valid),[]);assert.deepEqual(validateOrderResponse({...valid,traceId:'trace-1'}),[])});
test('rejects breaking order ID type',()=>assert.match(validateOrderResponse({...valid,orderId:100}).join(';'),/orderId/));
test('rejects an unrecognized order status',()=>assert.match(validateOrderResponse({...valid,status:'refunded'}).join(';'),/status/));
test('rejects missing items and noninteger money',()=>{assert.match(validateOrderResponse({...valid,items:[]}).join(';'),/items/);assert.match(validateOrderResponse({...valid,totalCents:15.50}).join(';'),/totalCents/)});
test('rejects invalid item quantity',()=>assert.match(validateOrderResponse({...valid,items:[{sku:'notebook',quantity:0}]}).join(';'),/quantity/));
test('rejects unexpected response shapes',()=>assert.deepEqual(validateOrderResponse(null),['response must be an object']));
