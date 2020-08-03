/**
 * called by the HTML onload.
 * Entry point to be called
 */

function initApp(){

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('./service-worker.js')
            .then(function () {
                console.log('Service Worker Registered');
            })
            .catch (function (error){
                console.log('Service Worker NOT Registered '+ error.message);
            });
    }
    else {
        console.error('This browser doesn\'t support service worker :/');
    }
    //check for support
    if ('indexedDB' in window) {
        initDatabase();
    }
    else {
        console.error('This browser doesn\'t support IndexedDB');
    }
    userLoggedIn();
    fetchAndDisplayStories();//retrieveAllStoryData(true); // get newest to oldest
}

/**
 * Initialise a user profile by initialising database, set name element, and add logout button (assuming logged in).
 * @param userID
 */
function initUserProfile(userId){
    initDatabase();
    // Get user profile from cache, then replace empty title with name
    let ajx = $.ajax({
        url: '/users/getUser/' + userId,
        contentType: 'application/json',
        type: 'POST',
    }).then(function (u) {
        if (u != null) {
            let name = u.firstname + " " + u.surname;
            console.log(name);
            document.getElementById('username').textContent = name;
            document.title = name;
        }
        // then either add, or disable logout button.
        if (localStorage.getItem('jwt') == null) disableLogoutButton();
        else addLogoutButton();
        fetchAndDisplayStories(userId, new Date(null)); // fetch new stories for user since 1/1/1970 00:00:00
    });


}

// function cacheThenNetworkGet(url, type, objectId, updateCallback, storeCachedCallback, getCachedCallback) {
//     let networkDataReceived = false;
//     url = `${url}/${objectId}`;
//     startSpinner();
//     //1. get fresh user data from the server.
//     let ajx = $.ajax({
//         url: url,
//         contentType: 'application/json',
//         type: type,
//     })
//         .done(function (objectData) {
//             networkDataReceived = true;
//             updateCallback(objectData);
//             storeCachedCallback(objectData);
//         })
//         .fail(function (xhr) {
//             console.error('[cacheThenNetworkGet]: ' + xhr.status);
//         });
//
//
//     //2. get cached user data
//     getCachedCallback(objectId).then(function (objectData) {
//         if (!objectData) throw Error('item not in the database');
//         return objectData;
//     }).then(function (objectData) {
//         if (!networkDataReceived) { //do not overwrite fresh data (happens when arrives faster)
//             updateCallback(objectData);
//         }
//         //no data in db, last hope - ajax
//     }).catch(function () {
//         return ajx;
//         //server not responding + no data in db
//     }).catch(function (message) {
//         console.log(message);
//         //FINAL
//     }).then(function () {
//         stopSpinner();
//     });
// }

//STORIES ------------------------

//on refresh method in index.ejs
async function displayNewStories() {
    let date = await getLastStoryDate();
    fetchAndDisplayStories(undefined, date);
}


function fetchAndDisplayStories(userId = undefined, date = new Date(null)){
    let url = `/stories/user/${userId}/${date}`;
    if(!userId)
        url = '/stories/'; //all users' stories

    //1. fetch from the network.
    let networkDataReceived = false;
    startSpinner();
    let ajx = $.ajax({
        url: url,
        contentType: 'application/json',
        type: 'GET'
    })
        .done(function (storyArray) {
            if(!Array.isArray(storyArray)){
                console.log("[fetchAndDisplayStories] no new stories");
            }
            else{
                userArraysToObjects(storyArray);
                refreshStoryList();
                networkDataReceived = true;
                //console.log('story' + storyArray);

                if(Array.isArray(storyArray)){
                    storyArray.forEach( story => {
                        //append stories to DOM one by one
                        //console.log(story);
                        addToResults(story);
                    })
                }
                else{console.error('[fetchAndDisplayStories] response is not a story array')}
                // get the reactions to a story!!!!!!
                addCachedStories(storyArray);
            }

        })
        .fail(function (xhr) {

            console.error('[fetchAndDisplayStories]: ' + xhr.status);
        });

    //2. check cache. (and update DOM)
    getCachedStories(userId, date);


}



function addStory(storyObject){
    let networkDataSent = false;
    startSpinner();
    // check authorisation
    console.log(storyObject);
    let ajx = $.ajax({
        url: '/stories/insert',
        data: JSON.stringify(storyObject),
        contentType: 'application/json',
        type: 'POST',
        headers:{
            'Authorization': localStorage.getItem('jwt')
        },
    }).done(function(res){
        console.log('ajax done');
        networkDataSent = true;
        let data = res;
        console.log("[addStory]" + JSON.stringify(data));
        displayPostStatus();

        toggleAddDialog (false);
        //console.log(data.userId);
        console.log('saved: ' + JSON.stringify(data));


        $.ajax({            // get the user's profile info to retrieve their name
            url: '/users/getUser/' + data.userId,
            contentType: 'application/json',
            type: 'POST',
            fail: function(e) {
                console.log(e);
            }
        }).then(function (u) {
            data.user = u;
            addToResults(data, true);
            addCachedStories(data);
        });
    }).fail(function(xhr){

        console.log(xhr.status);
        console.log(xhr.responseText);
    });
    // addToResults(storyObject);
}


