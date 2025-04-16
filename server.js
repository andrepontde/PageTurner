const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

const userFilePath = path.join(__dirname, 'data', 'user.json');
const inventoryFilePath = path.join(__dirname, 'data', 'inventory.json');

//Function to initialize inventory
//The inventory will be initialized only once when the server starts, this takes plenty of books from the Google Books API and saves them in a JSON file with a random price
async function initializeInventory() {
	if (!fs.existsSync(inventoryFilePath)) {
		const genres = ['fiction', 'mystery', 'fantasy', 'romance', 'science', 'history', 'horror'];
		const inventory = [];

		for (const genre of genres) {
			try {
				const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=subject:${genre}&maxResults=15`);
				const books = response.data.items.map(item => ({
					id: item.id,
					title: item.volumeInfo.title,
					author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Unknown Author',
					price: Math.floor(Math.random() * 20) + 5, //Mock price
					img: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQv49HCBKpXJUHVHYX9_u7CqQbENtyVx94FA&s',
					genre
				}));
				inventory.push(...books);
			} catch (error) {
				console.error(`Error fetching books for genre ${genre}:`, error.message);
			}
		}

		fs.writeFileSync(inventoryFilePath, JSON.stringify(inventory, null, 2));
		console.log('Inventory initialized.');
	}
}

// Get books from inventory
app.get('/api/books', (req, res) => {
	if (!fs.existsSync(inventoryFilePath)) {
		return res.status(500).json({ error: 'Inventory not initialized' });
	}
	const inventory = JSON.parse(fs.readFileSync(inventoryFilePath, 'utf8'));
	res.json(inventory.slice(0, 20)); // Return only the first 20 books
});

//Search for books by title
//If it is not in the inventory, add it and assign it a random price
app.post('/api/books/search', async (req, res) => {
	const { title } = req.body;
	if (!title) {
		return res.status(400).json({ error: 'Title is required in the request body' });
	}
	try {
		const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=5`);
		const books = response.data.items.map(item => ({
			id: item.id,
			title: item.volumeInfo.title,
			author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Unknown Author',
			price: Math.floor(Math.random() * 20) + 5, // Mock price
			img: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQv49HCBKpXJUHVHYX9_u7CqQbENtyVx94FA&s'
		}));
		res.json(books);
	} catch (error) {
		console.error('Error searching for books:', error.message);
		res.status(500).json({ error: 'Failed to search for books' });
	}
});

//Get user data
app.get('/api/user', (req, res) => {
	const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
	res.json(userData);
});

//Get user's purchased and rented books
app.get('/api/user/purchased', (req, res) => {
	const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
	const purchasedBooks = userData.user.purchasedBooks || [];
	res.json(purchasedBooks);
});
app.get('/api/user/rented', (req, res) => {
	const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
	const rentedBooks = userData.user.rentedBooks || [];
	res.json(rentedBooks);
});

//Add book to cart with type (rent or buy)
app.post('/api/cart', (req, res) => {
	const { book, type } = req.body; //`type` can be 'rent' or 'buy'
	if (!['rent', 'buy'].includes(type)) {
		return res.status(400).json({ error: 'Invalid type. Must be "rent" or "buy".' });
	}

	const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
	const inventory = JSON.parse(fs.readFileSync(inventoryFilePath, 'utf8'));

	//Check if the book exists in the inventory
	let bookIndex = inventory.findIndex(item => item.id === book.id);
	if (bookIndex === -1) {

		//Add the book to the inventory if it doesn't exist
		inventory.push(book);
		bookIndex = inventory.length - 1;
	}

	book.type = type; // Add type to the book object
	userData.user.cart.push(book);

	// Remove the book from the inventory
	inventory.splice(bookIndex, 1);

	fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));
	fs.writeFileSync(inventoryFilePath, JSON.stringify(inventory, null, 2));
	res.json(userData);
});

//Checkout books (rent or buy)
app.post('/api/checkout', (req, res) => {
	const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
	const currentDate = new Date();
	const dueDate = new Date();
	dueDate.setDate(currentDate.getDate() + 14); // Set due date to 14 days from now

	userData.user.cart.forEach(book => {
		if (book.type === 'rent') {
			book.dueDate = dueDate.toISOString(); // Add due date for rented books
			userData.user.rentedBooks.push(book);
		} else if (book.type === 'buy') {
			userData.user.purchasedBooks = userData.user.purchasedBooks || []; // Initialize purchasedBooks if it doesn't exist
			userData.user.purchasedBooks.push(book);
		}
	});

	userData.user.cart = []; //Clear the cart after checkout
	fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));
	res.json(userData);
});

