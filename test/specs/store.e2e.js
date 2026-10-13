const { storeUrl } = require('../fixtures/storeFixture');
describe('Synthetic store checkout',()=>{
  beforeEach(async()=>{await browser.url(storeUrl());await $('#add-notebook').waitForClickable()});
  it('smoke: adds products and calculates total in cents',async()=>{
    await $('#add-notebook').click();await $('#add-pen').click();
    await expect($('#cart-count')).toHaveText('2');await expect($('#cart-total')).toHaveText('$15.00');
  });
  it('removes product without negative quantity',async()=>{
    await $('#remove-notebook').click();await expect($('#cart-count')).toHaveText('0');
    await $('#add-notebook').click();await $('#remove-notebook').click();
    await expect($('#cart-total')).toHaveText('$0.00');
  });
  it('checks out a nonempty cart',async()=>{
    await $('#add-notebook').click();await $('#email').setValue('buyer@example.test');
    await $('button[type="submit"]').click();
    await expect($('#order-result')).toHaveText('Order placed for $12.00');
  });
  it('rejects checkout with an empty cart',async()=>{
    await $('#email').setValue('buyer@example.test');await $('button[type="submit"]').click();
    await expect($('#order-result')).toHaveText('Cart is empty');
  });
});
