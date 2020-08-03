var express = require('express');
var router = express.Router();
require('../databases/mongoose');


/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {title: 'COM3504 Project'});
});

/**
 * GET: Used to render an image
 */
router.get('/private/images/:userID/:imagePath', function (req, res) {
    let imageType = req.params.imagePath.split('.').pop();
    console.log(imageType);
    res.setHeader('Content-Type', 'image/' + imageType);
    res.send("private/images/" + req.params.userID + "/" + req.params.imagePath);
});

/**
 * Registration page
 */
router.get('/register', (req,res,next)=>{
    res.render('register', {title: 'Register Account'});
});

/**
 * Login page
 */
router.get('/login', (req,res,next)=>{
    res.render('login', {title: 'Login'});
});



/**
 * Routes for mocking data with a JSON file upload (DO NOT DELETE!)
 */
router.get('/mock_data', function (req, res, next) {
    res.render('mock_data', {title:'MOCKING DATA...'});
});

router.post('/mock_data', function(req, req, next) {

})

module.exports = router;
