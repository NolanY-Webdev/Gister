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
var request = require('request');
var bodyParser = require('body-parser');


app.use(bodyParser.urlencoded({ extended : true }));



app.get('/', function(req, res) {
  res.json({ status : 200 });
});


//step 1 getting the provider auth url
app.get('/auth/login', function(req, res) {
  var authURL = oauth2.getAuthorizeUrl({
    redirect_uri : 'http://localhost:3000/auth/github/callback',  //github authorization callback url
    scope : ['gist'],       //what you can do on the user's behalf
    state : 'Authorize' + Math.round(Math.random()* 9999999 )
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

//Mike's working code
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
//end Mike's working code

function getAuthBearerToken(req, res, next) {
  if (!req.headers.hasOwnProperty('authorization')) {
    return res.status(401).json({ error : 401, message : 'Bearer auth token not found in headers' });
  }
  var auth_header = req.headers.authorization;
  var auth_header_value = auth_header.split(' ');
  if (auth_header_value.length !== 2) {
    return res.status(401).json({ error: 401, message : 'Authorization header malformation detected'});
  }
  req.access_token = auth_header_value[1];
  next();
}

//step 3
app.post('/gists', getAuthBearerToken, function(req,res){
  var auth_header = req.headers.authorization;
  var access_token = auth_header.split(' ')[1];
  console.log(access_token);

  request.post({
    url : "https://api.github.com/gists",
    json : true,
    headers : {
      authorization : "Bearer " + req.access_token,
      'User-Agent' : '#Butt INC'
    },
    body : {
      description : req.body.description,
      public : true,
      files : JSON.parse(req.body.files)
    }
  }, function(err, response, body) {
    if (err) {
      return res.status(500).json(err);
    }
    res.json(body);
  });

});

app.get('/gists/:id', getAuthBearerToken, function(req, res) {
  request.get({
    url : 'https://api.github.com/gists/' + req.params.id,
    headers : {
      authorization : "Bearer " + req.access_token,
      'User-Agent' : '#Butt INC'
    }
  }, function(err, response, body) {
    if (err) return res.status(500).json(err);
    res.json(body);
  });
});

app.listen(PORT, function() {
  console.log('API listening on port: ', PORT);
});