//REACTIONS --------------------

function toggleReactionsDialog (visible, storyId) {
    const addDialog =  document.querySelector('.reactions-dialog' + storyId);
    if (visible) {
        addDialog.classList.add('dialog-container--visible');
    } else {
        addDialog.classList.remove('dialog-container--visible');
    }
}

/**
 * React to a story given the story ID and reaction
 * @param storyID the ID of the story the user is reacting to
 * @param reaction The users reaction
 */
function reactToStory(storyId, reaction){
    initDatabase();
    let userId = null;
    $.ajax({
        url: '/users/me',
        headers: { 'Authorization': localStorage.getItem('jwt') },
        success: function(data) {
            console.log('success');
            userId = data.uId;
        }
    }).then(function() {
        if (userId == null) return;
        //var date = new Date().getTime();
        const input = JSON.stringify({ratings: {storyId: storyId, rating: reaction}});
        $.ajax({
            url: '/users/reaction',
            data: input,
            contentType: 'application/json',
            headers: { 'Authorization': localStorage.getItem('jwt') },
            type: 'PATCH',
            success: function (dataR) {
                //storeCachedReactionData(userId, dataR);
                console.log('success' + input);
            },
            // the request to the server has failed. Let's store the data in cache.
            error: function (xhr, status, error) {
                showOfflineWarning();
            },
        });
    });
}


//UI, DOM manipulation -------------------
/**
 * given the Story data returned by the server,
 * it adds a row of Storys to the results div
 * @param dataR the data returned by the server
 * @param newStory; false by default, replace true to prepend the story rather than append it
 */
function addToResults(dataR, newStory = false) {
    if (document.getElementById('results') != null) {
        const card = document.createElement('div');
        // appending a new row
        if (newStory)
            document.getElementById('results').prepend(card);
        else
            document.getElementById('results').appendChild(card);
        // formatting the row by applying css classes
        card.classList.add('card', 'story-card');

        // The author and date elements
        var user_id_div = document.createElement('div');
        user_id_div.classList.add('author');

        let user_link = document.createElement('a');
        user_link.href = '/users/' + dataR.userId;
        if (dataR.user == null || dataR.user === undefined)
            user_link.textContent = dataR.userId;
        else
            user_link.textContent = dataR.user.firstname +" "+ dataR.user.surname;
        user_id_div.appendChild(user_link);
        var date_time_div = document.createElement('div');
        date_time_div.classList.add('date');
        date_time_div.textContent = getDateTime(dataR.dateTime);

        card.appendChild(user_id_div);
        card.appendChild(date_time_div);

        // Story content
        var content_row_div = document.createElement('div');
        content_row_div.classList.add('row', 'content');
        var content_div = document.createElement('div');
        content_div.classList.add('col-xs-12');
        content_div.textContent = (dataR.text);

        content_row_div.appendChild(content_div);
        card.appendChild(content_row_div);

        // Handle story images
        var image_row = document.createElement('div');
        image_row.classList.add('row', 'content');
        let images = [];
        if (dataR.images != null)  images = (dataR.images);
        if (images !== []) {
            for (let i = 0; i < images.length; i ++) {
                let image = images[i];
                //var image_col_div = document.createElement('div');
                //image_col_div.setAttribute('class', 'col-xs-4');
                //image_row.appendChild(image_col_div);
                var imageElem = new Image();//document.createElement('img');
                imageElem.classList.add('story-image');
                image_row.appendChild(imageElem);
                imageElem.src = image;//'data:image/png;base64,' + btoa(dataR.imageOne);
            }

            card.appendChild(image_row)
        }

        // Handle reactions row.
        let reacts_row = document.createElement('div');
        reacts_row.classList.add('row', 'content');
        // Reaction buttons
        [1,2,3,4,5].forEach(function (i)
        {
            let react_div = document.createElement('button');
            react_div.textContent = i;
            react_div.setAttribute('onclick', 'reactToStory("' + dataR.storyId + '",' + i + ')');
            reacts_row.appendChild(react_div);
        });
        let user_reacts = document.createElement('button');
        user_reacts.classList.add('content');
        // Show overall average reaction value, and set up dialog
        user_reacts.setAttribute('id', 'reactionsCount');
        user_reacts.setAttribute('onclick', 'toggleReactionsDialog(true,"' + dataR.storyId + '")');
        if (dataR.reactions != null && dataR.reactions.length > 0) {
            let reactions_dialog_container = document.createElement('div');
            reactions_dialog_container.classList.add('reactions-dialog' + dataR.storyId,'dialog-container');
            let reactions_dialog = document.createElement('div');
            reactions_dialog.classList.add('dialog');
            let reactions_dialog_header = document.createElement('div');
            reactions_dialog_header.classList.add('dialog-title','header');
            reactions_dialog.appendChild(reactions_dialog_header);
            reactions_dialog_container.appendChild(reactions_dialog);
            let reactions_h1 = document.createElement('h1');
            reactions_h1.classList.add('header__title');
            reactions_h1.textContent = 'Reactions';
            reactions_dialog_header.appendChild(reactions_h1);

            let close_button = document.createElement('button');
            close_button.classList.add('headerButton');
            close_button.setAttribute('id', 'butCancel');
            close_button.setAttribute('aria-label', 'Cancel');
            close_button.setAttribute('onclick', 'toggleReactionsDialog(false,"' + dataR.storyId + '")');
            reactions_dialog_header.appendChild(close_button);

            let reactions_dialog_body = document.createElement('div');
            reactions_dialog_body.classList.add('dialog-body', 'reactions-list-body');
            reactions_dialog.appendChild(reactions_dialog_body);

            let reactions_dialog_main = document.createElement('div');
            reactions_dialog_main.classList.add('main');
            reactions_dialog_body.appendChild(reactions_dialog_main);

            let totalRating = 0;
            let numOfRatings = 0;
            // Add each user's reaction and a link to their profile
            for (let r of (dataR.reactions)) {
                totalRating += r.rating;
                numOfRatings += 1;
                let reaction_user_row = document.createElement('div');
                reaction_user_row.classList.add('row', 'content');
                let reaction_user_link = document.createElement('a');

                reaction_user_link.setAttribute('href', '/users/' + r.userId);
                    reaction_user_link.textContent = r.firstname + " " + r.surname;
                    reaction_user_row.appendChild(reaction_user_link);
                    let reaction_user_vote = document.createElement('p');
                    reaction_user_vote.appendChild(reaction_user_link);
                    reaction_user_vote.innerHTML += "\t\t\t " + r.rating;
                    reaction_user_row.appendChild(reaction_user_vote);
                    reactions_dialog_main.appendChild(reaction_user_row);
            }

            // Calculate average reaction score
            let avgReaction = Math.round(((totalRating / numOfRatings) + Number.EPSILON) * 100) / 100;
            user_reacts.textContent = 'Average Reaction: ' + avgReaction;

            reacts_row.appendChild(reactions_dialog_container);
            reacts_row.appendChild(user_reacts);
        }


        card.appendChild(reacts_row);

    }
}


