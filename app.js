let express = require('express');
let app = express();
let User = require('./models/userModel');
let session = require('express-session');
let passport = require('passport');
let expressValidator = require('express-validator');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let LocalStrategy = require('passport-local').Strategy;

mongoose.connect('mongodb://localhost/verbinden');
mongoose.connection.on('connected', () => {
    console.log('DB Connected');
});

app.set('view engine','pug');
app.set('views','./views');

// Body Parser Middleware
app.use(bodyParser.urlencoded({
    extended: true
  }));

// Set Public Folder
app.use(express.static('public'));


// Cookie Parser Middleware
app.use(cookieParser());

app.use(session({
    secret:'secret',
    saveUninitialized: true,
    resave: true
}))

// Validation
app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
        , root    = namespace.shift()
        , formParam = root;

      while(namespace.length) {
        formParam += '[' + namespace.shift() + ']';
      }
      return {
        param : formParam,
        msg   : msg,
        value : value
      };
    }
  }));


  //Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

//Global Variables
app.use((req,res,next) => {
    res.locals.user = req.user || null;
    next();
});



// Main GET Route
app.get('/', (req,res) => {
    if (req.isAuthenticated()) {
        res.render('console');
        } else {
         res.render('login');
        }

});

app.get('/register', (req,res) => {
    res.render('register');
});


//Main Post route 
app.post('/register', (req,res) => {
let name = req.body.name;
let email = req.body.email;
let password = req.body.password;
let password2 = req.body.password2;

//Validation
req.checkBody('name', 'Name is Required').notEmpty();
req.checkBody('email', 'Email is required').notEmpty();
req.checkBody('email', 'Please enter a valid email address').isEmail();
req.checkBody('password', 'Password is required').notEmpty();
req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

let errors = req.validationErrors();


if(errors) {
    res.render('register', {
        errmessage: 'There was a validation problem with the information you entered. Please try again'
    });
} else {
    let newUser = new User({
        name:name,
        email:email,
        password:password,
    });

User.createUser(newUser, (err,user) => {
    if(err) throw err;
    console.log(user);
});
console.log('User is registered');
res.render('login', {
    success: 'User was Created!'
});

}
});

passport.use(new LocalStrategy(
    (email, password, done) => {
        User.getUserByEmail(email, (err,user) => {
            if(err) {
                console.log(err)
            }
            if(!user){
                return done(null,false,{message: 'Unknown User'});
            }
        User.comparePassword(password, user.password, (err, isMatch) => {
            if(err) throw err;
            if(isMatch){
                return done(null,user);
            } else {
                return done(null, false, {message: 'Invalid Password'});
            }
        });
      });
    }));
    
    passport.serializeUser(function(user, done) {
        done(null, user.id);
      });
    
      passport.deserializeUser(function(id, done) {
        User.getUserById(id, function(err, user) {
          done(err, user);
        });
      });
    
    

app.post('/login',
passport.authenticate('local', {successRedirect:'/', failureRedirect:'/users/loginerror', failureFlash:false}),
(req, res) => {
  res.redirect('/');
});


app.get('/logout', (req,res) => {
       req.logout();
      res.render('logout');
});


app.listen(80);