const passport = require('passport');
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const googleUser = require(__dirname + "/googleModel.js");

// Snippet on: https://www.passportjs.org/packages/passport-google-oauth2/
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/google/callback",
    passReqToCallback: true
  },
  function(request, accessToken, refreshToken, profile, done) {
    googleUser.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

passport.serializeUser(function(user, done){
    done(null, user);
});
passport.deserializeUser(function(user, done){
    done(null, user);
});