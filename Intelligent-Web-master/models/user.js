const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const User = new Schema({
    userId:{
        type:String,
        default: generateId
    },
    firstname:{
        type:String,
        required:true,
        trim:true,
        max:[50, 'Too long name']
    },
    surname:{
        type:String,
        required:true,
        trim:true,
        max:[50, 'Too long surname']
    },
    email:{
        type:String,
        unique:true,
        required: true,
        trim:true,
        lowercase:true,
        min: [5, "Email has to be at least 5 characters long"],
        max:[50, 'Too long email']
    },
    password:{
        type:String,
        required:true,
        trim:true,
        min: [5, "Password has to be at least 5 characters long"],
        max:[50, 'Too long password']
    },
    ratings:[{
        storyId:{
            type:String,
            ref:'Story'
        },
        rating:{
            type:Number,
            required:true,
            max:5,
            min:1
        }
    }],
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
});


function generateId(length = 10) {
    var id = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        id += characters.charAt(Math.floor(Math.random() * charactersLength));
        console.log(id);
    }
    return id;
}

User.statics.findByCredentials = async (email, password)=>{
    const user = await userModel.findOne({email: email});

    if(!user){
        throw new Error('Unable to log in');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        throw new Error('Unable to log in');
    }
    return user;
};
//Return user without private data
User.methods.toJSON = function(){
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.tokens;
    return userObject;
};

User.methods.generateAuthenticationToken = async function (){
    const user = this;
    const token = jwt.sign({_id:user._id.toString()}, 'secret');


    user.tokens = user.tokens.concat({token:token});

    await user.save();
    return token;
};



//Hash plain text password
User.pre('save', async function(next){
    const user = this;

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});
const userModel = mongoose.model('User', User);

User.virtual('stories', {
    ref:'Story',
    localField:'storyId',
    foreignField:'storyId'
});

module.exports=userModel;