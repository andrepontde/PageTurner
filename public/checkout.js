async function fetchCart() {
	const response = await fetch('/api/user');
	const user = await response.json();
	const cartDiv = document.getElementById('cart');
	cartDiv.innerHTML = user.user.cart.map(book => `
    <div class="book">
      <h3>${book.title}</h3>
           <img src="${book.img}" alt="${book.title}"> 
	  <p>${book.author}</p>
      <p>$${book.price}</p>
    </div>
  `).join('');
}

function goToPayment() {
  if (document.getElementById('cart').innerHTML === '') {
    alert('Your cart is empty!');
    return;
  }
	window.location.href = 'payment.html';
}

fetchCart();
