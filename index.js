//env $(cat .env | xargs) nodemon index.js
var PORT = process.env.PORT || 3000;
var express = require('express');
var app = express();
var OAuth2 = require('oauth').OAuth2;
var oauth2 = new OAuth2(
  process.env.GITHUB_CLIENT_ID,
  process.env.GITHUB_CLIENT_SECRET,
  'https://github.com/',//base url
  'login/oauth/authorize',//login path
  'login/oauth/access_token',//access_token path
  null//options
);

app.get('/', function(req, res) {
  res.json({ status : 200 });
});

//Step 1. Oauth2, getting the provider's auth url
app.get('/auth/login', function(req, res) {
  var authURL = oauth2.getAuthorizeUrl({
    redirect_uri : 'http://localhost:3000/auth/github/callback',  //github authorization callback url
    scope : ['gist'],       //what you can do on the user's behalf
    state : 'Authorize'+Math.round(Math.random()*9999999)
  });
  res.json({ url : authURL });  //gives user authorization to login
});

app.listen(PORT, function() {
  console.log('API listening on port: ', PORT);
});