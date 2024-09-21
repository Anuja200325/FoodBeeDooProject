var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('admin/home', {admin: true,  title: 'Express' });
});


router.get('/orders', function(req,res,next){

  res.render('admin/all-orders');

})

router.get('/all-items',function(req,res,next){
  console.log('HII')
  res.render('admin/all-items')
})

router.get('/add-item',function(req,res,next){
  console.log('HI')
  res.render('admin/add-item')
})

module.exports = router;
