// Spotify API endpoint URLs
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

// Your Spotify API credentials
const CLIENT_ID = '3aa75aaba79d4137b11253ae9b3d8c5c';
const CLIENT_SECRET = '0e84bc31d3a94d43a6b2db475cadebd3';

const REDIRECT_URI = 'http://127.0.0.1:5500/index.html';
const AUTH_URL = 'https://accounts.spotify.com/authorize';
const SCOPES = 'user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read';


// Check URL to see if it has Token
function onPageLoad(){
    // const CLIENT_ID = '3aa75aaba79d4137b11253ae9b3d8c5c';
    // const CLIENT_SECRET = '0e84bc31d3a94d43a6b2db475cadebd3';
    console.log("page loaded");
    if(window.location.search.length>0){
        handleRedirect();
    }
}

// function that handles the page redirect to extract code and request TOKEN
function handleRedirect(){
    console.log("handeling page redirect")
    let code = getCode();
    fetchAccessToken(code);
    window.history.pushState("", "", REDIRECT_URI); // remove param from url
}

function fetchAccessToken(code){
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + REDIRECT_URI;
    body += "?client_id=" + CLIENT_ID;
    body += "?client_secret=" + CLIENT_SECRET;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN_ENDPOINT, true);
    xhr.setRequestHeader('content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic', + btoa(CLIENT_ID + ":" + CLIENT_SECRET));
    xhr.send(body);
    console.log(`XHR done: ${xhr}`);
    xhr.onload = handleAuthorizationResponse();
}

function handleAuthorizationResponse(){
    console.log("authorization....");
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        var data = JSON.parse(this.responseText);
        if ( data.access_token != undefined ){
            access_token = data.access_token;
            console.log(`Acces TOKEN: ${access_token}`);
            localStorage.setItem("access_token", access_token);
        }
        if ( data.refresh_token  != undefined ){
            refresh_token = data.refresh_token;
            console.log(`Refresh TOKEN: ${refresh_token}`);
            localStorage.setItem("refresh_token", refresh_token);
        }
        console.log("Authorization done!!")
        onPageLoad();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}


// Function to get code to request Token (WORKING)
function getCode(){
    let code = null;
    const queryString = window.location.search;
    if(queryString.length >0 ){
        const urlParams = new URLSearchParams(queryString);
        console.log(`cleaned String: ${urlParams}`);
        code = urlParams.get('code');
    }
    return code;
}


// Function to connect to Spotify to get code (WORKING)
function requestAuthorization(){
    let url = AUTH_URL;
    url += "?client_id=" + CLIENT_ID;
    url += "&response_type=code";
    url += "&redirect_uri=" + REDIRECT_URI;
    url += "&show_dialog=true";
    url += "&scope=" + SCOPES;
    window.location.href = url;
}



