// Spotify API endpoint URLs
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

// Your Spotify API credentials
const CLIENT_ID = '3aa75aaba79d4137b11253ae9b3d8c5c';
const CLIENT_SECRET = '0e84bc31d3a94d43a6b2db475cadebd3';

const REDIRECT_URI = 'https://slimslim.github.io/SpotifyTempo/';
// const REDIRECT_URI = 'http://localhost:3000/callback'; // Your redirect URI
const AUTH_URL = 'https://accounts.spotify.com/authorize';

// Function to authorize user
function authorize() {
  const scopes = 'user-read-private user-read-email'; // Scopes required
  const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}`;
  window.location.href = authUrl;
}


// Function to fetch access token
async function fetchAccessToken() {
    try {
    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
        },
        body: 'grant_type=client_credentials'
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch access token');
    }
    
    const data = await response.json();
    return data.access_token;
    } catch (error) {
    console.error('Error:', error);
    }
}

// Function to make authenticated API requests
async function fetchSpotifyApi(url, accessToken) {
    try {
        const response = await fetch(url, {
            headers: {
            'Authorization': `Bearer ${accessToken}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch data from Spotify API');
        }
    
        return await response.json();
    } catch (error) {
    console.error('Error:', error);
    }
}

// // Example usage: Fetch a list of featured playlists
// async function fetchFeaturedPlaylists() {
//     const accessToken = await fetchAccessToken();
//     const url = `${SPOTIFY_API_URL}/browse/featured-playlists`;
//     const featuredPlaylists = await fetchSpotifyApi(url, accessToken);
//     console.log('Featured Playlists:', featuredPlaylists);
// }

// // Call this function to fetch featured playlists
// fetchFeaturedPlaylists();

// Example usage:
async function fetchData() {
    const accessToken = await fetchAccessToken();
    if (accessToken) {
        try {
            const response = await fetch(`${SPOTIFY_API_URL}/albums/4aawyAB9vmqN3uQ7FjRGTy`, {headers: {
            'Authorization': `Bearer ${accessToken}`}
        });
        
        // const response = await fetch(`${SPOTIFY_API_URL}/me/top/tracks?time_range=long_term&limit=5`, {
        //     headers: {
        //         'Authorization': `Bearer ${accessToken}`
        //     }
        // });
        

            if (!response.ok) {
                throw new Error('Failed to fetch top tracks');
            }

            const data = await response.json();
            console.log('Top tracks:', data);
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        console.error('Access token not available');
    }
}

// Call this function to initiate the authorization process
authorize();


// Call the fetchData function
fetchData();
