// Spotify API endpoint URLs
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

// Your Spotify API credentials
// const CLIENT_ID = process.env.CLIENT_ID;
// const CLIENT_SECRET = process.env.CLIENT_SECRET;

const REDIRECT_URI = 'http://127.0.0.1:5500/index.html';
const AUTH_URL = 'https://accounts.spotify.com/authorize';
const SCOPES = 'user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read';

// Constante for max filters
const MAXFILTERS = 5;
let genre_numbers = 1;

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


///// Function that send requests to API //////
function artistName(element){
    console.log(element.value)
}

// Function that takes the artist name, music genre, and tempo. It will then extract the best songs top songs of the artist in the requested tempo
// and ask for recommendations for 30 tracks in the genre and tempo using the tracks as a seed.
async function searchArtist() {
    console.log("SearchArtist Function started")
    var query = document.querySelector("#artist_name_to_search").value;
    var access_token = localStorage.getItem("access_token");
    console.log("Artist name: " + query);
    console.log("Access Token: " + access_token);
    
    /// Hard coded these data
    let music_genre = "French rap";
    let min_tempo = 150;
    let max_tempo = 180;
    ///End of hard code

    let artist_id = await getArtistid(query, access_token);
    let artist_tracks = await getArtistTopTracks(artist_id, access_token);
    let top_tracks = getBestSongForTempo(artist_tracks, min_tempo , max_tempo);
    let track_seed =""
    if(top_tracks.length>1){
        track_seed = top_tracks[0].id;
        for(i=1; i<top_tracks.length; i++){
            if(top_tracks[i]){
                let string = "," + top_tracks[i].id;
                track_seed += string;
            }
        }
    }else{
        track_seed = top_tracks[0].id;
    }

    console.log(`artist id= ${artist_id} | seed_genres= ${music_genre} | seed_tracks=${track_seed}`);


    // Get recommendation from Spotify
    try {
        const response = await fetch(`${SPOTIFY_API_URL}/recommendations?limit=30&market=US&seed_artists=${artist_id}&seed_genres=${music_genre}&seed_tracks=${track_seed}&min_tempo=${min_tempo}&max_tempo=${max_tempo}`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            // Extra
            console.log("track recommendation: ",data.tracks);
            return data.tracks;
        } else {
            console.error('Failed to search for artist:', response.status, response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Error searching for artist:', error);
        return null;
    }
}


async function searchForArtist() {
    try {
        var access_token = localStorage.getItem("access_token");
        console.log('Access Token:', access_token); // Print access token
        const query = 'Fred Again';
        const apiUrl = `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(query)}&type=artist`;
        console.log('API URL:', apiUrl); // Print API request URL
        const artists = await searchArtist(query, access_token);
        console.log('Artists:', artists);
    } catch (error) {
        console.error('Error searching for artist:', error);
    }
}

//// Function that will get recommendations for songs for a specific genre, tempo, size
// Can only do recommendations based on an artist or a track
// 1. Need to pick an artist, genre and a track (Max 5 of each seperated by commas)
// 2. Use the selection and ask for recommendations with specific range of tempo
// 3. Could eventually filter by "type" (Workout, chill, french,...)






async function recommendedSongs(){
    // try {
    //     const response = await fetch(`${SPOTIFY_API_URL}/search?q=${query}&type=artist&market=US`, {
    //         headers: {
    //             Authorization: `Bearer ${access_token}`,
    //         },
    //     });
        
    //     if (response.ok) {
    //         const data = await response.json();
    //         // Extract and return the artists from the response
    //         console.log("Response from searchArtist: ",data.artists.items[0]);
    //         return data.artists.items;
    //     } else {
    //         console.error('Failed to search for artist:', response.status, response.statusText);
    //         return null;
    //     }
    // } catch (error) {
    //     console.error('Error searching for artist:', error);
    //     return null;
    // }
}

// Function that will add additional selector for music genre selection. Maximum 5
function addGenreSelector(){
    if(genre_numbers < MAXFILTERS){
        
        let selectDiv = document.querySelector(".genre_selectors");
        let selector =  document.createElement("select");
        selector.setAttribute("id","music_genre" + genre_numbers);
        selector.setAttribute("name","music_genre");
        let option = document.createElement("option");
        option.text = option.value = "French";
        let option1 = document.createElement("option");
        option1.text = option1.value = "hip-hop";
        let option2 = document.createElement("option");
        option2.text = option2.value = "house";
        let option3 = document.createElement("option");
        option3.text = option3.value = "indie-pop";
        let option4 = document.createElement("option");
        option4.text = option4.value = "pop";
        let option5 = document.createElement("option");
        option5.text = option5.value = "rock";
        let option6 = document.createElement("option");
        option6.text = option6.value = "work-out";
    
        selector.appendChild(option);
        selector.appendChild(option1);
        selector.appendChild(option2);
        selector.appendChild(option3);
        selector.appendChild(option4);
        selector.appendChild(option5);
        selector.appendChild(option6);
        selectDiv.appendChild(selector);
        genre_numbers ++;
    }
}

// function that takes the artist name and returns the artist id that is the colosest from the name given
async function getArtistid(query, access_token){
    console.log("SearchArtistid Function started")
    // console.log("Artist name: " + query);
    // console.log("Access Token: " + access_token);

    try {
        const response = await fetch(`${SPOTIFY_API_URL}/search?q=${query}&type=artist`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.artists.items[0].id;
        } else {
            console.error('Failed to search for artist:', response.status, response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Error searching for artist:', error);
        return null;
    }
}

// Function that will take an artist ID number and return an array of the best tracks with name, id of the track and it's tempo. 
async function getArtistTopTracks(artistID, access_token){
    console.log("SearchArtistTopTracks Function started")
    // console.log("Artist ID: " + artistID);
    // console.log("Access Token: " + access_token);
    try {
        const response = await fetch(`${SPOTIFY_API_URL}/artists/${artistID}/top-tracks?market=US`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            // console.log("Best track results: ",data.tracks);
            track_info = [];
            for(i=0; i < data.tracks.length; i++){
                track_data = {
                    "name": data.tracks[i].name,
                    "id": data.tracks[i].id,
                    "popularity": data.tracks[i].popularity,
                    "tempo": await getTrackTempo(data.tracks[i].id, access_token),
                } 
                track_info.push(track_data);
            }
            console.log("Tempo information from top tracks:")
            console.log(track_info);
            // getBestSongForTempo(track_info, 130 , 160);
            return track_info;
        } else {
            console.error('Failed to search for artist:', response.status, response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Error searching for artist:', error);
        return null;
    }
}

// Function that gets a track id and returns the tempo value
async function getTrackTempo(trackID, access_token){
    console.log("getTrackTempo Function started")
    // console.log("Track ID: " + trackID);
    // console.log("Access Token: " + access_token);

    try {
        const response = await fetch(`${SPOTIFY_API_URL}/audio-features/${trackID}`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            // console.log("Track Tempo ",data.tempo);
            return data.tempo;
        } else {
            console.error('Failed to search for artist:', response.status, response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Error searching for artist:', error);
        return null;
    }
}

// Function that will pick the best top song according to the demanded tempo
function getBestSongForTempo(track_list, min_tempo , max_tempo){


    let tracks_in_tempo = track_list.filter((track) => {
        return track.tempo >= min_tempo && track.tempo <= max_tempo;
    });

    console.log (tracks_in_tempo);
    return tracks_in_tempo;
    
}