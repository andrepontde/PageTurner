async function fetchBooks() {
	const purchased = await fetch('/api/user/purchased');
    const rented = await fetch('/api/user/rented');
	const pbooks = await purchased.json();
    const rbooks = await rented.json();
	
    renderUserBooks(pbooks, 'purchased');
    renderUserBooks(rbooks, 'rented');
}


function renderUserBooks(books, type) {
  let booksDiv; // Declare the variable outside the block
  if (type === 'purchased') {
    booksDiv = document.getElementById('purchasedBooks');
  } else {
    booksDiv = document.getElementById('rentedBooks');
  }

  booksDiv.innerHTML = books.map(book => `
    <div class="book">
      <img src="${book.img}" alt="${book.title}" style="width: 128px; height: 192px; object-fit: cover;">
      <h3>${book.title}</h3>
      <p>${book.author}</p>
      <p>$${book.price}</p>
    </div>
  `).join('');
}

function goToIndex() {
	window.location.href = 'index.html';
}

fetchBooks();