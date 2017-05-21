// VARIABLES
let express = require('express');
let app = express();
let hbs = require('express-hbs');
let SpotifyWebApi = require('spotify-web-api-node');
let uuid = require('uuid');
let QRCode = require('qrcode');

// CUSTOM VARIABLES
let currentUserId;
let currentPlaylistId;

// CONFIGURATION
let bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('hbs', hbs.express4({
    partialsDir: __dirname + '/views/partials',
    defaultLayout: "views/main.hbs"
}));
app.set('view engine', 'hbs');
app.use('/views', express.static('views'));

// Create the authorization URL
let spotifyApi = new SpotifyWebApi({
    clientId : '6ad6fc052e2c4d1e993af8069912f960',
    clientSecret : '13ff0b022b8f4ed49a59746b65a30df1',
    redirectUri : 'http://localhost:8000/auth-callback'
});
let scopes = ['user-read-private', 'playlist-modify-public', 'user-read-playback-state'];
let authorizeURL = spotifyApi.createAuthorizeURL(scopes);

app.get('/', function(req, res) {
    res.redirect(authorizeURL);
});

/* Handle authorization callback from Spotify */
app.get('/auth-callback', function(req, res) {
    /* Read query parameters */
    let code  = req.query.code; // Read the authorization code from the query parameters

    // Retrieve an access token and a refresh token
    spotifyApi.authorizationCodeGrant(code)
        .then(function(data) {
            // Set the access token on the API object to use it in later calls
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);

            spotifyApi.getMe()
                .then(function(data) {
                    currentUserId = data.body.id;
                });

            res.render('partials/new_houseparty');

        }, function(err) {
            console.log(err);
        });
});

app.get('/new-houseparty', function(req, res) {
    spotifyApi.createPlaylist(currentUserId, 'Geile Houseparty Playlist')
        .then(function(data) {
            currentPlaylistId = data.body.id;
            QRCode.toDataURL(currentPlaylistId, function (err, url) {
                res.render('partials/registration', {
                    imgSrc: url
                });
            });
        });
});

app.get('/genre-seeds', function(req, res) {
    spotifyApi.getAvailableGenreSeeds()
        .then(function (data) {
            res.send(data.body.genres);
        });
});

app.post('/new-taste', function(req, res) {
    let currentTrack = "";
    spotifyApi.getMyCurrentPlaybackState()
        .then(function (data) {
            currentTrack = data.body.item.uri;
            return spotifyApi.getPlaylistTracks(currentUserId, currentPlaylistId)
        })
        .then(function(data) {
            return data.body.items.map(function(t) { return t.track.uri; });
        })
        .then(function (trackIds) {
            let currentTrackIndex = trackIds.indexOf(currentTrack);
            console.log(currentTrackIndex);
        });

    spotifyApi.getRecommendations({ seed_genres: ['sad'], seed_artists: [], seed_tracks: [] })
        .then(function(data) {
            return data.body.tracks.map(function(t) { return t.uri; });
        })
        .then(function(trackIds) {
            return spotifyApi.addTracksToPlaylist(currentUserId, currentPlaylistId, trackIds);
        })
        .catch(function(error) {
            console.error(error);
        });
});

app.listen(8000, function () {
    console.log('Example app listening on port 8000!');
});
