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
    },

    availableRestaurants: () => {
        return new Promise(async (resolve, reject) => {
            let restaurantAvailable = await db.get().collection(collection.ITEMS_COLLECTION).aggregate([
                {
                    $group: {
                        _id: "$restaurant",  // Group by the actual restaurant field
                        foodItems: {
                            $push: {
                                foodItem: "$food_item",  // Food items under each restaurant
                                price: "$price"  // Corresponding price
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,  // Exclude the `_id` field
                        restaurant: "$_id",  // Map the grouped `_id` (which is the restaurant name) to `restaurant`
                        foodItems: 1  // Keep the `foodItems` as is
                    }
                }
            ]).toArray();
    
            console.log("Aggregation ended");
            resolve(restaurantAvailable);
        });
    }
    
    
};
