require('dotenv').config();
const express = require('express');
require('ejs');
const async = require('async');
require(__dirname + "/custom_modules/auth.js");		// Google Auth
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require("passport-local").Strategy;

//init app & middleware
const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
const User = require(__dirname + "/custom_modules/userModel.js");
const googleUser = require(__dirname + "/custom_modules/googleModel.js");

app.use(session({
	secret: process.env.SECRET_KEY,
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

//Connect to Database
const connectDB = async () => {
	const conn = await mongoose.connect("mongodb://127.0.0.1:27017/userDB");
	console.log(`Successfully connected: ${conn.connection.host} at DB: ${conn.connection.name}`);
};
connectDB().catch((err) => {
	console.log(`Error: ${err}`);
});

//configure passport local strategy
passport.use(new LocalStrategy(
	function (username, password, done) {
		User.findOne({ username: username })
			.then((founduser) => {
				if (!founduser) { return done(null, false); }
				bcrypt.compare(password, founduser.password, (err, result) => {
					if (err) { return done(err); }
					if (result) { return done(null, founduser); }
					return done(null, false);
				});
			})
			.catch((err) => {
				return done(err);
			});
	}
));
// Serialize
passport.serializeUser((user, done) => {
	done(null, user.id);
});
// Deserialize
passport.deserializeUser((id, done) => {
	User.findById(id)
		.then((founduser) => {
			done(null, founduser);
		})
		.catch(err => {
			done(err);
		});
});

// ROUTES----------------------------------------------------------------------------------------
// HOME
app.route('/')
	.get((req, res) => {
		res.render('home');
	});

// REGISTER
app.route('/register')
	.get((req, res) => {
		res.render('register')
	})
	.post((req, res) => {
		bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
			if (err) {
				console.log(err);
			} else {
				const newUser = new User({
					username: req.body.username,
					password: hash
				});
				newUser.save()
					.then(() => {
						passport.authenticate('local', {
							successRedirect: '/secrets',
							failureRedirect: '/login'
						})(req, res);
					});
			}
		});
	});

// LOGIN
app.route('/login')
	.get((req, res) => {
		res.render('login');
	})
	.post((req, res) => {
		const user = new User({
			username: req.body.useername,
			password: req.body.password
		});
		req.login(user, (err) => {
			if (err) {
				console.log(err);
			} else {
				passport.authenticate('local', {
					successRedirect: '/secrets'
				})(req, res);
			}
		});
	});

// SECRETS
app.route('/secrets')
	.get((req, res) => {
			User.find({"secret":{$ne:null}})
			.then((docs1) => {
				googleUser.find({"secret":{$ne:null}})
				.then((docs2) => {
					res.render('secrets', {
						firstList: docs1,
						secondList: docs2
				});
				})
				.catch(err => console.log(err));
			})
			.catch(err => console.log(err));
	});

// LOGOUT
app.route('/logout')
	.get((req, res) => {
		req.logOut(err => {
			if (err) {
				console.log(err);
			} else {
				req.session.destroy();
				res.redirect('/');
			}
		});
	});

///////////////////					GOOGLE OAUTH AUTHENTICATION					///////////////////
// Google OAuth endpoint: Transfer request to Google for Google account login
app.get("/auth/google",
	passport.authenticate('google', {scope: ['email', 'profile']}));
// Google Callback endpoint: The one we defined in [google console > Credentials > 'OAuth 2.0 Client IDs']
app.get('/google/callback', 
	passport.authenticate('google', {
		successRedirect: '/secrets',
		failureRedirect: '/auth/failure'
	})
);
// Auth Failure Endpoint
app.get('/auth/failure', (req, res) => {
	res.send('Something Went Wrong...');
});
///////////////////////////////////////////////////////////////////////////////////

// Submit
app.route("/submit")
.get(function(req, res){
	// To prevent back button redirect after log out
	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	if(req.isAuthenticated()){
		res.render("submit");
	} else {
		res.redirect("/login");
	}
})
.post(function(req, res){
	console.log(req.user);
	User.findById(req.user)
	.then(foundUser => {
		if(foundUser) {
			foundUser.secret = req.body.secret;
			return foundUser.save();
		}
		return null;
	})
	.catch(err => {
		console.log(err);
	});

	googleUser.findById(req.user)
	.then(foundUser => {
		if(foundUser) {
			foundUser.secret = req.body.secret;
			return foundUser.save();
		}
		return null;
	})
	.catch(err => {
		console.log(err);
	});

	res.redirect("/secrets");
})

// listen to port 3000
app.listen(3000, () => {
	console.log('app listening on port 3000');
});