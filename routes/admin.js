var express = require('express');
var router = express.Router();
var itemHelpers = require('../Helpers/item-helpers');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('admin/home', {admin: true,  title: 'Express' });
});


router.get('/orders', function(req,res,next){

  res.render('admin/all-orders');

})

router.get('/home',function(req,res){
  res.render('admin/home');
})

router.get('/all-items',async function(req,res,next){
  console.log('Before function')

  await itemHelpers.availableItems().then((items)=>{
    //console.log(JSON.stringify(items, null, 2));
    res.render('admin/all-items',{items})
  })

  

  
})

router.get('/add-item',function(req,res,next){
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



router.get('/reports',function(req,res){
  res.render('admin/report');
})

router.get('/login', function(req,res){
  console.log('reach at get.login')
  res.render('admin/login',{showHeader:true})
})

router.get("/signup",function(req,res){
  res.render('admin/sign-up',{showHeader:true})
})



module.exports = router;
