var express = require('express');
var router = express.Router();
const { ObjectId } = require('mongodb');


const userHelper = require('../Helpers/user-helper'); // Ensure you have the correct path


const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/users/login')
  }
}




// Route to display the food items
router.get('/', async function(req, res, next) {
  try {
    const items = await userHelper.getAggregatedProducts(); // Call the new function
    res.render('user/view_products', { items,navbarAdmin:false ,showHeader:true}); // Pass items to the view
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).send('Failed to fetch items');
  }
});

router.get('/login', function(req, res, next) {
  res.render('user/login',{showHeader:false});
});

router.post('/login', function(req, res) {
  userHelper.doLogin(req.body).then((login) => {
    console.log('Login response:', login);
      if (login.status) {
          req.session.loggedIn = true;
          req.session.user = { _id: login._id, name: login.name }; // Assuming login returns userId and name
          res.redirect("/users");
      } else {
          res.render('user/login', { error: 'Invalid email or password' });
      }
  }).catch((error) => {
      console.error('Login error:', error);
      res.status(500).render('user/login', { error: 'An error occurred. Please try again later.' });
  });
});

router.get('/logout',function(req,res){
  req.session.destroy()
  res.redirect('/users')
})



router.get('/sign_up', function(req, res, next) {
  res.render('user/sign_up');
});








router.post("/sign_up", function(req, res) {
  console.log('Session before signup:', req.session);  // Debugging session
  userHelper.doSignup(req.body)
    .then((id) => {
      console.log('doSignup worked');
      console.log(id);
      
      // Set up session with loggedIn and user details
      req.session.loggedIn = true;
      req.session.user = {
        _id: id,
        name: req.body.name // Assuming you have a 'name' field in req.body for the user name
      };
      
      console.log('Session after signup:', req.session);  // Check if session is working
      res.redirect('/users');
    })
    .catch((err) => {
      console.error('Error during signup:', err);
      res.render('user/sign_up', { error: 'Signup failed. Please try again.' });
    });
});

router.get("/cartPage",async (req, res) => {
  console.log("userID");
  console.log(req.session.user._id)
  let products=await userHelper.getCartProducts(req.session.user._id)
  console.log(products)
  res.render("user/cart",{products,'user':req.session.user._id,navbarAdmin:false})
})


router.post('/cart',verifyLogin, async (req, res) => {
  console.log('Received a POST request to cart', req.body);
  const userId=req.session.user._id
  const { food_item, restaurant, price } = req.body;
  try {
      await userHelper.addToCart(userId,food_item, restaurant, price); // Ensure addToCart is properly defined in userHelper
      res.json({ success: true });
  } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
});


router.post('/change-product-quantity', async (req, res) => {
  console.log(req.body)
  
  try {
    const { cart, quantity, user, count } = req.body;
    const userId = new ObjectId(user._id || user)
    console.log(userId)
    // Parse values to ensure they are numbers
    const cartId = cart;
    const change = parseInt(count,10);
    const currentQuantity = parseInt(quantity,10);

    // Calculate the new quantity
    const newQuantity = currentQuantity + change;

    if (newQuantity < 1) {
      // Remove item if quantity is less than 1
      await userHelper.removeFromCart(userId, cartId);
      
      return res.json({ removeProduct: true});
    } else {
      // Update the quantity in the cart
      await userHelper.updateCartQuantity(new ObjectId(user), cartId, newQuantity);

     
      return res.json({ status: true });
    }
  } catch (error) {
    console.error('Error changing product quantity:', error);
    res.status(500).json({ success: false, message: 'Failed to change quantity' });
  }
});








module.exports = router;
