'use strict';

var _ = require('lodash');
var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var School = require('../school/school.model');
var Marks = require('../marks/marks.model');

var validationError = function(res, err) {
  return res.json(422, err);
};

var createParent = function(res, request, student) {
  //Create Parent
  var parentEmail = request.parentphone;
  console.log("parent email", parentEmail);
  console.log("parent name", request.parent);
  User.findOne({
    email: parentEmail,
    name: request.parent,
    role: "parent"
  }, function(err, parentData) { // don't ever give out the password or salt
    if (err) return next(err);
    console.log("parentData", parentData);
    if(parentData) {
      parentData.name = request.parent;
      if(student._id) {
        parentData.students.push({id:student.id,name:student.name,class:student.standard+'-'+student.division,subjects:student.subjects});
      }
      parentData.phone = request.parentphone;
      parentData.pepper = Math.random().toString(36).substring(9);
      parentData.password = parentData.pepper;
      parentData.provider = request.provider;
      parentData.school = request.school;
      parentData.schoolid = request.schoolid;
      parentData.save(function (err) {
        if (err) { return validationError(res, err); }
        return createTeacher(res, request, student);  
      });
    } else {
      var parentData = {};
      parentData.name = request.parent;
      parentData.email = parentEmail;
      parentData.school = 
      parentData.role = "parent";
      if(student._id) {
        parentData.students = [{id:student._id,name:student.name,class:student.standard+'-'+student.division,subjects:student.subjects}];
      }
      parentData.phone = request.parentphone;
      parentData.pepper = Math.random().toString(36).substring(9);
      parentData.password = parentData.pepper;
      parentData.provider = request.provider;
      parentData.school = request.school;
      parentData.schoolid = request.schoolid;
      var newParent = new User(parentData);
      newParent.save(function(err, parent) {
        if (err) return validationError(res, err);
        console.log("Parent Created");
        return createTeacher(res, request, student);  
      });        
    }
  });  
}

