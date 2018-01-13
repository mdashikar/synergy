const router = require('express').Router();
const RegisteredStudent = require('../models/registered_user');
const { ProjectSubmit } = require('../models/proposals');
const Student = require('../models/students');


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
        res.render('main/home', { title: "Synergy - Welcome" });
    }
});
router.route('/submit-proposal')
    .get((req, res, next) => {
        res.render('main/proposal_form', { title: 'Proposal Submit',successMessage: req.flash('success'),errorMessage: req.flash('error') });
    })
    .post((req, res, next) => {
        var projectSubmit = new ProjectSubmit({
            projectName: req.body.projectName,
            projectType: req.body.projectType,
            projectCourseCode: req.body.projectCourseCode,
            projectTools: req.body.projectTools,
            projectAbstract: req.body.projectAbstract,
            projectObject : req.body.projectObject,
            projectKeyFeatures : req.body.projectKeyFeatures,
            projectNumberOfModules : req.body.projectNumberOfModules,
            projectConclusion : req.body.projectConclusion,
            memberName: req.body.memberName,
            memberEmail: req.body.memberEmail,
            memberId: req.body.memberId,
            memberNumber: req.body.memberNumber,
            supervisorName : "Supervisor name will be added here when proposal is accepted",
            status : "Not Started"
        });
        console.log(projectSubmit.memberId);
        RegisteredStudent.findOne({ student_id: projectSubmit.memberId }, function(err, registered) {
            // console.log(registered.student_id + " " + projectSubmit.memberId);
            if (!registered) {
                return res.send(`${projectSubmit.memberId} is not registered`);
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
                res.status(400).send(e);
            });
            
        });

    });
router.get('/demo-proposal', (req, res, next) => {
    res.render('main/demo_proposal', { title: 'Submit Proposal' });
});
router.get('/board', (req, res, next) => {
    res.render('main/board', { title: 'Project Board' });
});
router.get('/profile', (req, res, next) => {
    res.render('accounts/profile', { title: 'Profile' });
});



module.exports = router;