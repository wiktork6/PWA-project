var express = require('express');
var router = express.Router();

const storyController = require('../controllers/storyController');
const authenticate = require('../middleware/authenticate');
require('../databases/mongoose');

//PATCH request to update story
router.patch('/:id/update', authenticate, storyController.updateStory);

//GET request for one story
router.get('/:storyId', storyController.getStory);

//POST request to insert new story
router.post('/insert', authenticate, storyController.insertStory);


//GET request for list of all stories
router.get('/', storyController.getStories);

//GET request for list of all  MY(logged user) stories
router.get('/my', authenticate, storyController.getLoggedUserStories);

//GET request for list of specific user stories
router.get('/user/:userId/:date', storyController.getUserStories);

//DELETE request to delete story
router.delete("/:id/delete", authenticate, storyController.deleteStory);


//GET recommended stories by userId.
router.get('/recommended/:userId', authenticate, storyController.getRecommendedStories);

//TODO: remove?
router.post('/react_to_post', function(req, res, next) {
    const reaction = new Reaction(req.body.storyId, req.body.reaction);
    res.send(reaction);
});

//POST request to insert new story (for mock data)
router.post('/mock_insert', storyController.insertStory);


module.exports = router;
