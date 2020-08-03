const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');


// userController.getUser
router.get('/:id', function(req, res, next) {
  if(req.params.id == 'me') return next();

  let _id = req.params.id;


    if (_id == null || _id === undefined)// if user does not exists, throw 404
      res.render('error', {message: '404: User not Found',error:{status: 404, stack:''}});
    else //  user exists, display profile
      res.render('user_profile', {user: {id: _id}});

});

router.post('/getUser/:id', userController.getUser);


//POST request to insert new User
router.post('/insert', userController.insertUser);

//Logout user from all sessions
router.post('/logoutAll', authenticate, userController.logoutUserFromAllSessions);

//Create reaction
router.patch('/reaction', authenticate, userController.addReaction);


//Update reaction
router.patch('/reaction/update', authenticate, userController.updateReaction);

//Remove reaction
router.patch('/reaction/remove', authenticate, userController.removeReaction);


//GET request for list of all users
router.get('/', userController.getUsers);

//PATCH request to update user
//router.patch('/me', authenticate, userController.updateUser);

//DELETE request to delete user
router.delete("/:id/delete", authenticate,userController.deleteUser);

//POST, Authenticate User by email and password(login)
router.post('/login', userController.getUserByCredentials);

//get logged user
router.get('/me', authenticate, function(req, res, next) {
  console.log(req.user.userId);
  res.setHeader('Content-Type', 'application/json');
  res.send({uId: req.user.userId});
});

//Logout user
router.post('/logout', authenticate, userController.logoutUser);

//Logout user from all sessions
router.post('/logoutAll', authenticate, userController.logoutUserFromAllSessions);


//-----------------MOCK DATA
//POST for uploading mock reactions. (multiple at once in format: {userId, [{storyId, reaction}]}
router.post('/mock_reaction', userController.addMultipleReactions);


module.exports = router;
