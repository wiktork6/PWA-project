const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Story = new Schema({
    userId:{
        type: String,
        required: true,
        // ref: 'User'
    },
    storyId:{
        type: String,
        required: true,
        unique: true,
        default: generateId
    },
    text:{
        type:String,
        required:true,
    },
    dateTime:{
        type: Date,
        required: true,
        default: Date.now
    },
    images:[{
        type:String
    }]
}, {toObject:{virtuals:true}, toJSON:{virtuals:true}});

function getDateWithoutTime(){

    var today = new Date();
    today.setUTCHours(0,0,0,0);
    return today;
}

function generateId(length = 10) {
    var id = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        id += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return id;
}

Story.pre('save', function(next){
    now = new Date();
    this.date = now;
    next();
});

Story.virtual('user', {
    ref:'User',
    localField:'userId',
    foreignField:'userId'
});

const storyModel = mongoose.model('Story', Story);



module.exports=storyModel;