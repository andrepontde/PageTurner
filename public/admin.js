const inventoryTableBody = document.getElementById('inventoryTableBody');
const addBookForm = document.getElementById('addBookForm');

// Fetch and display all books
async function fetchBooks() {
  const response = await fetch('/api/inventory/books');
  const books = await response.json();
  inventoryTableBody.innerHTML = ''; // Clear table
  books.forEach(book => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${book.id}</td>
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.price}</td>
      <td><img src="${book.img}" alt="${book.title}" width="50"></td>
      <td>${book.genre}</td>
      <td>
        <button onclick="editBook('${book.id}')">Edit</button>
        <button onclick="deleteBook('${book.id}')">Delete</button>
      </td>
    `;
    inventoryTableBody.appendChild(row);
  });
}

// Add a new book
addBookForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newBook = {
    id: document.getElementById('addId').value,
    title: document.getElementById('addTitle').value,
    author: document.getElementById('addAuthor').value,
    price: parseFloat(document.getElementById('addPrice').value),
    img: document.getElementById('addImg').value,
    genre: document.getElementById('addGenre').value
  };
  await fetch('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newBook)
  });
  fetchBooks();
  addBookForm.reset();
});

// Delete a book
async function deleteBook(bookId) {
  await fetch(`/api/inventory/${bookId}`, { method: 'DELETE' });
  fetchBooks(); // Refresh table
}

// Edit a book
async function editBook(bookId) {
  const newTitle = prompt('Enter new title:');
  const newAuthor = prompt('Enter new author:');
  const newPrice = prompt('Enter new price:');
  const newImg = prompt('Enter new image URL:');
  const newGenre = prompt('Enter new genre:');
  if (newTitle && newAuthor && newPrice && newImg && newGenre) {
    const updatedBook = {
      title: newTitle,
      author: newAuthor,
      price: parseFloat(newPrice),
      img: newImg,
      genre: newGenre
    };
    await fetch(`/api/inventory/${bookId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedBook)
    });
    fetchBooks(); // Refresh table
  }
}

// Initial fetch
fetchBooks();
