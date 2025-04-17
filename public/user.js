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
      ${book.review 
        ? `<p><strong>Review:</strong> ${book.review}</p><button onclick="editReview('${book.id}', '${book.review}')">Edit Review</button>` 
        : `<button onclick="addReview('${book.id}')">Add Review</button>`}
    </div>
  `).join('');
}

async function addReview(bookId) {
	const review = prompt('Enter your review:');
	if (review) {
		await fetch(`/api/user/review`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ bookId, review })
		});
		alert('Review added successfully!');
		fetchBooks(); // Refresh the books to show the updated review
	}
}

async function editReview(bookId, currentReview) {
	const review = prompt('Edit your review:', currentReview);
	if (review && review !== currentReview) {
		await fetch(`/api/user/review`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ bookId, review })
		});
		alert('Review updated successfully!');
		fetchBooks(); // Refresh the books to show the updated review
	}
}

fetchBooks();