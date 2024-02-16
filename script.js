// Spotify API endpoint URLs
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';


const REDIRECT_URI = 'http://127.0.0.1:5500/index.html';
const AUTH_URL = 'https://accounts.spotify.com/authorize';
const SCOPES = 'user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read';


// Check URL to see if it has Token
function onPageLoad(){
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

function fetchAccessToken(code) {
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + REDIRECT_URI;
    body += "&client_id=" + CLIENT_ID;
    body += "&client_secret=" + CLIENT_SECRET;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN_ENDPOINT, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(CLIENT_ID + ":" + CLIENT_SECRET));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        console.log(data);
        if (data.access_token != undefined) {
            var access_token = data.access_token;
            console.log(`Access TOKEN: ${access_token}`);
            localStorage.setItem("access_token", access_token);
        }
        if (data.refresh_token != undefined) {
            var refresh_token = data.refresh_token;
            console.log(`Refresh TOKEN: ${refresh_token}`);
            localStorage.setItem("refresh_token", refresh_token);
        }
        console.log("Authorization done!!");
        onPageLoad();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}


// Function to get code to request Token (WORKING)
function getCode() {
    let code = null;
    const queryString = window.location.search;
    if (queryString.length > 0) {
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code');
    }
    return code;
}


// Function to connect to Spotify to get code (WORKING)
function requestAuthorization() {
    let url = AUTH_URL;
    url += "?client_id=" + CLIENT_ID;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURIComponent(REDIRECT_URI);
    url += "&show_dialog=true";
    url += "&scope=" + encodeURIComponent(SCOPES);
    window.location.href = url;
}

