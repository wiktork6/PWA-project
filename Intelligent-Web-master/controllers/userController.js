const User = require('../models/user');

/**
 *
 * @param get request
 * @param response with list of all users in the system
 */
exports.getUsers = function(req,res){
    User.find({}).then((users)=>{
        res.send(users);
    }).catch((e)=>{
        res.status(500).send(e);
    });
};

/**
 *
 * @param GET request with logged user
 * @param response with logged user profile
 */
exports.getLoggedUser = function(req,res){
    res.send(req.user);
};

/**
 *
 * @param GET request with logged user
 * @param res
 * @returns
 */
exports.logoutUser = async function(req,res){
    try{
        req.user.tokens = req.user.tokens.filter(({token})=>token !== req.token);
        await req.user.save();

        res.send()
    }catch(e){
        res.status(500).send();
    }
};

/**
 *
 * @param GET req with logged user
 * @param res
 * @returns
 */
exports.logoutUserFromAllSessions = async function(req,res){
    try{
        req.user.tokens = [];
        await req.user.save();
        res.send();
    }catch(e){
        res.send(500).send();
    }
};

/**
 *
 * @param POST request with user JSON object
 * @param res
 * @returns registered user with a token
 */
exports.insertUser = async function(req,res){
    const user = new User(req.body);
    try{
        await user.save();
        const token = await user.generateAuthenticationToken();
        res.status(201).send({user,token});
    }catch(e){
        res.status(400).send(e);
    }
};


/**
 *
 * @param POST request with email and password as fields
 * @param res
 * @returns JSON object of user with generated token
 */
exports.getUserByCredentials = async(req,res) =>{
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthenticationToken();
        res.send({user,token});
    }catch(e){
        res.status(400).send(e);
    }
};


/**
 *
 * @param  PATCH request with json object of user's fields to be updated
 * @param res
 * @returns JSON object with updated user
 */
exports.updateUser = async function(req,res){
    const updates = Object.keys(req.body);
    const allowedUpdates = ['firstname','surname','email','password'];
    const isValidOperation = updates.every(function(update){
        return allowedUpdates.includes(update);
    });

    if(!isValidOperation){
        return res.status(400).send({error:"Invalid updates"})
    }
    try{
        updates.forEach((update)=> req.user[update] = req.body[update]);
        await req.user.save();
        if(!req.user){
            res.status(404).send();
        }
        res.send(req.user);

    }catch(e){
        res.status(400).send(e);

    }
};

/**
 *
 * @param GET request with userId as param
 * @param respons with JSON object of user
 */
exports.getUser = function(req,res){
    const id = req.params.id;
    User.findOne({"userId": id}).then(function(user){
        if(!user){
            return res.status(404).send();
        }

        res.send(user);
    }).catch(function(e){
        res.status(500).send(e);
    });

    // const _id = req.params.id;
    // User.findById(_id).then(function(user){
    //     if(!user){
    //         return res.status(404).send();
    //     }
    //
    //     res.send(user);
    // }).catch(function(e){
    //     res.status(500).send(e);
    // });

};


/**
 *
 * @param delete request with userId as param
 * @param response JSON object of deleted user
 */
exports.deleteUser = function(req,res){
    User.findByIdAndDelete(req.params.id).then(function(user){
        if(!user){
            return res.status(404).send();
        }
        res.send(user);
    }).catch(function(e){
        res.status(500).send(e);
    });
};


/**
 *
 * @param POST request with json object of a reaction
 * @param res
 * @returns user with added new reaction
 */
exports.addReaction = async function(req,res){
    try{
        const ratings = req.body.ratings;
        const storyId = ratings.storyId;
        const userId = req.user.userId;

        let alreadyReacted = false;
        const user = await User.findOne({userId: userId}).then(function (u) {

            for (let r of u.ratings) {
                if (r.storyId == storyId) {
                    alreadyReacted = true;
                    break;
                }
            }
        })

        let userReact;
        if (alreadyReacted) {   // update reaction
            console.log('already reacted');
            userReact = await User.findOneAndUpdate({
                userId
            }, {
                "$set": {
                    "ratings.$[el].rating": req.body.ratings.rating
                }
            }, {
                arrayFilters: [{"el.storyId": req.body.ratings.storyId}],
                new: true
            });
        }
        else {  // else new reaction
            console.log('new reaction');
            userReact = await User.findOneAndUpdate({
                userId,
                'ratings.storyId': {$ne: storyId}
            }, {
                $push: {ratings}
            }, {
                new: true
            });
        }

        if(!userReact){
            return res.status(400).send("No user or rating already added");
        }
        return res.status(200).send(user);
    }catch(e){
        res.status(400).send(e);
    }
};

//Add Reaction
exports.addMultipleReactions = async function(req,res){
    try{
        // const user = await User.find({userId: req.user.userId, 'ratings.storyId': {$ne: req.body.ratings.storyId}});
        const ratings = req.body.ratings;
        //const storyId = ratings.storyId;
        let userId;
        if (req.user == null && req.body.userId != null)
            userId = req.body.userId;
        else
            userId = req.user.userId;
        const user = await User.findOneAndUpdate({
            userId
        }, {
            $set: {
                ratings: ratings
            }
        });

        if(user == null){
            return res.status(400).send("No user or rating already added");
        }
        return res.status(200).send(user);
    }catch(e){
        res.status(400).send(e);
    }
};


/**
 *
 * @param patch request with an json object of updated reaction
 * @param res
 * @returns user with updated reaction
 */
exports.updateReaction = async function(req,res){
    try{
        const userId = req.user.userId;
        const user = await User.findOneAndUpdate({
            userId
            }, {
            "$set": {"ratings.$[el].rating" : req.body.ratings.rating
            }}, {
                arrayFilters: [{"el.storyId":req.body.ratings.storyId}],
                new: true
        });
        return res.status(200).send(user);
    }catch(e){
        return res.status(400).send(e)
    }

};


/**
 *
 * @param delete request with logged user and storyId
 * @param res
 * @returns user with removed reaction
 */
exports.removeReaction = async function(req,res){
    try{
        const user = await User.findOneAndUpdate({
            userId:req.user.userId
        },{
            "$pull":{"ratings":{"storyId":req.body.ratings.storyId}}},
        {new : true});
        return res.status(200).send(user);
    }catch(e){
        return res.status(400).send(e);
    }
};
