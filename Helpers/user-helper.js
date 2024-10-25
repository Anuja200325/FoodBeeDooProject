const db = require('../mongodb/connection');
const collection = require('../mongodb/collections');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');

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
            resolve(itemsAvailable);
        } catch (error) {
            console.error("Error during aggregation:", error);
            reject(error);
        }
    });
};

const doSignup = (userData) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (userData.password) {
                userData.password = await bcrypt.hash(userData.password, 10);
                let result = await db.get().collection(collection.USER_COLLECTION).insertOne(userData);
                console.log("User inserted successfully:", result);
                resolve(result.insertedId);
            } else {
                console.error('No password provided');
                reject('No password provided');
            }
        } catch (err) {
            console.error('Error during signup:', err);
            reject(err);
        }
    });
};

const doLogin = (userData) => {
    let loginstatus = { status: false, name: null };

    return new Promise(async (resolve, reject) => {
        if (userData && userData.password) {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email });
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log('Login success');
                        loginstatus.status = true;
                        loginstatus.name = user.name;
                        loginstatus._id = user._id;
                        resolve(loginstatus);
                    } else {
                        loginstatus.status = false;
                        resolve(loginstatus);
                    }
                });
            } else {
                reject('User not found');
            }
        } else {
            reject('Invalid user data');
        }
    });
};

const getCartProducts = (userId) => {
  if (!ObjectId.isValid(userId)) {
      console.error("Invalid user ID format.");
      return Promise.reject('Invalid user ID');
  }
  return new Promise(async (resolve, reject) => {
      try {
          // Find the cart for the specified user
          let userCart = await db.get().collection(collection.CART_COLLECTION).find({ user: new ObjectId(userId) }).toArray();
          
          // If the user has items in the cart, return them
          resolve(userCart.length > 0 ? userCart : []);
      } catch (error) {
          console.error("Error fetching cart products:", error);
          reject(error);
      }
  });
};


// In user-helper.js or wherever the addToCart function is defined
const addToCart = (userId, item, resto, price) => {
  console.log('@userHelpers');

  return new Promise(async (resolve, reject) => {
      if (item && userId) {
          try {
              // Check if the item already exists in the user's cart
              const existingCartItem = await db.get().collection(collection.CART_COLLECTION).findOne({
                  user: new ObjectId(userId),
                  food_item: item,
                  restaurant: resto
              });

              if (existingCartItem) {
                  // If the item exists, update the quantity by incrementing it by 1
                  const result = await db.get().collection(collection.CART_COLLECTION).updateOne(
                      { _id: existingCartItem._id },
                      { $inc: { quantity: 1 } }
                  );
                  console.log('Updated quantity for item:', existingCartItem._id);
              } else {
                  // If the item does not exist, insert a new item with quantity set to 1
                  const cart = {
                      user: new ObjectId(userId),
                      food_item: item,
                      restaurant: resto,
                      price: price,
                      quantity: 1
                  };
                  const result = await db.get().collection(collection.CART_COLLECTION).insertOne(cart);
                  console.log('Added new item:', result.insertedId);
              }

              resolve();
          } catch (error) {
              console.error('Error adding to cart:', error);
              reject(error); // Reject the promise with the error
          }
      } else {
          reject(new Error('Item and user ID are required')); // Reject if item or userId is not provided
      }
  });
};




  


const removeFromCart= async (userId, cartId) => {
  try {
      const result = await db.get().collection(collection.CART_COLLECTION).updateOne(
          { user: ObjectId(userId) },
          { $pull: { items: { _id:new ObjectId(cartId) } } }
      );

      if (result.modifiedCount === 0) {
          throw new Error("Failed to remove item from cart");
      }

      console.log(`Item ${cartId} removed from cart for user ${userId}`);
      return { success: true };
  } catch (error) {
      console.error('Error removing item from cart:', error);
      return { success: false, error: 'Could not remove item from cart' };
  }
}

const updateCartQuantity = async (userId, cartId, newQuantity) => {
    try {
        const result = await db.get().collection(collection.CART_COLLECTION).updateOne(
            { user: new ObjectId(userId), _id: new ObjectId(cartId) },  // Match by user and cart item ID
            { $set: { quantity: newQuantity } }  // Update the quantity directly
        );
        
        console.log("Updated Result", result);

        if (result.modifiedCount === 0) {
            throw new Error("Failed to update cart quantity");
        }

        console.log(`Item ${cartId} quantity updated to ${newQuantity} for user ${userId}`);
        return { success: true };
    } catch (error) {
        console.error('Error updating cart quantity:', error);
        return { success: false, error: 'Could not update cart quantity' };
    }
};

const changeQuantity = (body) => {
    console.log('@changeQuantity of UserHelpers');
    console.log('check oncemore req.body', body);

    return new Promise((resolve, reject) => {
        // Convert count to integer
        const count = parseInt(body.count);

        // First, increment or decrement the quantity
        db.get().collection(collection.CART_COLLECTION).updateOne(
            { _id: new ObjectId(body.cartId) }, // Ensure cartId is ObjectId
            { $inc: { quantity: count } } // Increment quantity by the count
        ).then((response) => {
            if (response.modifiedCount > 0) {
                // Fetch the updated cart item to check its quantity
                db.get().collection(collection.CART_COLLECTION).findOne(
                    { _id: new ObjectId(body.cartId) }
                ).then((cartItem) => {
                    if (cartItem && cartItem.quantity <= 0) {
                        // If quantity is zero, remove the product
                        db.get().collection(collection.CART_COLLECTION).deleteOne(
                            { _id: new ObjectId(body.cartId) }
                        ).then(() => {
                            resolve({ removeProduct: true });
                        }).catch((err) => {
                            reject('Error removing product: ' + err);
                        });
                    } else {
                        resolve({ removeProduct: false });
                    }
                }).catch((err) => {
                    reject('Error fetching cart item: ' + err);
                });
            } else {
                reject('Quantity update failed');
            }
        }).catch((err) => {
            reject('Error updating quantity: ' + err);
        });
    });
};

const removeItem=async (cartId) => {
    return new Promise((resolve, reject) => {
        db.get().collection(collection.CART_COLLECTION).deleteOne({ _id:new ObjectId(cartId) }).then((response) => {
            resolve(response);
        }).catch((err) => {
            reject(err);
        });
    });
}

const getTotalAmount = async (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: new ObjectId(userId) }
                },
                {
                    $project: {
                        food_item: 1,
                        restaurant: 1,
                        price: { $toDouble: "$price" }, // Convert the price to a number
                        quantity: 1
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ["$quantity", "$price"] } }
                    }
                }
            ]).toArray();

            resolve(total[0]?.total || 0);
        } catch (error) {
            console.error('Error calculating total:', error);
            reject(error);
        }
    });
};



  

// Export both functions
module.exports = {
    getAggregatedProducts,
    doSignup,
    doLogin,
    getCartProducts,
    addToCart,
    removeFromCart,
    getTotalAmount,
    updateCartQuantity,
    changeQuantity,
    removeItem
    
};
