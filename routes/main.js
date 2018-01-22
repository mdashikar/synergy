const router = require('express').Router();
const RegisteredStudent = require('../models/registered_user');
const { ProjectSubmit } = require('../models/proposals');
const Student = require('../models/students');
const Schedule = require('../models/schedule_form');


router.get('/', (req, res, next) => {
    if(req.user){
        let user = req.user;
        //res.render('main/welcome', {title: 'Project Board', user:user});
        ProjectSubmit.find({'_id': user.proposal_id}).then((projects) => {
            console.log("inside: ",user.proposal_id)
            res.render('main/welcome', { title: 'Project Board', projects: projects,
            errorMessage: req.flash('errors'),successMessage: req.flash('success')});            
        });
    }else{
        Schedule.find({showNav : true}).then((schedule) => {
            console.log("schedule : "+schedule);
          res.render('main/home', { title: "Synergy - Welcome", schedule:schedule });
        });
       
    }
});
router.route('/submit-proposal')
    .get((req, res, next) => {
        res.render('main/proposal_form', { title: 'Proposal Submit',successMessage: req.flash('success'),errorMessage: req.flash('error') });
    })
    .post((req, res, next) => {

        RegisteredStudent.findOne({ student_id: req.body.memberId}, function(err, registered) {
            var projectSubmit = new ProjectSubmit({
              projectName: req.body.projectName,
              projectType: req.body.projectType,
              projectCourseCode: req.body.projectCourseCode,
              projectTools: req.body.projectTools,
              projectAbstract: req.body.projectAbstract,
              projectObject: req.body.projectObject,
              projectKeyFeatures: req.body.projectKeyFeatures,
              projectNumberOfModules:
              req.body.projectNumberOfModules,
              projectConclusion: req.body.projectConclusion,
              memberName: req.body.memberName,
              memberEmail: req.body.memberEmail,
              memberId: req.body.memberId,
              memberNumber: req.body.memberNumber,
              supervisorName:
                "Supervisor name will be added here when proposal is accepted",
              status: "Not Started",
              year: registered.year,
              semester: registered.semester,
              time : ""
            });
            if (!registered) {
                //return res.send(`${projectSubmit.memberId} is not registered`);
                req.flash('error',`${projectSubmit.memberId} is not registered`);
                return res.redirect('/submit-proposal');
            }
            projectSubmit.save().then((doc) => 
            {
                //res.send(doc);
                //  res.status(200).send('welcome', doc);
                req.flash('success', 'Proposal Submitted!');
                res.redirect('/submit-proposal');
                console.log('In saving page');
                //res.render('projectList', doc);
            }, (e) => 
            {
                //res.status(400).send(e);
                req.flash('error','Duplication error!');
                res.redirect('/submit-proposal');
            });
            
        });

    });
router.get('/demo-proposal', (req, res, next) => {
    res.render('main/demo_proposal', { title: 'Submit Proposal' });
});
router.get('/board', (req, res, next) => {
    res.render('main/board', { title: 'Project Board' });
});
var value;
router.get('/profile/:id', (req, res, next) => {
    value = req.params.id;
    res.render('accounts/profile', { title: 'Profile' , errorMessage: req.flash('error')});
});
router.post('/edit-name/:id', (req,res,next) => {
    var editedName = req.body.name;
    var id = req.params.id;
    console.log(id);
    Student.findOne({ _id: id }, function (err, doc){
        doc.name = editedName;
        doc.save();
    });
   // res.render('main/welcome', { title: 'Profile' });
   res.redirect('/');
});


router.post('/edit-password/:id' , function (req, res, next) {
    var id = req.params.id;
    var newpass = req.body.npassword;
    var newpassconfirm = req.body.cpassword;
    if (newpass != newpassconfirm) {
        req.flash('error','New password and confirm password did not match!');
       console.log("not same");
        res.redirect(`/profile/${id}`);
    }
    else
    {
        Student.findOne({ _id: id }, function (err, doc){
            doc.password = newpass;
            doc.save(function(err){
                if (err) { next(err) }
                else {
                    res.redirect('/');
                }
            });
        });
    }
    
    
});

module.exports = router;