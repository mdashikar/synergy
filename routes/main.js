const router = require('express').Router();
const RegisteredStudent = require('../models/registered_user');
const { ProjectSubmit } = require('../models/proposals');


router.get('/', (req, res, next) => {
    res.render('main/home', { title: "Synergy - Welcome" });
});
router.route('/submit-proposal')
    .get((req, res, next) => {
        res.render('main/proposal_form', { title: 'Proposal Submit',successMessage: req.flash('success') });
    })
    .post((req, res, next) => {
        var projectSubmit = new ProjectSubmit({
            projectName: req.body.projectName,
            projectType: req.body.projectType,
            projectCourseCode: req.body.projectCourseCode,
            projectTools: req.body.projectTools,
            projectSummary: req.body.projectSummary,
            memberName: req.body.memberName,
            memberEmail: req.body.memberEmail,
            memberId: req.body.memberId,
            memberNumber: req.body.memberNumber
        });
        console.log(projectSubmit.memberId);
        RegisteredStudent.findOne({ student_id: projectSubmit.memberId }, function(err, registered) {
            // console.log(registered.student_id + " " + projectSubmit.memberId);
            if (!registered) {
                return res.send(`${projectSubmit.memberId} is not registered`);
            }
            projectSubmit.save().then((doc) => {
                //res.send(doc);
                //  res.status(200).send('welcome', doc);
                req.flash('success', 'Proposal Submitted!');
                res.redirect('/submit-proposal');
                console.log('In saving page');
                //res.render('projectList', doc);
            }, (e) => {
                res.status(400).send(e);
            });
        });

        // projectSubmit.save().then((doc) => {
        //     //res.send(doc);
        //     res.send(doc);
        //     //res.redirect('/submit-proposal');
        //     console.log('In saving page');
        //     //res.render('projectList', doc);
        // }, (e) => {
        //     res.status(400).send(e);
        // });
    });
router.get('/demo-proposal', (req, res, next) => {
    res.render('main/demo_proposal', { title: 'Submit Proposal' });
});


module.exports = router;