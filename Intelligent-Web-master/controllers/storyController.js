const Story = require('../models/story');
const User = require('../models/user');
const Ranking= require('../recommendations/Ranking');

const fs = require('fs');


/**
 * Display List of all stories with their reactions and author
 * @param get req
 * @param res
 * @returns json object with stories and reactions
 */
exports.getStories = async function(req,res){
    try{
        const stories = await Story.find({}).populate('user',['firstname','surname','email', 'userId']).lean().sort('-dateTime');
        for ( const story of stories) {
            const reactions = await getReactionsForStoryId(story.storyId);
            story.reactions=reactions;
        }
        return res.send(stories);
    }catch(e){
        console.log(e);
        return res.status(500).send(e);
    }
};


/**
 *
 * @param post req with JSON object of a new story
 * @param res
 * @returns inserted story
 */
exports.insertStory = async function(req,res) {
    if(req.body==null){
        res.status(403).send("No data sent");
    }

    let dateTime = req.body.dateTime;
    let userId = req.body.userId;
    let content = req.body.content;
    let images = saveImages(req.body.images, userId, dateTime);
    console.log(req.body);
    let story;
    if (req.body.storyId !== undefined) {
        story = new Story({
            storyId: req.body.storyId,
            userId: userId,
            dateTime: dateTime,
            text: content,
            images: images
        });
    }
    else{
        story = new Story({

            userId: userId,
            dateTime: dateTime,
            text: content,
            images: images
        });
    }
    console.log(story);
    try{
        await story.save();
        res.setHeader('Content-Type', 'application/json');
        res.send(story);
    }catch(e){
        res.status(400).send(e);
    }

};

function saveImages(images, userId, dateTime){
    let imgPathArray = [];
    if (images != null && images.length > 0) {
        const targetDirectory = '/private/images/' + userId + '/';
        console.log("t: " + targetDirectory);
        if (!fs.existsSync(process.cwd() + targetDirectory)) {
            fs.mkdirSync(process.cwd() + targetDirectory);
        }
        for (let i = 0; i < images.length; i ++) {
            //await storiesJS.saveImage(images[i], targetDirectory, userID, dateTime);
            let newString = dateTime + '_' + userId + '_' + i;
            console.log(`saving file ${targetDirectory}${newString}`);

            // strip off the data: url prefix to get just the base64-encoded bytes
            let imageBlob = images[i].replace(/^data:image\/\w+;base64,/, "");
            let buf = new Buffer(imageBlob, 'base64');
            fs.writeFile(process.cwd() + targetDirectory + newString + '.png', buf, (err) => {
                if (err) throw err;
                console.log('Image Saved!');
            });
            let filePath = targetDirectory + newString + '.png';
            console.log('file saved!');
            imgPathArray.push(filePath);
        }
    }
    return imgPathArray;
}


/**
 *
 * @param Patch request with json object of updated fields
 * @param res
 * @returns edited story
 */
exports.updateStory = async function(req,res){
    const updates = Object.keys(req.body);
    const allowedUpdates = ['content', 'images'];
    const isValidOperation = updates.every(function(update){
        return allowedUpdates.includes(update);
    });

    if(!isValidOperation){
        return res.status(400).send({error:"Invalid updates"})
    }
    try{
        const story = await Story.findOne({storyId: req.params.id, userID: req.user.userId});
        if(!story){
            res.status(404).send();
        }
        updates.forEach((update) => story[update] = req.body[update]);
        await story.save();
        res.send(story);
    }catch(e){
        res.status(400).send(e);
    }
};

/**
 *
 * @param get req with storyId in param
 * @param res
 */
exports.getStory = function(req,res){
    const id = req.params.storyId;
    Story.findOne({"storyId": id}).then(function(story){
        if(!story){
            return res.status(404).send();
        }
        res.send(story);
    }).catch(function(e){
        res.status(500).send(e);
    });
};


