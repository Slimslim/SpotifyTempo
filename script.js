
// Spotify API endpoint URLs
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

// Your Spotify API credentials


const REDIRECT_URI = 'http://127.0.0.1:5500/index.html';
const AUTH_URL = 'https://accounts.spotify.com/authorize';
const SCOPES = 'user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read';

// Constante for max filters
const MAXFILTERS = 5;
let genre_numbers = 0;



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


///// Gets value entered in the textfield, Just used to visualize in the console//////
function artistName(element){
    // console.log(element.value)
}

// Function that takes the artist name, music genre, and tempo. It will then extract the best songs top songs of the artist in the requested tempo
// and ask for recommendations for 30 tracks in the genre and tempo using the tracks as a seed.
async function getRecommendationTracks() {
    var query = document.querySelector("#artist_name_to_search").value;
    var access_token = localStorage.getItem("access_token");
    
    /// Hard coded these data
    let nbOfTracks = 20;
    ///End of hard code
    

    // let music_genre = "";
    let min_tempo = getRequestedTempo()-15;
    let max_tempo = getRequestedTempo();
    let artist_id = await getArtistid(query, access_token);
    let artist_tracks = await getArtistTopTracks(artist_id, access_token);
    let top_tracks = getBestSongForTempo(artist_tracks, min_tempo , max_tempo);
    let genreSelected = document.querySelectorAll(".GenreSelector");
    let music_genre = "";

    // Create Genre String
    if(genreSelected.length>1){
        for(i=0; i<genreSelected.length; i++){
            if(genreSelected.length>1){
                music_genre += ",";
            }
            music_genre += genreSelected[i].value;
        }
    }else if (genreSelected.length == 1){
        music_genre += genreSelected[0].value;
    }

    // Get track id for seed
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



    // console.log(`artist id= ${artist_id} | seed_genres= ${music_genre} | seed_tracks=${track_seed}`);

    let request = SPOTIFY_API_URL + "/recommendations?";
    request += "limit=" + nbOfTracks;
    request += "&market=US&seed_artists=" + artist_id;

    if(music_genre != ""){
        request += "&seed_genres=" + music_genre;
    }

    request += "&seed_tracks=" + track_seed;
    request += "&target_danceability=" + "1";
    request += "&min_tempo=" + min_tempo;
    request += "&max_tempo=" + max_tempo;
    console.log("Request sent: " + request);

    // Get recommendation from Spotify
    try {
        const response = await fetch(request, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            
            track_info = [];
            for(i=0; i < data.tracks.length; i++){
                let trackDataInfo = await getTrackAudioFeature(data.tracks[i].id, access_token);
                let track_data = {
                    "name": data.tracks[i].name,
                    "id": data.tracks[i].id,
                    "popularity": data.tracks[i].popularity,
                    "energy": trackDataInfo.energy ,
                    "tempo": trackDataInfo.tempo,
                }
                track_info.push(track_data);
            }

            // console.log(track_info);
            // console.log(data.tracks);
            createPlaylistTableHTML(data.tracks, track_info);
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

// function that takes the artist name and returns the artist id that is the closest from the name given
async function getArtistid(query, access_token){
    // console.log("SearchArtistid Function started")
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
    // console.log("SearchArtistTopTracks Function started")
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
                let trackDataInfo = await getTrackAudioFeature(data.tracks[i].id, access_token);
                let track_data = {
                    "name": data.tracks[i].name,
                    "id": data.tracks[i].id,
                    "popularity": data.tracks[i].popularity,
                    "energy": trackDataInfo.energy ,
                    "tempo": trackDataInfo.tempo,
                }
                track_info.push(track_data);
            }
            // console.log("Top tracks with Tempo: ")
            // console.log(track_info);
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
    // console.log("getTrackTempo Function started")
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
            // console.log("Track info ",data);
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

// Function that gets a track id and returns the energy value
async function getTrackEnergy(trackID, access_token){
    // console.log("getTrackTempo Function started")
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
            return data.energy;
        } else {
            console.error('Failed to search for artist:', response.status, response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Error searching for artist:', error);
        return null;
    }
}


// Function that gets a track id and returns the energy value and tempo
async function getTrackAudioFeature(trackID, access_token){
    // console.log("getTrackTempo Function started")
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
            return data;
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

    // console.log("Tracks in the right tempo");
    // console.log (tracks_in_tempo);
    return tracks_in_tempo;
    
}


//// Function that will get recommendations for songs for a specific genre, tempo, size
// Can only do recommendations based on an artist or a track
// 1. Need to pick an artist, genre and a track (Max 5 of each seperated by commas)
// 2. Use the selection and ask for recommendations with specific range of tempo
// 3. Could eventually filter by "type" (Workout, chill, french,...)




// function that returns the selected Tempo
function getRequestedTempo(){
    let selectedTempo = document.querySelector("#tempos").value;
    return selectedTempo;
}


////////// Function for changing the HTML File
// Function that will add additional selector for music genre selection. Maximum 5
function addGenreSelector(){
    if(genre_numbers < MAXFILTERS){
        let selectDiv = document.querySelector(".genre_selectors");
        let selector =  document.createElement("select");
        selector.setAttribute("id","music_genre" + genre_numbers);
        selector.setAttribute("name","music_genre");
        selector.setAttribute("class", "GenreSelector");

        for(i=0; i<availableGenres.length; i++){
            let option = document.createElement("option");
            option.text = option.value = availableGenres[i];
            selector.appendChild(option);
        }

        selectDiv.appendChild(selector);
        genre_numbers ++;
    }
}

async function createPlaylistTableHTML(trackList, extraData){
    
    let tableBody = document.querySelector("#recommended_playlist");

    for(i = 0; i<trackList.length; i++){

        // Create a new row element
        let new_row = document.createElement("tr");
    
        // Create image td cell
        let pictureCell = document.createElement("td");
        let imageElement = document.createElement("img");
        imageElement.src = trackList[i].album.images[2].url;
        pictureCell.appendChild(imageElement);
        new_row.appendChild(pictureCell);
    
        // Create track name td cell
        let trackNameCell = document.createElement("td");
        trackNameCell.innerText = trackList[i].name;
        new_row.appendChild(trackNameCell);
    
        // Create artist name td cell
        let artistNameCell = document.createElement("td");
        artistNameCell.innerText = trackList[i].artists[0].name;
        new_row.appendChild(artistNameCell);
    
        // Create preview td cell
        if(trackList[i].preview_url){
            let previewCell = document.createElement("td");
            let audioController = document.createElement("audio");
            audioController.setAttribute("controls", "control");
            audioController.src = trackList[i].preview_url;
            previewCell.appendChild(audioController);
            new_row.appendChild(previewCell);
        }

        // Create tempo td cell
        let tempoCell = document.createElement("td");
        tempoCell.innerText = extraData[i].tempo;
        new_row.appendChild(tempoCell);

        // Create energy td cell
        let energyCell = document.createElement("td");
        energyCell.innerText = extraData[i].energy;
        new_row.appendChild(energyCell);
    
        tableBody.appendChild(new_row);
    }
}
