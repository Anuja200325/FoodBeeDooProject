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

router.get('/sign_up', function(req, res, next) {
  res.render('user/sign_up');
});





router.post("/sign_up", function(req, res) {
  console.log('Session before signup:', req.session);  // Debugging session
  userHelper.doSignup(req.body)
    .then((id) => {
      console.log('doSignup worked');
      console.log(id)
      req.session.loggedIn = true;
      req.session.user = {}; 
      req.session.user._id = id;
      console.log(req.session.user._id)
      //console.log('Session after signup:', req.session);  // Check if session is working
      res.redirect('/users');
    })
    .catch((err) => {
      console.error('Error during signup:', err);
      res.render('user/sign_up', { error: 'Signup failed. Please try again.' });
    });
});



module.exports = router;
