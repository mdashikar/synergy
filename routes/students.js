const router = require('express').Router();
const passport = require('passport');
const passportConfig = require('../config/passport');
const Student = require('../models/students');
const { ProjectSubmit } = require('../models/proposals');
var crypto = require('crypto'),
algorithm = 'aes-256-ctr',
password = 'd6F3Efeq';
var proposalID;
var emailId;
var decryptedEmail;
var token;

/* SIGNUP ROUTE */
router.route('/signup/:id/:email/:token')

  .get((req, res, next) => {
    proposalID = req.params.id;
    emailId = req.params.email;
    token = req.params.token;
    decryptedEmail = decrypt(emailId);
    console.log('id: ',proposalID);
    console.log('encrypted email: ',emailId);
    console.log('email: ',decryptedEmail);
    console.log('token: ',token);

    function decrypt(text){
      var decipher = crypto.createDecipher(algorithm,password)
      var dec = decipher.update(text,'hex','utf8')
      dec += decipher.final('utf8');
      return dec;
    }

    Student.findOne({ secretToken : token }, function(err, user) {
      
          
        if (user) {
          console.log("Link damaged");
          return res.render('error');
          
        }
        res.render('accounts/signup', {user:user, message: req.flash('errors')});
  });
})

  .post((req, res, next) => {
    
    Student.findOne({ email: req.body.email }, function(err, existingUser) {
      if (existingUser) {
        req.flash('errors',  'Account with that email address already exists.');
        return res.redirect(`/signup/${proposalID}/${emailId}`);
      } else {

        
        console.log('id : ',proposalID);
        var student = new Student();
        student.name = req.body.name;
        student.username = req.body.username;
        student.email = decryptedEmail;
        student.password = req.body.password;
        student.proposal_id = proposalID;
        student.secretToken = token;

        student.save(function(err) {
          if (err) return next(err);
          req.logIn(student, function(err) {
            if (err) return next(err);
            console.log('student : ',student.proposal_id);
            res.redirect('/');
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
