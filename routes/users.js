var express = require('express');
var router = express.Router();


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
      if (login.status) {
          req.session.loggedIn = true;
          req.session.user = { _id: login.userId, name: login.name }; // Assuming login returns userId and name
          res.redirect("/users");
      } else {
          res.render('user/login', { error: 'Invalid email or password' });
      }
  }).catch((error) => {
      console.error('Login error:', error);
      res.status(500).render('user/login', { error: 'An error occurred. Please try again later.' });
  });
});




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

router.get("/cartproducts", verifyLogin, async (req, res) => {
  try {
    console.log("inside the cartproduct")
    let products = await userHelper.getCartProducts(req.session.user._id);
    console.log("total")
    let total = await userHelper.getTotalAmount(req.session.user._id);
    res.render("user/cart", { products, user: req.session.user, total });
  } catch (error) {
    console.error('Error fetching cart products:', error);
    res.status(500).send('Failed to fetch cart products');
  }
});


router.post('/add-to-cart', async (req, res) => {
  console.log('hi')
  const { proId, restaurant, price, userId } = req.body;
  try {
    await userHelper.addToCart(proId, restaurant, price, userId);
    res.json({ message: 'Item added to cart successfully' });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
});


module.exports = router;
