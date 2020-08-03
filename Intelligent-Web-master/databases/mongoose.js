const mongoose = require('mongoose');
const connectionURL = 'mongodb://127.0.0.1:27017/intelligent-web-db';
const ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcryptjs');

var MongoClient = require('mongodb').MongoClient;
mongoose.Promise = global.Promise;

// MongoClient.connect(connectionURL, function(err,db){
//     if(err) throw err;
//     console.log("Database created!");
//     db.close();
// });


try{
    connection = mongoose.connect(connectionURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        checkServerIdentity: false,
        useCreateIndex: true
    });
    console.log('connection to mongodb worked');
}catch(e){
    console.log('error in db connection: ' + e.message);
}
