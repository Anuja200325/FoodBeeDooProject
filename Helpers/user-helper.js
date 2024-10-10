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
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) });
            resolve(userCart ? userCart.product : []);
        } catch (error) {
            console.error("Error fetching cart products:", error);
            reject(error);
        }
    });
};

// In user-helper.js or wherever the addToCart function is defined
const addToCart = (item, resto, price) => {
    console.log('@userHelpers');
  
    const cart = {
      food_item: item,
      restaurant: resto,
      price: price
    };
  
    return new Promise(async (resolve, reject) => {
      if (item) {
        try {
          const result = await db.get().collection(collection.CART_COLLECTION).insertOne(cart);
          console.log('Added:', result.insertedId); // Log the inserted document ID
          resolve();
        } catch (error) {
          console.error('Error adding to cart:', error);
          reject(error); // Reject the promise with the error
        }
      } else {
        reject(new Error('Item is required')); // Reject if item is not provided
      }
    });
  };


function changeQuantity(cartId, proId, userId, count) {
    let quantityElem = document.getElementById(proId);
    let quantity = parseInt(quantityElem.innerHTML);
    count = parseInt(count);

    $.ajax({
        url: '/change-product-quantity',
        data: {
            cart: cartId,
            product: proId,
            user: userId,
            count: count,
            quantity: quantity
        },
        method: 'POST',
        success: (response) => {
            if (response.removeProduct) {
                alert("Product removed from cart");
                document.getElementById(proId).closest('tr').remove();
                document.getElementById('total').innerHTML = response.total;
            } else if (response.status) {
                quantityElem.innerHTML = quantity + count;
                document.getElementById('total').innerHTML = response.total;
            } else {
                alert("Failed to update the cart");
            }
        },
        error: (err) => {
            console.error("AJAX error: ", err);
            alert("Error communicating with the server.");
        }
    });
}
const getTotalAmount = async (userId) => {
    try {
      let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
        {
          $match: { user: new ObjectId(userId) }
        },
        {
          $unwind: '$product'
        },
        {
          $lookup: {
            from: collection.ITEMS_COLLECTION,
            localField: 'product.item',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        {
          $project: {
            quantity: '$product.quantity',
            price: { $arrayElemAt: ['$productDetails.price', 0] }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: { $multiply: ['$quantity', '$price'] } }
          }
        }
      ]).toArray();

      // Return the total amount, if available; otherwise, return 0
      return total.length > 0 ? total[0].totalAmount : 0;
    } catch (error) {
      console.error('Error calculating total amount:', error);
      throw error;
    }
  }


// Export both functions
module.exports = {
    getAggregatedProducts,
    doSignup,
    doLogin,
    getCartProducts,
    addToCart,
    changeQuantity,
    getTotalAmount
};
