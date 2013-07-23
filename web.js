var express = require("express") , passport = require('passport'), util = require('util')
 , FacebookStrategy = require('passport-facebook').Strategy;
 var FACEBOOK_APP_ID = "150506191810997"
var FACEBOOK_APP_SECRET = "c0510117225af25b201e4d9be86960ef";
var fs = require('fs');
var mongo = require('mongodb');
var isodate = require("isodate");
var mongoUri = "mongodb://heroku_app17058222:9ocu5dnk769vj6rav0so4nqpb9@ds037478.mongolab.com:37478/heroku_app17058222"; 





// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Facebook profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the FacebookStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Facebook
//   profile), and invoke a callback with a user object.
passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "http://colectivo10.herokuapp.com/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's Facebook profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Facebook account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

var app = express();
// configure Express
//var cookieParser = exports.cookieParser = express.cookieParser(config.session.secret);
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger());
  app.use(express.cookieParser('keyboard_cat'));
   //app.use(connect.cookieSession({ secret: 'tobo!', cookie: { maxAge: 60 * 60 * 1000 }}));

  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ key:'keyboard_cat',secret: 'keyboard_cat',cookie: {secure: false,maxAge: 86400000, expires : new Date(Date.now() + 86400000)} }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  /*app.use(express.session({
      store: sessionStore,
      cookie: {secure: false,maxAge: 86400000, expires : new Date(Date.now() + 86400000)},
     
      key: 'jsession_chatmefm_'+86400000, 
      secret: config.session.secret
    }));*/
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});


app.get('/', function(req, res){
  res.redirect('/map');
  //
  /*if (req.isAuthenticated()){
  	res.redirect('/menu');
  }else{
  	res.render('index', { user: req.user });
  }*/
  
});
app.get('/map/:minutes', function(req, res){


mongo.Db.connect(mongoUri,{safe:false}, function (err, db) {
  db.collection('positions', function(er, collection) {

  	var today = new Date();
  	var fecha_menor = new Date(today.getTime() - (1 * req.params.minutes * 60 * 1000)) - (1* today.getTimezoneOffset() * 60*1000);
  	console.log("today==>"+today+".... fecha menor==>"+fecha_menor);
  	var fecha = {
    "time": {
        "$gt": new Date(fecha_menor).toJSON()
    }
};
  	var criteria = fecha;
  	console.log("criteria="+JSON.stringify(criteria));
  	//console.log(fecha_menor.toISOString());
    collection.find(criteria).toArray(function(err,positions){
    	//console.log(positions.length);
    	//if(positions){res.send("SI"+positions.length);}else{res.send("NO");}
    	
	res.render('map',{points:positions,
		minutes:req.params.minutes,
		fecha_menor:new Date(fecha_menor).toJSON()});
});
  });
});

});

app.get('/map',function(req, res){
  //res.render('account', { user: req.user });
res.redirect("/map/10");

});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

app.get('/menu', ensureAuthenticated,function(req, res){
  res.render('menu', { user: req.user });
});
app.get('/select/:next_route', function(req, res){
  res.render('select', { user: req.user,next_route:req.params.next_route });
});
app.get('/track/:bus', function(req, res){
  res.render('track', { user: req.user,bus:req.params.bus });
});
app.get('/view/:bus', function(req, res){
  res.render('view', { user: req.user,bus:req.params.bus });
});
// GET /auth/facebook
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Facebook authentication will involve
//   redirecting the user to facebook.com.  After authorization, Facebook will
//   redirect the user back to this application at /auth/facebook/callback
app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){
    // The request will be redirected to Facebook for authentication, so this
    // function will not be called.
  });

// GET /auth/facebook/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/menu');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}