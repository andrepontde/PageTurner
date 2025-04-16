async function fetchCart() {
	const response = await fetch('/api/user');
	const user = await response.json();
	const cartDiv = document.getElementById('cart');
	cartDiv.innerHTML = user.user.cart.map(book => `
    <div class="book">
      <h3>${book.title}</h3>
      <p>${book.author}</p>
      <p>$${book.price}</p>
    </div>
  `).join('');
}

async function checkout() {
	await fetch('/api/checkout', { method: 'POST' });
	alert('Checkout complete!');
	fetchCart();
}

function goToReturns() {
	window.location.href = 'returns.html';
}
function goToIndex() {
	window.location.href = 'index.html';
}

function goToPayment() {
  window.location.href = 'payment.html';
}

fetchCart();