// Return books with late fee calculation
app.post('/api/returns', (req, res) => {
	const { bookId } = req.body;
	const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
	const inventory = JSON.parse(fs.readFileSync(inventoryFilePath, 'utf8'));

	const rentedBookIndex = userData.user.rentedBooks.findIndex(book => book.id === bookId);
	if (rentedBookIndex === -1) {
		return res.status(404).json({ error: 'Book not found in rented books' });
	}

	const rentedBook = userData.user.rentedBooks[rentedBookIndex];
	const currentDate = new Date();
	const dueDate = new Date(rentedBook.dueDate); // Retrieve the due date from the book
	const lateFeePerDay = 1; // Define a late fee of $1 per day
	let lateFee = 0;

	if (currentDate > dueDate) {
		const daysLate = Math.ceil((currentDate - dueDate) / (1000 * 60 * 60 * 24)); // Calculate days late
		lateFee = daysLate * lateFeePerDay;
	}

	//Remove the book from rentedBooks
	userData.user.rentedBooks.splice(rentedBookIndex, 1);

	//Add the book back to the inventory
	delete rentedBook.dueDate; //Remove the due date before adding back to inventory
	delete rentedBook.type; //Remove the type before adding back to inventory
	inventory.push(rentedBook);

	fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));
	fs.writeFileSync(inventoryFilePath, JSON.stringify(inventory, null, 2));

	res.json({ message: 'Book returned successfully', lateFee });
});

// Route to delete a book from the inventory
app.delete('/api/inventory/:id', (req, res) => {
	const bookId = req.params.id;
	const inventory = JSON.parse(fs.readFileSync(inventoryFilePath, 'utf8'));

	const bookIndex = inventory.findIndex(book => book.id === bookId);
	if (bookIndex === -1) {
		return res.status(404).json({ error: 'Book not found in inventory' });
	}

	inventory.splice(bookIndex, 1); // Remove the book from the inventory
	fs.writeFileSync(inventoryFilePath, JSON.stringify(inventory, null, 2));
	res.json({ message: 'Book deleted successfully' });
});

// Route to add a new book to the inventory
app.post('/api/inventory', (req, res) => {
	const newBook = req.body;

	if (!newBook.id || !newBook.title || !newBook.author || !newBook.price || !newBook.img || !newBook.genre) {
		return res.status(400).json({ error: 'All book fields (id, title, author, price, img, genre) are required' });
	}

	const inventory = JSON.parse(fs.readFileSync(inventoryFilePath, 'utf8'));
	const bookExists = inventory.some(book => book.id === newBook.id);

	if (bookExists) {
		return res.status(400).json({ error: 'Book with the same ID already exists in inventory' });
	}

	inventory.push(newBook); // Add the new book to the inventory
	fs.writeFileSync(inventoryFilePath, JSON.stringify(inventory, null, 2));
	res.json({ message: 'Book added successfully', book: newBook });
});

// Route to modify an existing book in the inventory
app.put('/api/inventory/:id', (req, res) => {
	const bookId = req.params.id;
	const updatedBook = req.body;

	const inventory = JSON.parse(fs.readFileSync(inventoryFilePath, 'utf8'));
	const bookIndex = inventory.findIndex(book => book.id === bookId);

	if (bookIndex === -1) {
		return res.status(404).json({ error: 'Book not found in inventory' });
	}

	// Update the book details
	inventory[bookIndex] = { ...inventory[bookIndex], ...updatedBook };
	fs.writeFileSync(inventoryFilePath, JSON.stringify(inventory, null, 2));
	res.json({ message: 'Book updated successfully', book: inventory[bookIndex] });
});

//Route to get all books in the inventory
app.get('/api/inventory/books', (req, res) => {
	if (!fs.existsSync(inventoryFilePath)) {
		return res.status(500).json({ error: 'Inventory not initialized' });
	}

	const inventory = JSON.parse(fs.readFileSync(inventoryFilePath, 'utf8'));
	res.json(inventory); //Return every book
});

// Route to get all books by genre
app.get('/api/inventory/genre/:genre', (req, res) => {
	const genre = req.params.genre.toLowerCase();

	if (!fs.existsSync(inventoryFilePath)) {
		return res.status(500).json({ error: 'Inventory not initialized' });
	}

	const inventory = JSON.parse(fs.readFileSync(inventoryFilePath, 'utf8'));
	const booksByGenre = inventory.filter(book => book.genre.toLowerCase() === genre);

	if (booksByGenre.length === 0) {
		return res.status(404).json({ error: `No books found for genre: ${genre}` });
	}

	res.json(booksByGenre);
});

//Initialize inventory on server start (Will only happen the first time the server runs)
initializeInventory()

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