/**
 *
 * @param get req
 * @param res
 * @returns json object of a user's stories
 */
exports.getLoggedUserStories = async function(req,res){
    try{
        await req.user.populate('stories').execPopulate();
        res.send(req.user.stories)
    }catch(e){
        res.status(500).send(e);
    }

};


/**
 *
 * @param GET req with userId and date as param
 * @param res
 * @returns all user's stories from specified date to current date
 */
exports.getUserStories = async function(req,res){
    try{
        var today = new Date();
        today.setHours( today.getHours() + 2 );
        today.setUTCHours(23,59,59,0);
        const stories = await Story.find({$and:[{userId: req.params.userId, dateTime: { $gte: req.params.date, $lte: today} }]}).populate('user');
        res.send(stories);
    }catch(e){
        console.log(e);
        res.status(500).send(e);
    }
};

/**
 *
 * @param delete req with storyId in param and json user object
 * @param res
 * @returns deleted story
 */
exports.deleteStory = async function(req,res){
    try{
        const story = await Story.findOneAndDelete({storyId: req.params.id, userID: req.user.userId});
        if(!story){
            res.status(404).send()
        }
        res.send(story)
    }catch(e){
        res.status(500).send();
    }
};

/**
 * Attempt a recommender algorithm
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
exports.getRecommendedStories = async function(req, res){
    //1. get all users ( {userId, .... , ratings: [{storyId, rating}] } )
    //2. transform to format {userId: [ {storyId, rating} ] }
    //3. run recommender
    //4. get all stories from [{storyId, score}]
    let userId = req.params.userId;
    try{
        //0. setup
        if(!userId){
            res.status(400).send()
        }
        let ranking = new Ranking();

        //1. get all users ( {userId, .... , ratings: [{storyId, rating}] )
        User.find({}).lean().then((users)=>{
            //2. transform to format {userId: [ {storyId, rating} ] }
            let formated_users = usersToRankingFormat(users);
            // let formated_users = usersToRankingFormat(users);

            let results = ranking.getRecommendations(formated_users, userId);
        }).catch((e)=>{
            res.status(500).send(e);
        });

        res.status(200).send();
    }catch(e){
        res.status(500).send();
    }
};

// function usersToRankingFormat(userArray) {
//     let users = [];
//     for (let u of userArray) {
//         let user_obj = {};
//         user_obj[u.userId] = u.ratings;
//         users.push(user_obj);
//     }
//
//     return users;
// }

/**
 * Convert users to ranking format needed
 * @param userArray
 * @returns {{}}
 */
function usersToRankingFormat(userArray){
    let users = {};
    for(let u of userArray){
        users[u.userId] = ratingsToFormat(u.ratings);
    }
    return users;
}

function ratingsToFormat(ratings){
    let formatted = [];
    if(ratings.length > 0){

        for(let r of ratings){
            let rating = {};
            rating[r.storyId] = r.rating;
            formatted.push(rating);
        }

        return formatted;
    }
    return formatted;


}

/**
 * Get reactions to a story
 * @param req
 * @param res
 * @returns {Promise<*>}
 */
exports.getReactions = async function(req,res){
    try{
        const usersWithReactions = await User.find({'ratings.storyId': req.params.storyId}).select({ratings: {$elemMatch: {storyId: req.params.storyId}}}).select('firstname surname email userId');
        if(!usersWithReactions){
            return res.status(404).send()
        }
        return res.status(200).send(usersWithReactions)
    }catch(e){
        return res.status(400).send(e);
    }
};

/**
 *
 * @param storyId
 * @returns JSON object with ratings of a specific story
 */
async function getReactionsForStoryId(storyId){
    const usersWithReactions = await User.find({'ratings.storyId': storyId}).select({ ratings: {$elemMatch: {storyId}}}).select('firstname surname userId');
    return usersWithReactions.map(({firstname, surname, userId, ratings: [{rating}]}) => ({firstname, surname, userId, rating}));
}