var createTeacher = function(res, request, student) {
  //Create Teacher
  var teacherEmail = request.teacherphone;
  console.log("Email: "+teacherEmail);
  User.findOne({email:teacherEmail, role:"teacher"}, function(err, teacherData) {
    if (err) return next(err);
    console.log("techerData", teacherData);
    if(teacherData) {
      teacherData.school = request.school;
      teacherData.schoolid = request.schoolid;
      teacherData.name = request.teacher.toLowerCase();
      teacherData.phone = request.teacherphone;
      teacherData.pepper = Math.random().toString(36).substring(9);
      teacherData.password = teacherData.pepper;
      teacherData.provider = request.provider;
      if(Object.keys(student).length > 0) {
        teacherData.students.push({id:student.id,name:student.name,class:student.standard+'-'+student.division,subjects:student.subjects});
      }
      if(request.classes) teacherData.subjects = request.classes;
      if(request.typeofexams) teacherData.typeofexams = request.typeofexams;
      if(request.standard) teacherData.standard = request.standard;
      if(request.division) teacherData.division = request.division;      
      teacherData.save(function (err) {
        if (err) { return validationError(res, err); }
        console.log("Teacher updated");
        return res.json(200, teacherData);
      });
    } else {
      var teacherData = {};
      teacherData.name = request.teacher.toLowerCase();
      teacherData.email = teacherEmail;
      teacherData.role = "teacher";
      if(Object.keys(student).length > 0) teacherData.students = [{id:student._id,name:student.name,class:student.standard+'-'+student.division,subjects: student.subjects}];
      teacherData.phone = request.teacherphone;
      teacherData.pepper = Math.random().toString(36).substring(9);
      teacherData.password = teacherData.pepper;
      teacherData.provider = request.provider;
      teacherData.school = request.school;
      teacherData.schoolid = request.schoolid;
      if(request.classes) teacherData.subjects = request.classes;
      if(request.typeofexams) teacherData.typeofexams = request.typeofexams;
      if(request.standard) teacherData.standard = request.standard;
      if(request.division) teacherData.division = request.division;      
      var newTeacher = new User(teacherData);
      newTeacher.save(function(err, teacher) {
        if (err) return validationError(res, err);
        console.log("Teacher Created");          
        return res.json(200, teacher);
      });    
    }
  });
}
/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.send(500, err);
    res.json(200, users);
  });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  if(req.body.accounttype == "Teacher") {
    req.body.classes = [];
    _.each(req.body.subjects.split(","), function(cv, ck) {
      var cdata = cv.split(":");
      if(cdata[1].indexOf("-") == -1) cdata[1] = cdata[1] + "-all";
      req.body.classes.push({subject: cdata[0], class:cdata[1]});
    })
    console.log("requested", req.body);
    return createTeacher(res, req.body, {});
  }
  //Create student
  var userData = req.body;
  userData.provider = 'local';
  userData.role = "student";
  userData.pepper = Math.random().toString(36).substring(10);
  userData.password = userData.pepper;
  userData.name = req.body.student;
  if(req.body.import) {
    var allsubjects = [];
    var subjects = req.body.subjects.split(",");
    _.each(subjects, function(sv, sk) {
      var sub = sv.toLowerCase().split(":");
      console.log("subject", {role:"teacher",name:sub[1],subjects:{$elemMatch:{subject:sub[0],class:req.body.standard+"-"+req.body.division}}});
      User.findOne({role:"teacher",name:sub[1],subjects:{$elemMatch:{subject:sub[0]}}}, 'id', function(terr, ateacher) {
        console.log("ateacher", ateacher);
        if(ateacher) {
          allsubjects.push({subject: sub[0], teacher: sub[1],teacherid:ateacher.id});
        }
        if(sk == (subjects.length - 1)) {
          userData.subjects = allsubjects;
          userData.typeofexams = req.body.typeofexams.replace(/ /g,"").split(",");
          console.log("Requested: ", userData);
          User.findOne({
            email:req.body.email,
            role:"student",
          }, '-salt -hashedPassword', function(err, studentData) {
            if (err) return validationError(res, err);
            if(studentData) {
              var studentUpdated = _.merge(studentData, userData);
              studentUpdated.save(function (err) {
                if (err) { return validationError(res, err); }
                console.log("Student Updated");
                return createParent(res, req.body, studentData);        
              });
            } else {
              var userStudent = new User(userData);
              userStudent.save(function(err, student) {
                if (err) return validationError(res, err);
                console.log("Student Created");
                return createParent(res, req.body, student);
              });      
            }
          });
        }
      })
    })          
  } else {    
    var newUser = new User(userData);
    newUser.provider = "local";
    newUser.role = 'user';
    newUser.save(function(err, user) {
      if (err) return validationError(res, err);
      var studentUpdated = _.merge(studentData, userData);
      studentUpdated.save(function (err) {
        if (err) { return validationError(res, err); }
        return res.json(200, studentData);
      });
      var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
      res.json({ token: token });
    });
  }
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, '-pepper -hashedPassword -provider -salt', function (err, user) {
    if (err) return next(err);
    if (!user) return res.send(401);
    console.log("user", user);
    res.json(user);
  });
};

/**
 * Get multiple users
 */
exports.users = function (req, res, next) {
  var fields = {_id:1, name:1, standard:1, division:1, role:1, sex:1, teacher:1};
  _.each(req.params, function(p, pk) {
    if((p == 'all') || (p == 'undefined')) {
      delete req.params[pk];
    }
  })
  if(req.params._id) {
    req.params._id = {$in: req.params._id.split("|")};
  }
  if(req.params.standard == 'teacher') {
    req.params.subjects = {$elemMatch: {teacherid: req.params.division}};
    delete req.params.standard;
    delete req.params.division;
  }
  if(req.params.name) req.params.name = {$in:req.params.name.split(",")};
  //var roles = (req.params.indexOf(",") == -1) req.params.role : req.params.
  if(req.params.role.indexOf('teacher') >= 0) {fields.subjects = 1;}
  console.log("fields", fields);
  console.log("role", req.params.role);
  req.params.role = {$in:req.params.role.split(",")};
  console.log("requested users", req.params);
  User.find(req.params, fields).sort({stardard: -1}).exec(function(err, user) {
    if (err) return next(err);
    if (!user) return res.send(401);
    res.json(user);
  })
};

