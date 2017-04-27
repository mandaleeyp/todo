var express = require('express');
var exphbs  = require('express-handlebars');
var app = express();
var bodyParser = require('body-parser');
var Users = require('./models/users.js');

// Configure our app
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ extended: true}));

app.get('/', function (req, res) {
    Users.count(function (err, users) {
        if(err){
            res.send('error getting users');
        }else{
            res.render('index', {userCount: users.length});
        }
      });
});

app.post('/user/register', function (req, res) {
    var newUser = new Users();
    newUser.hashed_password = req.body.password;
    newUser.email = req.body.email;
    newUser.name = req.body.fl_name;
    newUser.save(function(err){
        if (err){
            res.send('there was an error saving the user');
        }else{
            res.redirect('/');
        }
    })
    console.log('The user has the email address', req.body.email)
});

app.listen(process.env.PORT, function () {
  console.log('Example app listening on port'+process.env.PORT);
});