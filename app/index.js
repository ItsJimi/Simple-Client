const express = require('express')
const app = express()
const session = require('express-session')
const got = require('got')

const passport = require('passport')
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy

app.set('view engine', 'ejs')
app.set('views', './app/views')
app.use(express.static('./app/public'))

app.use(session({
	secret: 'c0d3ee68d031',
	resave: false,
	saveUninitialized: true
}))
app.use(passport.initialize())

passport.use('oauth42', new OAuth2Strategy({
	authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
	tokenURL: 'https://api.intra.42.fr/oauth/token',
	clientID: '',
	clientSecret: '',
	callbackURL: "http://localhost:3000/listen/callback"
}, (accessToken, refreshToken, profile, done) => {
		console.log('Access : ' + accessToken);
		console.log('Refresh : ' + refreshToken);
		console.log('Profile : ');
		console.log(profile);
		done(null, accessToken, refreshToken, profile)
	}
))

var tokens = []

passport.use('oauthListen', new OAuth2Strategy({
	authorizationURL: 'https://auth.test.listenetwork.com/oauth/authorize',
	tokenURL: 'https://auth.test.listenetwork.com/oauth/token',
	clientID: '',
	clientSecret: '',
	callbackURL: "http://192.168.0.24:3000/listen/callback"
}, (accessToken, refreshToken, profile, done) => {
		console.log('Access : ' + accessToken);
		console.log('Refresh : ' + refreshToken);
		console.log('Profile : ');
		console.log(profile);
		tokens.push({
			accessToken: accessToken,
			refreshToken: refreshToken,
			profile: profile
		})
		done(null, accessToken, refreshToken, profile)
	}
))

app.get('/', (req, res) => {
	if (req.session && req.session.username) {
		res.render('index', {
			logged: true,
			username: req.session.username
		})
	}
	else {
		res.render('index', {
			logged: false
		})
	}
})

app.get('/profile', (req, res) => {
	if (req.session && req.session.username) {
		res.render('profile', {
			username: req.session.username,
			token: req.session.token,
			apps: req.session.apps
		})
	}
	else {
		res.redirect('/')
	}
})

app.get('/signout', (req, res) => {
	req.session.destroy()
	res.redirect('/')
})

app.get('/listen', passport.authenticate('oauthListen', { scope: ['public', 'test', 'bla'] }))

app.get('/listen/callback', passport.authenticate('oauthListen', { failureRedirect: '/', session: false }), function(req, res) {
	got.get('https://api.test.listenetwork.com/users/me', {
	    headers: {
	        Authorization: "Bearer " + req.user
	    },
	    json: true
	}).then((response) => {
		if (response.body.success) {
			req.session.username = response.body.user.username
			req.session.token = req.user
			req.session.apps = response.body.user.apps
		}
		res.redirect('/')
	}).catch((err) => {
		console.log(err)
		res.redirect('/')
	})
})

app.listen(3000, () => {
	console.log('Hello !');
})
