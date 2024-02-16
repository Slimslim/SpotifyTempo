// Spotify API endpoint URLs
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const REDIRECT_URI = 'http://localhost:3000/callback';
const AUTH_URL = 'https://accounts.spotify.com/authorize';
const CLIENT_ID = '3aa75aaba79d4137b11253ae9b3d8c5c';
const SCOPES = 'user-read-private user-read-email';

// Function to authorize user and fetch access token
function authorize() {
  const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
  window.location.href = authUrl;
}

// Function to extract access token from URL fragment
function getAccessTokenFromUrl() {
    console.log("getAccessTokenFromUrl function started");
    const hashParams = window.location.hash.substr(1).split('&');
    const tokenParam = hashParams.find(param => param.startsWith('access_token='));
    if (tokenParam) {
        return tokenParam.split('=')[1];
    }
    return null;
}

// Example usage:
async function fetchData() {
    console.log("fetchData function started");
    // Check if access token is present in URL fragment
    const accessToken = getAccessTokenFromUrl();
    if (accessToken) {
        try {
            // Use access token to make requests to the Spotify API
            const response = await fetch(`${SPOTIFY_API_URL}/albums/4aawyAB9vmqN3uQ7FjRGTy`, {
            headers: {
            'Authorization': `Bearer ${accessToken}`
            }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch top tracks');
            }

            const data = await response.json();
            console.log('Top tracks:', data);
            } catch (error) {
                console.error('Error:', error);
            }
    } else {
        // Access token not present, initiate authorization process
        authorize();
    }
}

// Call the fetchData function
fetchData();
