const Student = require('../models/students');

const async = require("async");
const config = require("../config/secret");
var Chat = require("../models/chat");
const mongoose = require("mongoose");

module.exports = function(io) {
  io.on("connection", function(socket) {
    var user = socket.request.user;
    console.log(user);
    socket.emit("user", user);
    // register listener on server
    socket.on("chatChannel", function(chat) {
      // send to all registeres
      io.emit("chatChannel", chat);
      // todo save it
      console.log(chat);
      insertChat(chat);
    });
  });

  /**
   * saves the chat item
   */
  function insertChat(chat) {
    if (mongoose.connection.readyState == 0) {
      mongoose.connect(config.database, { useMongoClient: true });
    }

    chat.when = new Date();
    var chat = new Chat(chat);

    chat.save((err, chat) => {
      if (err) console.error(err);
    });
  }

  /**
   * return some chat history
   */
  function getChats(callback) {
    // check connection
    if (mongoose.connection.readyState === 0) {
      mongoose.connect(config.database, { useMongoClient: true });
    }

    let LIMIT = 50;
    let query;

    query = Chat.find({})
      .sort({ when: -1 }) // latest first
      .limit(LIMIT);

    query.exec((err, chats) => {
      if (err) console.error(err);

      callback(chats);
    });
  }
};