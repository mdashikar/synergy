const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const flash = require('express-flash');
const hbs = require('hbs');
const path = require('path');
const expressHbs = require('express-handlebars');
const passportSocketIo = require("passport.socketio");
var Chat = require("../models/chat");
const config = require('../config/secret');
const sessionStore = new MongoStore({ url: config.database, autoReconnect: true });

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);



mongoose.connect(config.database, function(err) {
  if (err) console.log(err);
  console.log("Connected to the database");
});

app.engine('.hbs', expressHbs({ defaultLayout: 'layout', extname: '.hbs' }));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, '../public')));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.secret,
  store: new MongoStore({ url: config.database, autoReconnect: true })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});

io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,       // the same middleware you registrer in express
  key:          'connect.sid',       // the name of the cookie where express/connect stores its session_id
  secret:       config.secret,    // the session_secret to parse the cookie
  store:        sessionStore,        // we NEED to use a sessionstore. no memorystore please
  success:      onAuthorizeSuccess,  // *optional* callback on success - read more below
  fail:         onAuthorizeFail,     // *optional* callback on fail/error - read more below
}));

function onAuthorizeSuccess(data, accept){
  console.log('successful connection to socket.io');
  accept();
}

function onAuthorizeFail(data, message, error, accept){
  console.log('failed connection to socket.io:', message);
  if(error)
    accept(new Error(message));
}

require('../realtime/io')(io);

const mainRoutes = require('../routes/main');
const userRoutes = require('../routes/students');

app.use(mainRoutes);
app.use(userRoutes);

app.get("/chat-channel", (req, res) => {
  function getChats(callback) {
    // check connection
    if (mongoose.connection.readyState === 0) {
      mongoose.connect(config.database, { useMongoClient: true });
    }

    let LIMIT = 10;
    let query;

    query = Chat.find({})
      .sort({ when: -1 }) // latest first
      .limit(LIMIT);

    query.exec((err, chats) => {
      if (err) console.error(err);

      callback(chats);
    });
  }

  getChats(chats => {
    res.render("main/chat", { chats: chats });
    console.log("Chat", chats);
  });
});

http.listen(config.port, (err) => {
  if (err) console.log(err);
  console.log(`Running on port ${config.port}`);
});
