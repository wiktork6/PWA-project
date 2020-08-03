////////////////// DATABASE //////////////////
let dbPromise;

const MAIN_DB_NAME = 'db_assignment_1';
const STORY_STORE_NAME = 'store_stories';
const USER_STORE_NAME = 'store_users';

/**
 * Initialise the database
 */
function initDatabase(){
    dbPromise = idb.openDb(MAIN_DB_NAME, 4, function (upgradeDb) {
        console.log("[initDatabase] upgrade Callback");
        //1. USER STORE
        if (!upgradeDb.objectStoreNames.contains(USER_STORE_NAME)) {
            let userObjSt = upgradeDb.createObjectStore(USER_STORE_NAME, {keyPath: 'userId', autoIncrement: true});

        }

        //2. STORY STORE
        if (!upgradeDb.objectStoreNames.contains(STORY_STORE_NAME)) {
            let storyObjSt = upgradeDb.createObjectStore(STORY_STORE_NAME, {keyPath: 'storyId', autoIncrement: true});
            storyObjSt.createIndex('userId', 'userId');
            storyObjSt.createIndex('dateTime', 'dateTime', {unique: false, multiEntry: true});
        }

    });
}



// /**
//  * it saves the reactions for a userID in indexedDB
//  * @param userID
//  * @param reactionsObject
//  */
// function storeCachedReactionData(userID, reactionsObject) {
//     if (dbPromise) {
//         dbPromise.then(async db => {
//             var tx = db.transaction(REACTIONS_STORE_NAME, 'readwrite');
//             var store = tx.objectStore(REACTIONS_STORE_NAME);
//             //var index = store.index('userID');
//             var elem = (await store.get(IDBKeyRange.only(userID)));
//             console.log("elemn ");
//             if (elem == null || elem == undefined) elem =[]; else elem = elem.reactions;
//             //console.log("elem: " + JSON.stringify((elem)));
//             var newReactions = await addNewReact(elem, reactionsObject);      // Iterates existing reactions before adding/updating new react
//
//
//             await store.put({userId: userID, reactions: newReactions});
//             return tx.complete;
//         }).then(function () {
//             console.log('added item to the store! ' + JSON.stringify(reactionsObject));
//         }).catch(function (error) {
//             console.log("error catch" + error.message);
//         });
//     }
// }

/**
 * Add a new reaction to the list of reactions for a user
 * Check if the user has already reacted to a story, and if so update the reaction
 * Otherwise add a new reaction
 *
 * @param reaction - list of reaction [{storyID, reaction}, {..},...]
 * @param newReact - the new reaction {storyID, reaction}
 */
function addNewReact(reactions, newReact)
{
    console.log(JSON.stringify(reactions) + "::"+ JSON.stringify(newReact));
    let newR = true;     
  // If user has reacted to story before, update the reaction
  // IF user has not reacted to story before, append to object
    for (var react of reactions)
    {
        console.log('READING' + JSON.stringify(react));
        if (react.storyId == newReact.storyId) {
            react.reaction = newReact.reaction;
            newR = false;
            break;
        }
    }

    if (newR) reactions.push(newReact);
    console.log("NEW REACTS: " + JSON.stringify(reactions));
    return reactions;
}


//USER ----------------------------------------------------
function addCachedUser(userObject){
    console.log('addCachedUser: ' + JSON.stringify(userObject));
    if(dbPromise){
        dbPromise.then(async db => {
            let tx = db.transaction(USER_STORE_NAME, 'readwrite');
            let store = tx.objectStore(USER_STORE_NAME);
            await store.put(userObject);
            return tx.complete;
        }).then(function () {
            console.log('added user to the store!' +  JSON.stringify(userObject));
        }).catch(function (error){
           console.error('[addCachedUser]: ' + error);
        });
    }
    else {
        console.log('[IDB] service is down :/');
    }
}

/**
 * get the user from cache to view their profile
 * @param userId
 * @returns {Promise<T>}
 */
function getCachedUser(userId){
    console.log('uid' + userId);
    if(dbPromise){
        return dbPromise.then(async db =>{
            let tx = db.transaction(USER_STORE_NAME, 'readonly');
            let store = tx.objectStore(USER_STORE_NAME);
            //console.log(userId);
            return store.get(userId);
        }).then(function(userData){
            console.log('u:'+ userData);

            if (userData == null || userData === undefined)
                return;
            else
                return userData;
            // console.log(userData);
        }).catch(function(e){
            console.log('[DB]: ' + e);
        });
    }
    else {
        console.error("dbPromise not available");
    }
}



