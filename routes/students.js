const router = require('express').Router();
const passport = require('passport');
const passportConfig = require('../config/passport');
const Student = require('../models/students');
var proposalID;

/* SIGNUP ROUTE */
router.route('/signup/:id')

  .get((req, res, next) => {
    proposalID = req.params.id;
    res.render('accounts/signup', { message: req.flash('errors')});
  })

  .post((req, res, next) => {
    
    Student.findOne({ email: req.body.email }, function(err, existingUser) {
      if (existingUser) {
        req.flash('errors',  'Account with that email address already exists.');
        return res.redirect(`/signup/${proposalID}`);
      } else {
        console.log('id : ',proposalID);
        var student = new Student();
        student.name = req.body.name;
        student.username = req.body.username;
        student.email = req.body.email;
        student.password = req.body.password;

        student.proposal_id = proposalID;
        student.save(function(err) {
          if (err) return next(err);
          req.logIn(student, function(err) {
            if (err) return next(err);
            console.log('student : ',student.proposal_id);
            res.redirect('/profile');
          });
        });
      }
    });
  });


/* LOGIN ROUTE */
router.route('/login')

  .get((req, res, next) => {
    if (req.user) return res.redirect('/');
    res.render('accounts/login', { message: req.flash('loginMessage')});
  })

  .post(passport.authenticate('local-login', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

/* PROFILE ROUTE */
router.get('/profile', passportConfig.isAuthenticated, (req, res, next) => {
  res.render('accounts/profile');
});


router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
