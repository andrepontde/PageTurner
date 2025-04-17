const express = require("express");
const axios = require('axios');
const e = require("express");

const app = express();
app.use(express.json());

describe("PB01 Test -  Browse functionality ", () => {

    test("Should retrieve 20 book objects", async () => {
        const mockResponse = await axios.get("http://localhost:3000/api/books");
        const books = mockResponse.data;
        expect(books.length).toBe(20);
    });

    test("Should retrieve books by genre", async () => {
        const mockResponse = await axios.get("http://localhost:3000/api/inventory/genre/Fiction");
        const books = mockResponse.data;
        expect(books.length).toBeGreaterThan(0);
    });

    //No furhter tests needed, no arguments are taken for this routes
});

describe("PB02 Test - Browse by title functionality ", () => {

    test("Should retrieve books by title", async () => {
        const mockResponse = await axios.post("http://localhost:3000/api/books/search", {
            title: "The Great Gatsby"
        });

        const books = mockResponse.data;
        expect(books.length).toBe(5);
    });

    test("Test route with no title body", async () => {
        try {
            const mockResponse = await axios.post("http://localhost:3000/api/books/search");
        } catch (error) {
            expect(error.response.status).toBe(500);
        }
    });

    test("Test route with no title content", async () => {
        try {
            const mockResponse = await axios.post("http://localhost:3000/api/books/search", {
                title: ""
            });
        } catch (error) {
            expect(error.response.status).toBe(400);
        }
    });

});

describe("PB03/04/05 Test - Add book to cart/checkout functionality", () => {
    let testBook;

    beforeAll(async () => {
        // Create a test book in the inventory
        testBook = {
            id: "test123",
            title: "Test Book",
            author: "Test Author",
            price: 10,
            img: "http://example.com/test.jpg",
            genre: "fiction"
        };
        await axios.post("http://localhost:3000/api/inventory", testBook);
    });

    afterAll(async () => {
        // Clean up the test book from the inventory if it exists
        try {
            await axios.delete("http://localhost:3000/api/inventory/test123");
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.warn("Test book not found in inventory during cleanup.");
            } else {
                throw error; // Re-throw other errors
            }
        }
    });

    test("Should add a book to the cart for purchase", async () => {
        const mockResponse = await axios.post("http://localhost:3000/api/cart", {
            book: testBook,
            type: "buy"
        });

        expect(mockResponse.status).toBe(200);
        expect(mockResponse.data.user.cart).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: testBook.id, type: "buy" })
            ])
        );
    });

    test("Should add a book to the cart for rent", async () => {
        const mockResponse = await axios.post("http://localhost:3000/api/cart", {
            book: testBook,
            type: "rent"
        });

        expect(mockResponse.status).toBe(200);
        expect(mockResponse.data.user.cart).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: testBook.id, type: "rent" })
            ])
        );
    });

    test("Should fail to add a book to the cart with an invalid type", async () => {
        try {
            await axios.post("http://localhost:3000/api/cart", {
                book: testBook,
                type: "invalidType"
            });
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data.error).toBe('Invalid type. Must be "rent" or "buy".');
        }
    });

    test("Should checkout books in the cart", async () => {
        // Add a book to the cart for purchase
        await axios.post("http://localhost:3000/api/cart", {
            book: testBook,
            type: "buy"
        });

        const mockResponse = await axios.post("http://localhost:3000/api/checkout");

        expect(mockResponse.status).toBe(200);
        expect(mockResponse.data.user.cart).toHaveLength(0); // Cart should be empty after checkout
        expect(mockResponse.data.user.purchasedBooks).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: testBook.id })
            ])
        );
    });

    test("Should fail to checkout with an empty cart", async () => {
        try {
            await axios.post("http://localhost:3000/api/checkout");
        } catch (error) {
            expect(error.response.status).toBe(500);
            expect(error.response.data.error).toBe("Cart is empty. Nothing to checkout.");
        }
    });
});

