/**
 * Used to upload a json file containing mock data of the format:
 * [{userId: userId, ratings: [{storyId: storyId, vote: vote}]}], [userId: userId, storyId: storyId, text: text]
 */
function mockDataUpload() {
        // close the upload dialog and initialise the database.
        toggleUploadDialog(false);
        document.getElementById('data_message').textContent = "Please Wait While Data is Uploaded...";
        //initDatabase();

        // get the file contents from the fileContent element and parse it
        let formData = document.getElementById('fileContent').textContent;
        //console.log(formData);
        let data = JSON.parse(formData);


        // iterate through stories massage data again
        let stories = data.stories;
        for (let s of stories) {
            let story = {content: s.text, userId: s.userId, dateTime: randomDateTime(), storyId: s.storyId, images: []};
            sendAjaxMockDataRequest( '/stories/mock_insert', JSON.stringify(story));
        }


        // iterate through reactions and massage data to fit our format, also create user's for each one
        let userReacts = data.users;
        for (let u of userReacts) {
            mockAddReactions(u);
            mockAddUser(u.userId);
        }


        event.preventDefault();
}


/**
 * Massage reactions data and save
 * @param data; array of reactions for a user
 */
function mockAddReactions(data) {
    // change 'ratings' to 'reactions' and 'vote' to 'reaction'
    let reacts = [];
    for (let r of data.ratings) {
        let temp = {storyId: r.storyId, rating: r.rating};
        reacts.push(temp);
    }
    const input = JSON.stringify({ratings: reacts, userId: data.userId});
    sendAjaxMockDataRequest('/users/mock_reaction', input);
}


/**
 * Create a new user for  given Id
 * @param userId; Id of the user to be created
 */
function mockAddUser(userId){
    // create mock user account with userId, and auto-generated firstname, surname, and email address. Password is default.
    let firstname = Math.random().toString(36).substring(2, 15);
    let surname =  Math.random().toString(36).substring(2,15);
    let user = {userId: userId, firstname: firstname, surname:surname,password:'password', email: Math.random().toString(36).substring(2,15)};
    sendAjaxMockDataRequest('/users/insert', JSON.stringify(user));
}

/**
 * Generate random datatime.
 * doesn't seem to actually work as expected (does not stay in range) but does still generate random datatime so no fix
 * for now
 * @returns {number}; generated data time
 */
function randomDateTime()
{
    let min = 1577836800; // 01/01/2020
    let max = Date.now();
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * On click event listener for the add button, opens the upload dialog
 */
document.getElementById('butAdd').addEventListener('click', function() {
    // Open/show the add new city dialog
    toggleUploadDialog(true);
});

/**
 * On click event listener for the cancel Upload button, closes upload dialog
 */
document.getElementById('butCancelUpload').addEventListener('click', function() {
    // Open/show the add new city dialog
    toggleUploadDialog(false);
});

/**
 * On change event listener for the file upload element
 */
document.getElementById('fileUpload').addEventListener('change', handleFileSelect, false);

/**
 * Handle file select for fileUpload element
 * @param event; the element triggering the event
 */
function handleFileSelect(event){
    // read the selected file as text and set as text content of 'fileContent' element;
    const reader = new FileReader()
    reader.onload =  function (e) {
        document.getElementById('fileContent').textContent = e.target.result;
    }
    reader.readAsText(event.target.files[0])
}

/**
 * Toggles visibility of upload dialog
 * @param visible; true or false
 */
function toggleUploadDialog (visible) {
    const addDialog =  document.querySelector('.new-post-dialog');
    if (visible) {
        addDialog.classList.add('dialog-container--visible');
    } else {
        addDialog.classList.remove('dialog-container--visible');
    }
};

/**
 * Send AJAX request for user to specified url. Check credentials, and then save jwt to local storage and redirect to index
 * @param url; the url to ajax call
 * @param: data; the data being sent
 */
function sendAjaxMockDataRequest(url,data){
    $.ajax({
        url: url,
        type: 'POST',
        data: data,
        contentType:'application/json',
        error: function(xhr,status,error){
            alert('Error: sendAjaxMock' + xhr.responseText);
        },
        success: function(response){
            console.log('Uploaded');
        }
    })
}