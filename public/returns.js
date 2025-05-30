async function fetchRentedBooks() {
	const response = await fetch('/api/user');
	const userData = await response.json();
	const rentedBooks = userData.user.rentedBooks || [];
	const rentedBooksDiv = document.getElementById('rentedBooks');
	rentedBooksDiv.innerHTML = rentedBooks.map(book => `
    <div class="book">
      <img src="${book.img}" alt="${book.title}" style="width: 128px; height: 192px; object-fit: cover;">
      <h3>${book.title}</h3>
      <p>${book.author}</p>
      <p>Due Date: ${new Date(book.dueDate).toLocaleDateString()}</p>
      <button onclick="returnBook('${book.id}')">Return</button>
    </div>
  `).join('');
}

async function returnBook(bookId) {
	const response = await fetch('/api/returns', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ bookId })
	});
	const result = await response.json();
	if (result.lateFee > 0) {
		alert(`Book returned successfully. Late fee: $${result.lateFee}`);
	} else {
		alert('Book returned successfully. No late fee.');
	}
	fetchRentedBooks();
}

fetchRentedBooks();
