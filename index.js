var express = require('express');
var exphbs  = require('express-handlebars');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);
var Users = require('./models/users.js');

// Configure our app
var store = new MongoDBStore({
    uri: process.env.MONGO_URL,
    collection: 'sessions'
    // 'mongodb://localhost:27017/connect_mongodb_session_test'
});
  
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ extended: true}));
app.use(session({
    secret: 'hello',
    resave: false,
    saveUninitialized: true,
    cookie: {secure: 'auto'},
    store: store
}))

app.use(function(req, res, next){
    console.log('req.session=', req.session);
    if(req.session.userId){
        Users.findById(req.session.userId, function(err, user){
            if(!err){
                res.locals.currentUser = user;
            }
            next();
        })
    }else{
        next();
    }
});

app.get('/', function (req, res) {
    Users.count(function (err, users) {
        if(err){
            res.send('error getting users');
        }else{
            res.render('index', {
                userCount: users.length,
                currentUser: res.locals.currentUser,
            });
        }
      });
});

app.post('/user/register', function (req, res) {
    if(req.body.password !== req.body.password_confirmation){
        return res.render('index', {errors: "Password and password confirmation do not match"});
    }
    
    var newUser = new Users();
    newUser.hashed_password = req.body.password;
    newUser.email = req.body.email;
    newUser.name = req.body.fl_name;
    newUser.save(function(err, user){
        if (err){
            err = 'Error registering you!'
            res.render('index', {errors: err});
        }else{
            req.session.userId = user._id;
            res.redirect('/');
        }
    });
    console.log('The user has the email address', req.body.email);
});

app.post('/user/login', function (req, res) {
    var user = Users.findOne({email: req.body.email}, function(err, user){
        if(err){
            res.send('bad login, no such user');
            return;
        }
        user.comparePassword(req.body.password, function(err, isMatch){
            if (err || !(isMatch)){
                res.send('bad password!');
            }else{
                req.session.userId = user._id;
                res.redirect('/')
            }
        });
    })
});

app.get('/user/logout', function(req, res){
    req.session.destroy();
    res.redirect('/');
});

app.listen(process.env.PORT, function () {
  console.log('Example app listening on port'+process.env.PORT);
});