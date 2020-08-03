const jwt = require('jsonwebtoken');
const User = require('../models/user');
const UserManager = require('../public/scripts/userManager.js');
const authenticate = async(req,res,next) =>{
    try{
        const token = req.header('Authorization').replace('Bearer ','');
        const decodedToken = jwt.verify(token, 'secret');
        const user = await User.findOne({_id:decodedToken._id, 'tokens.token':token});
        if(!user){
            throw new Error();
        }
        req.token = token;
        req.user = user;
        next();
    }catch(e){
        console.log(e.message);
        res.send(401).status({error: e.message});
        //req.user = null;
    }
};

module.exports = authenticate;