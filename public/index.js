//Fetch all books from the server and render them on the page when first accessed
async function fetchBooks() {
	const response = await fetch('/api/books');
	const books = await response.json();
	renderBooks(books);
}

//Search for a book by title
async function searchBook() {
	let bookTitle = document.getElementById('searchInput').value;
	const response = await fetch('/api/books/search', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ title: `${bookTitle}` })
	});
	const books = await response.json();
	renderBooks(books);
}

//Fetch books by genre
async function fetchByGenre(genre) {
	const response = await fetch(`/api/inventory/genre/${genre}`);
	const books = await response.json();
	renderBooks(books);
}

//Add book to cart for rent or purchase
async function addToCart(id, title, author, price, img, type) {
	await fetch('/api/cart', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ book: { id, title, author, price, img }, type })
	});
	alert(`Book added to cart for ${type}!`);
}

//Render the books on the page (With a simple layout and styling)
function renderBooks(books) {
	const booksDiv = document.getElementById('books');
	booksDiv.innerHTML = books.map(book => `
    <div class="book">
      <img src="${book.img}" alt="${book.title}" style="width: 128px; height: 192px; object-fit: cover;">
      <h3>${book.title}</h3>
      <p>${book.author}</p>
      <p>$${book.price}</p>
      <button onclick="addToCart('${book.id}', '${book.title}', '${book.author}', ${book.price}, '${book.img}', 'rent')">Rent</button>
      <button onclick="addToCart('${book.id}', '${book.title}', '${book.author}', ${book.price}, '${book.img}', 'buy')">Buy</button>
    </div>
  `).join('');
}

function goToCheckout() {
	window.location.href = 'checkout.html';
}

function goToUser() {
	window.location.href = 'user.html';
}

fetchBooks();
