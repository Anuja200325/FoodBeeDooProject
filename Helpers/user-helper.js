const db = require('../mongodb/connection');
const collection = require('../mongodb/collections');
const bcrypt = require('bcrypt');

// Function to fetch products from the database
const getAggregatedProducts = () => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("In Promise function");

      let itemsAvailable = await db.get().collection(collection.ITEMS_COLLECTION).aggregate([
        {
          $group: {
            _id: "$food_item",
            restaurants: {
              $push: {
                restaurant: "$restaurant",
                price: "$price"
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            food_item: "$_id",
            restaurants: 1
          }
        }
      ]).toArray();

      console.log('Aggregate Function Ended');
      resolve(itemsAvailable);  // Resolve with the aggregated data

    } catch (error) {
      console.error("Error during aggregation:", error);
      reject(error);  // Reject if there's any error
    }
  });
};

const doSignup = (userData) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
        let result = await db.get().collection(collection.USER_COLLECTION).insertOne(userData);
        console.log("User inserted successfully:", result);  // Log the result
        resolve(result.insertedId);
      } else {
        console.error('No password provided');
        reject('No password provided');
      }
    } catch (err) {
      console.error('Error during signup:', err);
      reject(err);  // Log any errors that occur
    }
  });
};

// Export both functions
module.exports = {
  getAggregatedProducts,
  doSignup
};
