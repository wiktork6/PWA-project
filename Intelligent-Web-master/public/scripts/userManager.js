/**
 * Check if the user is logged in by checking the local storage for jwt token.
 */
function userLoggedIn() {
    //console.log('auth');
    const token = localStorage.getItem('jwt');
    //console.log('token: ' + JSON.stringify(token));
    if (token == null || token === undefined)
        notLoggedIn();
    else
        loggedIn();
}

/**
 * If the user is not logged in, change the userLink element to redirect to the login page and change class
 */
function notLoggedIn() {
    const userLink =  document.getElementById('butUser');
    userLink.href = '/login';
    userLink.textContent = 'Login';
    userLink.classList.add('butUserLoggedOut');
}

/**
 * If the user is logged in (jwt token exists), change userLink element to link to their profile, and change class
 */
function loggedIn() {
    const userLink =  document.getElementById('butUser');
    userLink.addEventListener('click', function() {
        goToProfile();
    });
    userLink.classList.add('butUserLoggedIn');
}

/**
 * Go to profile specified by the userId.
 * If no userId is provided, get the logged in user's ID and redirect to their profile.
 */
function goToProfile(userId = null){
    let url ='';
    if (userId == null || userId === undefined) url='users/me';
    else window.location.href = 'users/' + userId;
    $.ajax({
        url: url,
        headers: { 'Authorization': localStorage.getItem('jwt') },
        success: function(data) {
            console.log('success');
            window.location.href='/users/' + data.uId;
        }

    });
}

/**
 * Add the logout button to the header by chaning class of userLink element (used on user profile)
 */
function addLogoutButton() {
    const userLink =  document.getElementById('butUser');
    userLink.addEventListener('click', function() {
        logout();
    });
    userLink.classList.add('butUserLogOut');
}

/**
 * Remove the logout button
 */
function disableLogoutButton() {
    const userLink =  document.getElementById('butUser');
    document.getElementById('butAdd').remove();
    userLink.remove();
}

/**
 * Logout the user from all sessions
 */
function logout() {
    $.ajax({
        url: '/users/logoutAll',
        type: 'POST',
        contentType:'application/json',
        headers:{
            'Authorization': localStorage.getItem('jwt')
        },
        success: function(response){
            console.log('logged out');
            localStorage.removeItem('jwt');
            window.location.href = '/';
        }
    })
}

/**
 * Send the registration data to the correct path
 */
function sendRegisterData() {
    var form = document.getElementById('registerForm');
    sendAjaxUser('/users/insert', JSON.stringify(serialiseForm()));
}

/**
 * Send the login data to the correct path
 */
function sendLoginData() {
    var form = document.getElementById('loginForm');
    sendAjaxUser('/users/login', JSON.stringify(serialiseForm()));
}
/**
 * Serialise the form data into a JSON object
 */
function serialiseForm(){
    var formArray= $("form").serializeArray();
    var data={};
    for (index in formArray){
        data[formArray[index].name]= formArray[index].value;
    }
    return data;
}

/**
 * Send AJAX request for user to specified url. Check credentials, and then save jwt to local storage and redirect to index
 * @param url; the url to ajax call
 * @param: data; the data being sent
 */
function sendAjaxUser(url,data){
    console.log(data);
    $.ajax({
        url: url,
        type: "POST",
        data: data,
        context: this,
        contentType:'application/json',
        error: function(xhr,status,error){
            alert('Error: email address and/or password incorrect. Please try again.');
        },
        success: function(response){
            var ret = response;
            localStorage.setItem('jwt','Bearer ' + ret.token);
            //alert('Success: ' + JSON.stringify(ret));
            window.location.href='/';
        }
    })
}