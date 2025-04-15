const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

const userFilePath = path.join(__dirname, 'data', 'user.json');

//Get initial books from Google Books API
app.get('/api/books', async (req, res) => {
  try {
    const response = await axios.get('https://www.googleapis.com/books/v1/volumes?q=subject:fiction&maxResults=30');
    const books = response.data.items.map(item => ({
      id: item.id,
      title: item.volumeInfo.title,
      author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Unknown Author',
      price: Math.floor(Math.random() * 20) + 5, //Mock price
      img: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQv49HCBKpXJUHVHYX9_u7CqQbENtyVx94FA&s'
    }));
    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error.message);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.get('/api/books:genre', async (req, res) => {
    const { genre } = req.params;
    try {
      const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=subject:${genre}&maxResults=20`);
      const books = response.data.items.map(item => ({
        id: item.id,
        title: item.volumeInfo.title,
        author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Unknown Author',
        price: Math.floor(Math.random() * 20) + 5, //Mock price
        img: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQv49HCBKpXJUHVHYX9_u7CqQbENtyVx94FA&s'
      }));
      res.json(books);
    } catch (error) {
      console.error('Error fetching books:', error.message);
      res.status(500).json({ error: 'Failed to fetch books' });
    }
  });

// Search for books by title
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

// Get user data
app.get('/api/user', (req, res) => {
  const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
  res.json(userData);
});

// Add book to cart with type (rent or buy)
app.post('/api/cart', (req, res) => {
  const { book, type } = req.body; // `type` can be 'rent' or 'buy'
  if (!['rent', 'buy'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type. Must be "rent" or "buy".' });
  }

  const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
  book.type = type; // Add type to the book object
  userData.user.cart.push(book);
  fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));
  res.json(userData);
});

// Checkout books (rent or buy)
app.post('/api/checkout', (req, res) => {
  const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
  const currentDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(currentDate.getDate() + 14); //Set due date to 14 days from now

  userData.user.cart.forEach(book => {
    if (book.type === 'rent') {
      book.dueDate = dueDate.toISOString(); //Add due date for rented books
      userData.user.rentedBooks.push(book);
    } else if (book.type === 'buy') {
      userData.user.purchasedBooks = userData.user.purchasedBooks || []; //Initialize purchasedBooks if it doesn't exist
      userData.user.purchasedBooks.push(book);
    }
  });

  userData.user.cart = []; // Clear the cart after checkout
  fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));
  res.json(userData);
});

// Return books with late fee calculation
app.post('/api/returns', (req, res) => {
  const { bookId } = req.body;
  const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));

  const rentedBook = userData.user.rentedBooks.find(book => book.id === bookId);
  if (!rentedBook) {
    return res.status(404).json({ error: 'Book not found in rented books' });
  }

  const currentDate = new Date();
  const dueDate = new Date(rentedBook.dueDate); //Retrieve the due date from the book
  const lateFeePerDay = 1; //Define a late fee of $1 per day
  let lateFee = 0;

  if (currentDate > dueDate) {
    const daysLate = Math.ceil((currentDate - dueDate) / (1000 * 60 * 60 * 24)); // Calculate days late
    lateFee = daysLate * lateFeePerDay;
  }

  // Remove the book from rentedBooks
  userData.user.rentedBooks = userData.user.rentedBooks.filter(book => book.id !== bookId);
  fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));

  res.json({ message: 'Book returned successfully', lateFee });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
