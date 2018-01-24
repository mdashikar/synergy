const router = require('express').Router();
const passport = require('passport');
const passportConfig = require('../config/passport');
const Student = require('../models/students');
var async = require('async');
const mailer = require('../misc/mailer');
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
    res.render('accounts/login', { errorMessage: req.flash('errors'),successMessage: req.flash('success')});
  })

  .post(passport.authenticate('local-login', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

/* PROFILE ROUTE */
// router.get('/profile', passportConfig.isAuthenticated, (req, res, next) => {
//   res.render('accounts/profile');
// });


router.post('/forgot-password', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      Student.findOne({ email: req.body.emailForgot }, function(err, user) {
        if (!user) {
          req.flash('errors', 'No account with that email address exists.');
          return res.redirect('/login');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      const html = 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
      'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
      'http://' + req.headers.host + '/reset-password/' + token + '\n\n' +
      'If you did not request this, please ignore this email and your password will remain unchanged.\n';
      
  
    

      mailer.sendEmail('admin@synergy.com',req.body.emailForgot,'Reset password',html);
     
      req.flash('success', 'A reset-password mail has been sent to your email address.Check it out!');
      res.redirect('/login');

      
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/login');
  });
});

//reset password


router.get('/reset-password/:token', function(req, res) {
  Student.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
  //User.findOne({resetPasswordToken:req.params.token}, function(err, user) {
      
    if (!user) {
      req.flash('errors', 'No user with this email');
     // console.log("inside reset password get");
      return res.redirect('/login');
    }
    res.render('accounts/reset-password', {
      user: user
    });
 
  });
});

router.post('/reset-password/:token', function(req, res) {
  async.waterfall([
    function(done) {
      Student.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    //  User.findOne({resetPasswordToken: req.params.token}, function(err, user) {
        if (!user) {
          req.flash('errors', 'Password reset token is invalid or has expired.');
          return res.redirect('/');
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
      const html = 'Hello,\n\n' +
      'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      
      mailer.sendEmail('admin@synergy.com',user.email,'Password change confirmation',html);
      res.redirect('/login');
      
    }
  ], function(err) {
    res.redirect('/login');
  });
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