var senduserdata = function(res, user, data, marksparam) {
  School.findOne({
        school: user.school
      }, function(err, school) {
        if (err) return next(err);
        if(!school) return res.json(401);
        data.passmark = school.passmark;
        data.grades = school.grades;
        data.schoolid = school._id;
        data.school = user.school;
        data.period = school.period;
        console.log("marksparam", marksparam);
        Marks.find(marksparam).sort({_id: 1}).populate('*').exec(function(err, allmarks) {
          var totalmarks = allmarks.length;
          data.typeofexams = [];
          data.years = [];
          console.log("totalmarks", totalmarks);
          if(totalmarks > 0) {
            _.each(allmarks, function(m, mkey) {
              if(data.typeofexams.indexOf(m.typeofexam) == -1) {
                data.typeofexams.push(m.typeofexam);
              }
              if(data.years.indexOf(m.educationyear) == -1) {
                data.years.push(m.educationyear);
              }
              if(mkey == totalmarks - 1) {
                data.educationyear = m.educationyear;
                data.latesttypeofexam = m.typeofexam;
                console.log("Data", data)
                res.json(data);
              }
            })
          } else {
            res.json(data);
          }
        });
      });
}
/**
* Verify an user
*/
exports.verify = function(req, res, next) {
console.log('user', req.body); 
User.findOne({
    email: req.body.email
  }, function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if(user.authenticate(req.body.password)) {
      if (!user) return res.json(401);
      var data = {};
      data._id = user._id;
      data.email = user.email;
      data.name = user.name;
      data.role = user.role;
      data.token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
      data.students = user.students;
      data.phone = user.phone;
      data.subjects = user.subjects;
      var marksparam = {school: user.school};
      if(user.role == 'teacher') {
        if(user.standard) {
          marksparam.division = data.division = user.division;
          marksparam.standard = data.standard = user.standard;
        } else {
          marksparam.marks = {$elemMatch:{"teacher":user.name}};
          /*User.find({school: user.school, role: "student", subjects:{$elemMatch:{"teacher":user.name}}, function(err, teacherwoc) {
            if(teacherwoc) {
              data.classes = [];
              _.each(teacherwoc, function(tv, tk) {
                if(data.classes.indexOf(tv.standard+':'+tv.division) == -1) {
                  data.classes.push(tv.standard+':'+tv.division);
                }
              })
            }
          })*/
        }
/*        data.typeofexams = user.typeofexams;
        var subjects = {};
        for (var i = 0; i <= user.students.length - 1; i++) {
          subjects = _.merge(subjects, user.students[i].subjects);
        }
        data.subjects = subjects;*/
      } else if (user.role == 'parent') {
        var allkids = [];
        _.each(user.students, function(s, skey) {
            allkids.push(s.id);
        })
        marksparam.studentid = {$in: allkids};
      }
      senduserdata(res, user, data, marksparam);
      /* else if (user.role == "hm") {
        User.find({schoolid: user.schoolid, role: "student"}, function(er, allusers) {
          var subjects = [];
          var typeofexams = [];
          for (var i = 0; i <= allusers.length - 1; i++) {
            for (var j = 0; j < allusers[i].subjects.length; j++) {
              if(subjects.indexOf(allusers[i].subjects[j]) == -1) {
                subjects.push(allusers[i].subjects[j]);
              }
            }
            for (var k = 0; k < allusers[i].typeofexams.length; k++) {
              if(typeofexams.indexOf(allusers[i].typeofexams[k]) == -1) {
                typeofexams.push(allusers[i].typeofexams[k]);
              } 
            }
          }
          data.subjects = subjects;
          data.typeofexams = typeofexams;  
          senduserdata(res, user, data);
        })
      }*/
    } else {
      res.json({status: 'password not matching'});
    }
  }); 
}

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndRemove(req.params.id, function(err, user) {
    if(err) return res.send(500, err);
    return res.send(204);
  });
};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    if(user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.send(200);
      });
    } else {
      res.send(403);
    }
  });
};

/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.json(401);
    res.json(user);
  });
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};
