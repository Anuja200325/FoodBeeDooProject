var express = require('express');
var router = express.Router();
var itemHelpers = require('../Helpers/item-helpers');
var adminHelpers=require('../Helpers/admin-helpers');


/* GET home page. */
router.get('/', function(req, res, next) {

  res.render('admin/home', {navbarAdmin: true});

 
});

router.use((req, res, next) => {
  res.locals.navbarAdmin = true;  // Automatically set 'admin: true' for all routes
  next();  // Pass to the next middleware/route handler
});


const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}


router.get('/orders', function(req,res,next){

  res.render('admin/all-orders');

})

router.get('/home',function(req,res){
  res.render('admin/home');
})

router.get('/all-items',async function(req,res,next){
  
  console.log('Before function')

  await itemHelpers.availableItems().then((items)=>{
    console.log(JSON.stringify(items, null, 2));
    
    res.render('admin/all-items',{items})
  })

  

  
})

router.get('/add-item',verifyLogin,function(req,res,next){
  //console.log('HI')
  res.render('admin/add-item')
})


router.post('/submit-food',function(req,res,next){

    itemHelpers.addItems(req.body).then((id)=>{
        //console.log('return result')
        //console.log(result)
        if (req.files && req.files.food_image) {
          let image = req.files.food_image;
          image.mv('./public/images/' + id + '.jpg')
        }else{
          console.log('Food item added successfully without image');
        }
      
        res.render('admin/add-item');
})
  
})



router.get('/all-restaurants',(req,res,next)=>{
  //console.log('at get function of all-restaurant')
  itemHelpers.availableRestaurants().then((restaurants)=>{

    //console.log(JSON.stringify(restaurants,null,2))
    res.render('admin/all-restaurants',{restaurants})

  })
  
})



router.get('/reports',verifyLogin,function(req,res){
  res.render('admin/report',{'admin':req.session.user});
})

router.get('/login', function(req,res){
  console.log('reach at get.login')
  res.render('admin/login',{showHeader:true})
})

router.get("/signup",function(req,res){
  res.render('admin/sign-up',{showHeader:true})
})

router.post("/signup", function(req, res) {
  console.log('Session before signup:', req.session);  // Debugging session
  adminHelpers.doSignup(req.body)
    .then((id) => {
      console.log('doSignup worked');
      req.session.loggedIn = true;
      req.session.user.id = id;
      //console.log('Session after signup:', req.session);  // Check if session is working
      res.redirect('/home');
    })
    .catch((err) => {
      console.error('Error during signup:', err);
      res.render('admin/sign-up', { error: 'Signup failed. Please try again.' });
    });
});


router.get('/login',function(req,res){
  if(req.session.loggedIn){
    
    res.redirect('/home')

  }else{
    res.render('/admin/login')
  }
})


router.post('/login',function(req,res){

  console.log(req.body)
  adminHelpers.doLogin(req.body).then((login)=>{
     //console.log('hello',status)
    if(login.status){
      req.session.user=login.name
      res.render('admin/home',{'admin':req.session.user})


    }else{
      res.render('admin/login')
    }
   

  })
  
})

router.get('/logout',function(req,res){
  req.session.destroy()
  res.redirect('/')
})



module.exports = router;
