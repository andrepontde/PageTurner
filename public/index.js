async function fetchBooks() {
  const response = await fetch('/api/books');
  const books = await response.json();
  renderBooks(books);
}

async function searchBook() {
    const response = await fetch('/api/books/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: "Hunger games" })
    });
    const books = await response.json();
    renderBooks(books);
  }

async function addToCart(id, title, author, price, img, type) {
  await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ book: { id, title, author, price, img }, type })
  });
  alert(`Book added to cart for ${type}!`);
}

function renderBooks(books) {
  const booksDiv = document.getElementById('books');
  booksDiv.innerHTML = books.map(book => `
    <div style="border: 1px solid #ccc; padding: 10px; margin: 10px; display: inline-block; text-align: center;">
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

fetchBooks();
