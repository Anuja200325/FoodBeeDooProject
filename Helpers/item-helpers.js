const db = require('../mongodb/connection');
const collection = require('../mongodb/collections');

module.exports = {
    // Adding items function remains the same
    addItems: (item) => {
        console.log('got here');
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ITEMS_COLLECTION).insertOne(item)
                .then((result) => {
                    resolve(result.insertedId);
                })
                .catch((error) => {
                    reject(error); // Handle errors here
                });
        });
    },

    // Fetch available food items with aggregation
    availableItems: () => {
        console.log('In The Function');
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
                ]).toArray();  // No callback needed, toArray() returns a promise
    
                console.log('Aggragate Function Ended ');
                resolve(itemsAvailable);  // Resolve with the aggregated data
    
            } catch (error) {
                console.error("Error during aggregation:", error);
                reject(error);  // Reject if there's any error
            }
        });
    }
    
};
