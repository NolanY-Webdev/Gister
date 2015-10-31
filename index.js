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


//step 1 getting the provider auth url
app.get('/auth/login', function(req, res) {
  var authURL = oauth2.getAuthorizeUrl({
    redirect_uri : 'http://localhost:3000/auth/github/callback',  //github authorization callback url
    scope : ['gist'],       //what you can do on the user's behalf
    state : 'Authorize'+Math.round(Math.random()*9999999)
  });
  res.json({ url : authURL });  //gives user authorization to login
});

//step 2 callback from provider with code on successful authorization
//route must be set exactly as it is set on provider as callback url


//something broke in my code
//use code to exchange for access token, get code from querystring
// app.get('/auth/github/callback'), function(req, res) {
//   var code = req.query.code;
//   if (code === undefined) {
//     return res.status(401).json({ error : 401, message :'invalid auth code' });
//   }
//   oauth2.getOAuthAccessToken(
//     code,
//     {
//       redirect_uri : 'http://localhost:3000/auth/github/callback'
//     },
//     function(err, access_token, refresh_token, results) {
//       if(err) {
//         console.error(err);
//         res.status(401).json(err);
//       } else if (results.error) {
//         console.error(results.error);
//         res.status(401).json(results.error);
//       } else {
//         res.json({ access_token : access_token });
//       }
//     }
//   );
// };

app.get('/auth/github/callback', function (req, res) {
  var code = req.query.code;
    if(code === undefined) {
      return res.status(401).json({ error : 401, message : 'Invalid auth code.'});
    }

  //instance of oauth2 with function getOauthAccessToken()
  oauth2.getOAuthAccessToken(
   code,
   {
    redirect_uri : 'http://localhost:3000/auth/github/callback'
   },
   function(err, access_token, refresh_token, results) {
    if(err) {
      console.error(err);
      res.status(401).json(err);
      }else if( results.error ) {
      res.status(401).json(results.error);
      }else { //everything worked, get token, send token back to client

        res.json({ access_token : access_token });
      }
    }
  );
})

app.listen(PORT, function() {
  console.log('API listening on port: ', PORT);
});