//STORY ---------------------------------------------------
// Replaces getUserStoriesByDate
// default: returns newest to oldest.
function getCachedStories(userId, date = undefined, newest = true){

    if(dbPromise){
         dbPromise.then(async db => {
             let storyTx = db.transaction(STORY_STORE_NAME, 'readonly');

             let storyStore = storyTx.objectStore(STORY_STORE_NAME); //returns IDBObjectStore
             let storyIndex = storyStore.index('dateTime'); //returns IDBIndex
             let direction = 'prev';

             if (!newest) direction = 'next';
             console.log('dir: ' + direction);
             storyIndex.openCursor(null, direction).then(function cursorIterate(cursor) {
                 //if (cursor) console.log('val: ' + JSON.stringify(cursor.value));
                 if(!cursor) return;
                 //console.log('story: ' + JSON.stringify(cursor.value));
                 //when userId === undefined; used in index wall => addToResults all the stories
                 if(!userId){
                     //getReactionsToStory(cursor.value);
                     addToResults(cursor.value);
                 }
                 else if (cursor.value.userId === userId){
                     //getReactionsToStory(cursor.value);
                     addToResults(cursor.value);
                 }
                 return cursor.continue().then(cursorIterate);
             });
         }).then(function (storyObject) {
             console.log('[getCachedStories] complete:');
         }).catch(function (error){
             console.error('[getCachedStories] ' + error);
         });
    }
}

//gets the date for the last story uploaded. used to get new stories.
function getLastStoryDate(){
    if(dbPromise){
        return dbPromise.then(async db =>  {
            let tx = db.transaction(STORY_STORE_NAME, 'readonly');
            let store = tx.objectStore(STORY_STORE_NAME); //returns IDBObjectStore
            let index = store.index('dateTime');
            let date = index.openCursor(null, 'prev').then((cursor) => {
                if(!cursor) return;
                return cursor.value.dateTime;
            });
            return date;
        }).then(function (dateTime) {
            console.log('[getLastStoryDate] ' + dateTime);
            return dateTime;
        }).catch(function (error){
            console.error('[getLastStoryDate] ' + error);
        });
    }
}


// call when retrieving stories using cache then network
function addCachedStories(storiesArray){
   // console.log('[addCachedStories] ' + JSON.stringify(storiesArray));
    let prop_to_exclude = ["users", "user"];

    if(dbPromise){
        dbPromise.then(async db => {
            let tx = db.transaction(STORY_STORE_NAME, 'readwrite');
            //may receive one story. Ideally, server should always put stories in the array.
            if(!Array.isArray(storiesArray)){
               // tx.objectStore(STORY_STORE_NAME).put(removeProperties(storiesArray, prop_to_exclude));
                tx.objectStore(STORY_STORE_NAME).put(storiesArray);
            }
            else {
                await storiesArray.forEach(story => {
                   // tx.objectStore(STORY_STORE_NAME).put(removeProperties(story, prop_to_exclude));
                    tx.objectStore(STORY_STORE_NAME).put(story);
                });
            }
            return tx.complete;
        }).then(function () {
            console.log('[addCachedStory] complete:');
            // if(Array.isArray(storiesArray)) {
            //     storiesArray.forEach(story => {
            //         console.log(`userId: ${story.userId}; date: ${story.dateTime}`);
            //     });
            // }
            // else
            //     console.log(`userId: ${storiesArray.userId}; date: ${storiesArray.dateTime}`);
        }).catch(function (error){
            console.error('[addCachedStory] ' + error);
        });
    }
    else {
        console.log('[addCachedStory] db service is down :/');
    }
}



//UTILITIES 🧰 ---------------------------------------------------------------
/**
 * the server returns the dateTime in the format DD MM YY HH:MM.
 * Here we find out the Epoch time so to display it to the user, we change format
 * @param datetime
 * @returns {string}
 */
function getDateTime(dateTimeObject){
    var returnString = "";
    var dateTime = new Date(dateTimeObject);
    if (dateTime == null && dateTime === undefined)
        return "unavailable";
    returnString += dateTime.getDate() + " ";
    returnString += getMonthString(dateTime.getMonth()) + " ";
    returnString += dateTime.getFullYear() + " ";
    returnString += dateTime.getHours() + ":";
    returnString += padMinutesInteger(dateTime.getMinutes());
    return returnString;
};

/**
 * Pad the minutes integer from datetime to always be 2 digits
 * If minutes is less than 10, add leading zero to string, else leave
 * @param n - minutes
 */
function padMinutesInteger(n) {
    return (n < 10) ? ("0" + n) : n;
}


/**
 * the server returns the month as a string
 * Change the month from an integer to a string
 * @param monthInt
 * @returns {string}
 */
function getMonthString(monthInt){
    if (monthInt == null && monthInt === undefined)
        return "unavailable";
    switch (monthInt)
    {
        case 0: return "January"; break;
        case 1: return "February"; break;
        case 2: return "March"; break;
        case 3: return "April"; break;
        case 4: return "May"; break;
        case 5: return "June"; break;
        case 6: return "July"; break;
        case 7: return "August"; break;
        case 8: return "September"; break;
        case 9: return "October"; break;
        case 10: return "November"; break;
        case 11: return "December"; break;
    };
};

//used in addCachedStories to remove user data
function removeProperties(object, properties ){
    for(const p of properties){
        delete object[p];
    }
    return object;
}