/**
 * it removes all Storys from the result div
 */
function refreshStoryList(){
    if (document.getElementById('results')!=null)
        document.getElementById('results').innerHTML='';
}





function displayPostStatus(){
    console.log('[postStatus] posted');
}


//UTILITIES -----------------------------------------------
function startSpinner(){
    console.log('--spinner on--');
}
function stopSpinner(){
    console.log('--spinner off--');
}

/**
 * When the client gets off-line, it shows an off line warning to the user
 * so that it is clear that the data is stale
 */
window.addEventListener('offline', function(e) {
    // Queue up events for server.
    console.log("You are offline");
    showOfflineWarning();
}, false);

/**
 * When the client gets online, it hides the off line warning
 */
window.addEventListener('online', function(e) {
    // Resync data with server.
    console.log("You are online");
    hideOfflineWarning();

}, false);


//used in fetchAndDisplayStories: transforms users: [{properties}] to user: {properties}
function userArraysToObjects(storiesArray){
    for(let story of storiesArray){
        let userData = story.user[0];
        if(delete story.user){
            story.user = userData;
        }
    }
}

function getRecommendedStories(userId){
    $.ajax({
        url: `/stories/recommended/${userId}`,
        contentType: 'application/json',
        headers: { 'Authorization': localStorage.getItem('jwt') },
        type: 'GET',
        success: function (dataR) {
            console.log(dataR);
            storeCachedReactionData(userId, dataR);
        },
        // the request to the server has failed. Let's store the data in cache.
        error: function (xhr, status, error) {
            showOfflineWarning();
        },
    });
}



//LAB CODE ---------------------------------------------------------------------------
/**
 * Show the offline warning
 */
function showOfflineWarning(){
    if (document.getElementById('offline_div')!=null)
        document.getElementById('offline_div').style.display='block';
}

/**
 * Hide the offline warning
 */
function hideOfflineWarning(){
    if (document.getElementById('offline_div')!=null)
        document.getElementById('offline_div').style.display='none';
}


// EVENT LISTENER FOR SORTING BUTTON
/**
 * On click event listener for sort button. Will toggle between `sort by new` and `sort by recommended`
 */
document.getElementById('butSort').addEventListener('click', function() {

    const sortButton = document.getElementById('butSort');
    console.log(sortButton.textContent);
    if (sortButton.textContent === "New") {
        // change to recommend;
        // call to recommender
        sortButton.textContent = 'Recommended';
    }
    else if (sortButton.textContent === 'Recommended'){
        // sort newest
        sortButton.textContent = 'New';
        fetchAndDisplayStories();
    }
});

