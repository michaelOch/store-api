import env from "dotenv";
env.config();

import '@babel/polyfill'
import express from "express";
import passport from "passport";
import {join} from 'path';
import routes from "./routes";

var cors = require('cors')
var app = express();

app.use(cors());

const LocalStrategy = require('passport-local').Strategy;
let User = require('./model/user');

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

//passport config
app.use(passport.initialize());
app.get('/', (req, res) => {;
  res.json({status: true, msg: "Welcome to Cherry Store api!!!!"})
});

app.use(express.static(__dirname + '/public'));
const publicImages = express.static(join(__dirname, '../uploads/'));
app.use('/uploads', publicImages);

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
  User.authenticate()
));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//api routes v1
app.use('/v1', routes);

app.listen(process.env.PORT || 3001, console.log(`Server running on port http://localhost:${process.env.PORT}`))