describe("PB06 Test - Test inventory management", () => {

    test("Should retrieve inventory", async () => {
        const mockResponse = await axios.get("http://localhost:3000/api/inventory/books");
        const books = mockResponse.data;
        expect(books.length).toBeGreaterThan(20);
    });

    test("Should create a new book in inventory", async () => {
        const newBook = {
            id: "123456",
            title: "The Unit Test",
            author: "André Pont",
            price: 12,
            img: "http://books.google.com/books/content?id=KVGd-NabpW0C&printsec=frontcover&img=1&zoom=1&source=gbs_api",
            genre: "fiction"
        };
        const mockResponse = await fetch('http://localhost:3000/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBook)
        });

        const responseData = await mockResponse.json(); // Parse the response JSON
        expect(responseData).toHaveProperty('message', "Book added successfully"); // Validate the message
    });

    test("Test book creation without full data", async () => {
        try {
            const newBook = {

                title: "The Unit Test",
                author: "André Pont",

                img: "http://books.google.com/books/content?id=KVGd-NabpW0C&printsec=frontcover&img=1&zoom=1&source=gbs_api",
                genre: "fiction"
            }
            await fetch('http://localhost:3000/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBook)
            });
        } catch (error) {
            expect(error.response.status).toBe(400);
        }
    });

    test("Test book creation with existing bookID", async () => {
        try {
            const newBook = {
                id: "123456",
                title: "The Unit Test",
                author: "André Pont",
                price: 12,
                img: "http://books.google.com/books/content?id=KVGd-NabpW0C&printsec=frontcover&img=1&zoom=1&source=gbs_api",
                genre: "fiction"
            }
            await fetch('http://localhost:3000/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBook)
            });
        } catch (error) {
            expect(error.response.status).toBe(400);
        }
    });


    test("Should modify a book in inventory", async () => {
        const editedBook = {
            id: "123456",
            title: "The Unit Test Edited",
            author: "André Pont",
            price: 12,
            img: "http://books.google.com/books/content?id=KVGd-NabpW0C&printsec=frontcover&img=1&zoom=1&source=gbs_api",
            genre: "fiction"
        };
        const mockResponse = await fetch('http://localhost:3000/api/inventory/123456', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editedBook)
        });

        const responseData = await mockResponse.json(); // Parse the response JSON
        expect(mockResponse.status).toBe(200); // Validate the status code
        expect(responseData).toHaveProperty('message', "Book updated successfully"); // Validate the message
    });

    test("Test update book without valid bookID", async () => {
        const editedBook = {
            id: "123456",
            title: "The Unit Test Edited",
            author: "André Pont",
            price: 12,
            img: "http://books.google.com/books/content?id=KVGd-NabpW0C&printsec=frontcover&img=1&zoom=1&source=gbs_api",
            genre: "fiction"
        }
        const mockResponse = await fetch('http://localhost:3000/api/inventory/:123', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editedBook)
        });

        expect(mockResponse.status).toBe(404);
    });

    test("should delete a book from inventory", async () => {
        const mockResponse = await axios.delete("http://localhost:3000/api/inventory/123456");

        expect(mockResponse.data).toHaveProperty('message', "Book deleted successfully");
    });

    test("Test book deletion without id", async () => {
        try {
            await axios.delete("http://localhost:3000/api/inventory", { data: {} });
        } catch (error) {
            expect(error.response.status).toBe(404);
        }
    });
});



describe("PB09 Test - Test review functionality", () => {
    let testBook;

    beforeAll(async () => {
        // Create a test book in the inventory
        testBook = {
            id: "reviewTest123",
            title: "Review Test Book",
            author: "Test Author",
            price: 15,
            img: "http://example.com/review-test.jpg",
            genre: "fiction"
        };
        await axios.post("http://localhost:3000/api/inventory", testBook);

        // Add the book to the user's purchased books
        await axios.post("http://localhost:3000/api/cart", { book: testBook, type: "buy" });
        await axios.post("http://localhost:3000/api/checkout");
    });

    afterAll(async () => {
        // Clean up the test book from the inventory
        try {
            await axios.delete("http://localhost:3000/api/inventory/reviewTest123");
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.warn("Test book not found during cleanup.");
            } else {
                throw error; // Re-throw other errors
            }
        }
    });

    test("Should add a review to a purchased book", async () => {
        const mockResponse = await axios.put("http://localhost:3000/api/user/review", {
            bookId: testBook.id,
            review: "This is a great book!"
        });

        expect(mockResponse.status).toBe(200);
        expect(mockResponse.data).toHaveProperty("message", "Review added/updated successfully");
        expect(mockResponse.data.book).toHaveProperty("review", "This is a great book!");
    });

    test("Should update an existing review for a purchased book", async () => {
        const mockResponse = await axios.put("http://localhost:3000/api/user/review", {
            bookId: testBook.id,
            review: "This is an updated review."
        });

        expect(mockResponse.status).toBe(200);
        expect(mockResponse.data).toHaveProperty("message", "Review added/updated successfully");
        expect(mockResponse.data.book).toHaveProperty("review", "This is an updated review.");
    });

    test("Should fail to add a review for a non-existent book", async () => {
        try {
            await axios.put("http://localhost:3000/api/user/review", {
                bookId: "nonExistentBook123",
                review: "This book does not exist."
            });
        } catch (error) {
            expect(error.response.status).toBe(404);
            expect(error.response.data).toHaveProperty("error", "Book not found in user data");
        }
    });

    test("Should fail to add a review without bookId or review", async () => {
        try {
            await axios.put("http://localhost:3000/api/user/review", {
                review: "Missing bookId"
            });
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data).toHaveProperty("error", "Book ID and review are required");
        }

        try {
            await axios.put("http://localhost:3000/api/user/review", {
                bookId: testBook.id
            });
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data).toHaveProperty("error", "Book ID and review are required");
        }
    });
});
