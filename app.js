let express = require('express');
let app = express();
let path = require('path');
let bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));

let SpotifyWebApi = require('spotify-web-api-node');

// credentials are optional
let spotifyApi = new SpotifyWebApi({
    clientId : '6ad6fc052e2c4d1e993af8069912f960',
    clientSecret : '13ff0b022b8f4ed49a59746b65a30df1',
    redirectUri : 'http://localhost:8000/callback'
});

// Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
let scopes = ['user-read-private', 'user-read-email'],
    state = 'some-state-of-my-choice';

// Create the authorization URL
let authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

app.get('/', function(req, res) {
    res.redirect(authorizeURL);
});

/* Handle authorization callback from Spotify */
app.get('/callback', function(req, res) {
    /* Read query parameters */
    let code  = req.query.code; // Read the authorization code from the query parameters
    let state = req.query.state; // (Optional) Read the state from the query parameter

    // Retrieve an access token and a refresh token
    spotifyApi.authorizationCodeGrant(code)
        .then(function(data) {
            console.log('The token expires in ' + data.body['expires_in']);
            console.log('The access token is ' + data.body['access_token']);
            console.log('The refresh token is ' + data.body['refresh_token']);

            // Set the access token on the API object to use it in later calls
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);
        }, function(err) {
            console.log('Something went wrong!', err);
        });

    res.sendFile(__dirname + '/views/index.html');
});

app.listen(8000, function () {
    console.log('Example app listening on port 8000!');
});
