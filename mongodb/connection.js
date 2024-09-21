const { MongoClient } = require('mongodb');

// Connection URL and Database Name
const url = 'mongodb://localhost:27017'; // Replace with your MongoDB URL
const dbName = 'FoodBeeDoo';

let dbInstance = null;

// Function to connect to MongoDB
async function connect() {
    if (dbInstance) {
        return dbInstance; // Return existing connection if already connected
    }

    const client = new MongoClient(url);
    
    try {
        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB');
        dbInstance = client.db(dbName); // Store the database connection
        return dbInstance;
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        throw err; // Rethrow the error after logging
    }
}

module.exports = { connect };
