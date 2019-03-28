"use strict";

const express = require('express');
const hoffman = require('hoffman');
const path = require('path');
const passport = require('passport');
const TwitterStrategy = require('passport-twitter');
const bodyParser = require('body-parser');
const modKey = require('./modules/mods');
const handlingKey = require('./modules/handling');
const https = require('https');

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'dust');
app.engine('dust', hoffman.__express());

const listeningPort = parseInt(process.argv[2]) || 3000;

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(bodyParser.json());

app.use(require('express-session')({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

let twitterOptions = {
    consumerKey: modKey.TWITTER_CONSUMER_KEY,
    consumerSecret: modKey.TWITTER_CONSUMER_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/twitter/callback"
};

let twitterAuthStrat = 'twitter-auth';
passport.use(twitterAuthStrat, new TwitterStrategy(twitterOptions,
    (token, tokenSecret, profile, done) => {
        done(null, profile, {
            token: token,
            tokenSecret: tokenSecret
        });
    }
));

passport.serializeUser(function (user, cb) {
    console.log("Serialize user");
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    console.log("Deserialize user");
    cb(null, obj);
});

app.get("/", function (request, response) {
    response.render('main', {});
});

app.get('/auth/twitter', passport.authenticate(twitterAuthStrat));

app.get('/auth/twitter/callback', passport.authenticate(twitterAuthStrat, {
    successRedirect: '/homePage',
    failureRedirect: '/'
}));

app.get('/homePage', (request, response) => {
    if (request.user) {
        console.log(request.user);
        response.render('homePage', request.user._json);
    } else {
        response.redirect('/auth/twitter');
    }
});

app.get('/auth/logout', (request, response) => {
    request.logout();
    response.redirect('/');
});

let searchOptions = {
    hostname: 'api.twitter.com',
    port: 443,
    path: '/1.1/search/tweets.json',
    method: 'GET',
};

app.get('/hashtag', (request, response) => {

    if (request.user) {
        let hashTag = 'csc365';
        let searchSpecificOptions = Object.assign(searchOptions, {});
        searchSpecificOptions.path += `?q=%23${hashTag}`;
        searchSpecificOptions['headers'] = handlingKey.getOauthHeader(modKey.TWITTER_CONSUMER_KEY, modKey.TWITTER_CONSUMER_SECRET,
            request.user.token,
            request.user.tokenSecret,
            hashTag);

        let requestToTwitter = https.request(searchSpecificOptions, (responseFromTwitter) => {
            let allTweets;
            responseFromTwitter.on('data', (tweets) => {
                if (allTweets) {
                    allTweets += tweets;
                } else {
                    allTweets = tweets;
                }
            });
            responseFromTwitter.on('error', (err) => {
                console.error(err);
            });
            responseFromTwitter.on('end', () => {
                let parsedTweets = JSON.parse(allTweets.toString());
                response.render('hashtag', parsedTweets);
            });
        });
        requestToTwitter.end();
    } else {
        response.redirect('/auth/twitter');
    }

});


app.use('/resources', express.static('resources'));

app.listen(listeningPort, function () {
    console.log(`My app is listening on port ${listeningPort}!`);
});
