const mongoClient = require('mongodb').MongoClient;

const state = {
  db: null
};

module.exports.connect = function() {
  const url = 'mongodb://localhost:27017';
  const dbname = 'FoodBeeDoo';

  return new Promise((resolve, reject) => {
    mongoClient.connect(url)
      .then(client => {
        state.db = client.db(dbname);
        console.log("Connected successfully to the database:", dbname);
        resolve();
      })
      .catch(err => {
        console.error("Error occurred during the database connection:", err);
        reject(err);
      });
  });
};

module.exports.get = function() {
  if (!state.db) {
    console.error("Database connection not established yet.");
  }
  return state.db;
};
