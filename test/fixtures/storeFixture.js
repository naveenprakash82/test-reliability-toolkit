const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Demo Store</title></head><body>
<h1>Demo Store</h1><section aria-label="Products">
<article><h2>Notebook</h2><p>$12.00</p><button id="add-notebook">Add notebook</button></article>
<article><h2>Pen</h2><p>$3.00</p><button id="add-pen">Add pen</button></article>
</section><section aria-label="Cart"><h2>Cart</h2><output id="cart-count" aria-label="Cart item count">0</output><p id="cart-total">$0.00</p><button id="remove-notebook">Remove notebook</button><button id="clear-cart">Clear cart</button></section>
<form id="checkout"><label for="email">Email</label><input id="email" type="email" required><button type="submit">Place order</button></form><p id="order-result" role="status"></p>
<script>
const prices = {notebook:1200,pen:300};const cart={notebook:0,pen:0};
function total(){return Object.keys(cart).reduce((sum,name)=>sum+prices[name]*cart[name],0)}
function render(){document.querySelector('#cart-count').textContent=String(cart.notebook+cart.pen);document.querySelector('#cart-total').textContent='$'+(total()/100).toFixed(2)}
document.querySelector('#add-notebook').onclick=()=>{cart.notebook++;render()};
document.querySelector('#add-pen').onclick=()=>{cart.pen++;render()};
document.querySelector('#remove-notebook').onclick=()=>{cart.notebook=Math.max(0,cart.notebook-1);render()};
document.querySelector('#clear-cart').onclick=()=>{cart.notebook=0;cart.pen=0;render()};
document.querySelector('#checkout').onsubmit=e=>{e.preventDefault();document.querySelector('#order-result').textContent=total()>0?'Order placed for $'+(total()/100).toFixed(2):'Cart is empty'};
</script></body></html>`;
function storeUrl(){return 'data:text/html;charset=utf-8,'+encodeURIComponent(html)}
module.exports={storeUrl};
