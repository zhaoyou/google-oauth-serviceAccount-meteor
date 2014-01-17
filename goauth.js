process.env.TZ = 'UTC';

if (typeof Meteor === 'undefined') {
  // Not Running In Meteor (nodejs code)
  // example NPM/Node Dependencies that we'll use
  var request = require('request');
  var crypto = require('crypto');
  var fs = require('fs');

} else {
  // Running as Meteor Package
  var request = Npm.require('request');

  // node core module 'http'
  // use Npm.require to require node core modules
  // but doesnt need Npm.depends in the package.js file
  var crypto = Npm.require('crypto');
  var fs = Npm.require('fs');
}


var GOauthServiceAcccount = function(options) {
  var keyFile = options.keyFile || 'key.pem';
  var iss = options.iss || 'yourProjectID@developer.gserviceaccount.com';
  var scope = options.scope || "https://www.googleapis.com/auth/calendar";
  var expiresInMinutes = options.scope || 60;

  if(!fs.existsSync(keyFile)) {
    console.error("keyFile not found:", keyFile);
    process.exit(1);
  }

  var jwtHeader = {
    alg: "RS256",
    typ: "JWT"
  };

  var jwtHeaderB64 = base64urlEncode(JSON.stringify(jwtHeader));
  console.log("Header:" + jwtHeaderB64);
  //decode
  console.log(new Buffer(jwtHeaderB64, 'base64').toString('ascii'));

  // https://developers.google.com/google-apps/calendar/v3/reference/calendars/get
  var iat = Math.floor(new Date().getTime() / 1000);
  var exp = iat + (expiresInMinutes * 60);

  var jwtClaim = {
    "iss": iss,
    "scope": scope,
    "aud":"https://accounts.google.com/o/oauth2/token"
   };

  jwtClaim.exp = exp;
  jwtClaim.iat = iat;

  console.log(JSON.stringify(jwtClaim));
  var jwtClaimB64 = base64urlEncode(JSON.stringify(jwtClaim));
  console.log("Claim:" + jwtClaimB64);

  var signatureInput = jwtHeaderB64 + '.' + jwtClaimB64;
  console.log("Signature Input:" + signatureInput);

  var signature = sign(signatureInput, keyFile);
  console.log("Signature:" + signature);

  this.JWT = signatureInput + '.' + signature;
  console.log("JWT:", this.JWT);

}

if (typeof Meteor === 'undefined') {
   // Export it node style
   GoogleOauthServiceAccount = exports = module.exports = GOauthServiceAcccount; // Limit scope to this nodejs file
} else {
   // Export it meteor style
   GoogleOauthServiceAccount = GOauthServiceAcccount; // Make it a global
   console.log('meteor: *****', Meteor);
}

GoogleOauthServiceAccount.prototype.auth = function(callback) {
  request.post({
      url: 'https://accounts.google.com/o/oauth2/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      form: {
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': this.JWT
      }
    }, function(err, res, body) {
      if (err) {
        callback(err, null);
      } else {
        if (res.statusCode == 200) {
          console.log("STATUS:200");
          callback(err, JSON.parse(body).access_token);
        } else {
          console.log('STATUS: ' + res.statusCode);
          console.log('HEADERS: ' + JSON.stringify(res.headers));
          console.log('Response:\n' + body);

          callback(new Error("failed to retrieve an access token"), body);
        }
      }
    });
}

function sign(inStr, keyPath) {
  var key = fs.readFileSync(keyPath);
  if(key.length==0)
      console.log("most likely invalid key file: " + keyPath);

  var sig = crypto.createSign('RSA-SHA256').update(inStr).sign(key, 'base64');

  //verification
  var verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(inStr);
  if(verifier.verify(key, sig, 'base64')){
      console.log("signature verified with:"+keyPath);
  }else{
      console.log("signature NOT verified with:"+keyPath);
  }

  return base64urlEscape(sig);
}

function base64urlEncode(str) {
  return base64urlEscape(new Buffer(str).toString('base64'));
}

function base64urlEscape(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

