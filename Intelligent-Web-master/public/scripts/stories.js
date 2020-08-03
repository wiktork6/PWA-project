/**
 * Handle a new story input.
 * @param url; the url to post the story to
 */
function onSubmit() {
    // get the currently logged in user's id. If none, then error and return
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

        // then serialise the form array
        var formArray= $("form").serializeArray();
        // console.log("FA: " + JSON.stringify(formArray));

        var data={};
        for (index in formArray){
            data[formArray[index].name]= formArray[index].value;
        }   // set auto fields
        data['dateTime'] = new Date().getTime();    // then add new field for current date time
        // for each image thumbnail on preview, push it into the array. Then set set the base64 data as field of data.
        let imgArray = new Array();
        for (let i = 0; i < document.getElementById('images').files.length; i ++) {
            var bin = document.getElementById('img' + (i + 1)).src;
            imgArray.push(bin);
        }
        if (imgArray != null && imgArray != undefined && imgArray.length > 0)
            data['images'] = imgArray;
        data.userId = userId;       // then set the user ID

        // add the story
        addStory(data);


    });
    event.preventDefault();

}

/**
 * Handle the thumbnail changes when new files are selected.
 * @param evt; the element being triggered.
 */
function handleFileSelectThumbFile(evt){
    // Clear existing thumbnails
    for (let i = 1; i < 4; i ++) {
        document.getElementById('img' +i).setAttribute('src', '');
    }

    //get files
    var files = evt.target.files;
    //console.log(files);
    // error if more than three
    if (files.length > 3) {
        alert ("You can only upload a maximum of 3 pictures");
        evt.target.value = "";
        return;
    }

    // for each file, read it as base64 and set it as source of appropriate thumbnail
    for (let i = 0; i <  files.length; i ++) {
        const file = files[i];
        if (file) {
            const reader = new FileReader();

            reader.onload = function (readerEvt) {
                // Set the image preview to the uploaded image.
                document.getElementById('img' + (i+1)).setAttribute('src', readerEvt.target.result);
            }.bind(this);
            reader.readAsDataURL(file);
        }
    }
}

/**
 * On change event listener images input. changes thumbnails
 */
document.getElementById('images').addEventListener('change', handleFileSelectThumbFile);


/**
 * On click event listener for add button. Open the new story dialog
 */
document.getElementById('butAdd').addEventListener('click', function() {
    toggleAddDialog(true);
});

/**
 * On click event listener for cancel button. Closes new story dialog
 */
document.getElementById('butCancel').addEventListener('click', function() {
    toggleAddDialog(false);
});

/**
 * Used to toggle the new story dialog for posting stories
 * @param: visible - true or false
 */
function toggleAddDialog (visible) {
    const addDialog =  document.querySelector('.new-post-dialog');
    if (visible) {
        addDialog.classList.add('dialog-container--visible');
    } else {
        addDialog.classList.remove('dialog-container--visible');
    }
};


