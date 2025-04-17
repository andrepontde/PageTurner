const express = require("express");
const axios = require('axios');

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
});

describe("PB02 Test - Browse by title functionality ", () => {

    test("Should retrieve books by title", async () => {
        const mockResponse = await axios.post("http://localhost:3000/api/books/search", {
            title: "The Great Gatsby"
        });
        
        const books = mockResponse.data;
        expect(books.length).toBe(5);
    });

    test("Test route with no title", async () => {
        const mockResponse = await axios.post("http://localhost:3000/api/books/search", {
            title: ""
        });
        
        const books = mockResponse.data;
        expect(books.length).toBe(5);
    });

});

describe("PB03/04/05 Test - Add book to cart/checkout functionality", () => {

    test("Test checkout without items on cart", async () => {
        const mockResponse = await axios.post("http://localhost:3000/api/checkout");
        const books = mockResponse.data;
        expect(books.length).toBe(500);
    });

    test("Should add book to cart", async () => {
        const mockResponse = await axios.post("http://localhost:3000/api/cart", {
            title: "The Great Gatsby"
        });
        const books = mockResponse.data;
        expect(books.length).toBe(5);
    });

});

describe("PB06 Test - Test inventory management", () => {
    
        test("Should retrieve inventory", async () => {
            const mockResponse = await axios.get("http://localhost:3000/api/inventory");
            const books = mockResponse.data;
            expect(books.length).toBe(20);
        });

        // test("Should create a new book in inventory", async () => {
            
        // })
    
        test("should delete a book from inventory", async () => {
            const mockResponse = await axios.delete("http://localhost:3000/api/inventory", 
            { data: { id: "" } });
            const books = mockResponse.data;
            expect(books.length).toBe(19);
        });
});

// {
//     "id": "KVGd-NabpW0C",
//     "title": "The Plague",
//     "author": "Albert Camus",
//     "price": 14,
//     "img": "http://books.google.com/books/content?id=KVGd-NabpW0C&printsec=frontcover&img=1&zoom=1&source=gbs_api",
//     "genre": "fiction"
//   }

describe("PB09 Test -  Test review functionality", () => {

});
