
'use strict';

var _ = require('lodash');
var User = require('../user/user.model');
var Marks = require('./marks.model');
var School = require('../school/school.model');
// Get list of markss
exports.index = function(req, res) {
  Marks.find(function (err, markss) {
    if(err) { return handleError(res, err); }
    return res.json(200, markss);
  });
};

// Get a single marks
exports.show = function(req, res) {
  Marks.findById(req.params.id, function (err, marks) {
    if(err) { return handleError(res, err); }
    if(!marks) { return res.send(404); }
    return res.json(marks);
  });
};

// Get a single mark
exports.getMark = function(req, res) {
  var params = req.params;
  console.log("requested", req.params);
  _.each(req.params, function(p, pkey) {
    if((p.toLowerCase() == 'all') || (p.toLowerCase() == 'undefined')) {
      delete params[pkey];
    }
  })
  if(params.standard == "teacher") {
    params.marks = {$elemMatch:{teacherid:params.division}};
    delete params.standard;
    delete params.division;
  }
  console.log("request", params);
  Marks.find(params, null, {sort:{_id: 1}}, function (err, marks) {
    if(err) { return handleError(res, err); }
    if(!marks) { return res.send(404); }
    return res.json(marks);
  });
};
// Get a single mark
exports.listUsers = function(req, res) {
  var params = req.params;
  _.each(req.params, function(p, pkey) {
    if((p.toLowerCase() == 'all') || (p.toLowerCase() == 'undefined')) {
      delete params[pkey];
    }
  })
  console.log("requested", params);
  if(params.subject) {
    params.marks = {$elemMatch:{subject:params.subject,level:params.status}};
/*    if(params.status == "Pass") params.marks = {$elemMatch:{subject:params.subject,level:{$gte:parseInt(params.mark)}}};
    else params.marks = {$elemMatch:{subject:params.subject,mark:{$lt:parseInt(params.mark)}}};*/
  }
  if(params.standard == "teacher") {
    params.marks = {$elemMatch:{teacherid:params.division}};
    if(params.status) params.marks = {$elemMatch:{teacherid:params.division, level:params.status}};
    delete params.standard;
    delete params.division;
  }
  delete params.subject;
  delete params.status;
  delete params.mark;
  console.log("before fetch", params);
/*  Marks.distinct('studentid', params, function (err, allusers) {
    if(allusers.length > 0) {
      User.find({_id:{$in:allusers}}, null, {sort:{_id: 1}}, function (err, users) {
        if(err) { return handleError(res, err); }
        if(!users) { return res.send(404); }
        return res.json(users);
      });
    }
  });*/
  Marks.find(params, 'student studentid standard division grade rank percentage total', function(err, allmarks) {
    if(err) {return handleError(res, err);}
    if(!allmarks) { return res.send(404); }
    return res.json(allmarks);
  })
};

// Get a single mark
exports.getAllMarks = function(req, res) {
  Marks.find({typeofexam: req.params.typeofexam}, function (err, marks) {
    if(err) { return handleError(res, err); }
    if(!marks) { return res.send(404); }
    return res.json(marks);
  });
};
/*{ school: 'school a',
  schoolid: '553b23937d39d2851f8949c3',
  student: 'Student b',
  studentid: '2',
  standard: '8',
  division: 'a',
  typeofexam: 'Quaterly',
  tamil: '10',
  english: '20',
  hindi: 'ab',
  math: '20',
  science: '10',
  history: '20',
  attendance: '10/30',
  import: true }*/
// Creates a new marks in the DB.
exports.create = function(req, res) {
  if(req.body.import) {
    console.log("requested", {schoolid: req.body.schoolid, name: req.body.student, studentid: req.body.studentid, role: "student"});
    User.findOne({schoolid: req.body.schoolid, name: req.body.student, studentid: req.body.studentid, role: "student"}, function (err, student) {
      if (err) return next(err);
      if (!student) return res.send(401);
      var total = 0;
      var status = "Pass";
      var studentMark = req.body;
      var maxmark = studentMark.maxmark[0].max;
      for (var mm = 0; mm < studentMark.maxmark.length; mm++) {
        if(studentMark.maxmark[mm].standard == student.standard) maxmark = studentMark.maxmark[mm].max;
      };
      var passmark = studentMark.passmark[0].passmark;
      for (var pm = 0; pm < studentMark.passmark.length; pm++) {
        if(studentMark.passmark[pm].standard == student.standard) passmark = studentMark.passmark[pm].passmark;
      };
      console.log("Passmark", passmark);
      console.log("maxmark", maxmark);
      studentMark.marks = [];
      student.subjects.forEach(function(sub, si) {
        studentMark.marks[si] = {subject: sub.subject, teacher: sub.teacher, teacherid:sub.teacherid, maxmark:maxmark, passmark:passmark};
        if(studentMark[sub.subject] == "ab") {
          studentMark.marks[si]["status"] = "absent";
          studentMark.marks[si]["mark"] = 0;
          status = "Fail";
        } else {
          studentMark.marks[si]["status"] = "present";
          studentMark.marks[si]["mark"] = parseInt(studentMark[sub.subject]);
        }
        if(studentMark.marks[si]["mark"] < passmark) {
          status = "Fail";
          studentMark.marks[si]["level"] = "Fail";
        } else {
          studentMark.marks[si]["level"] = "Pass";
        }
        total = parseInt(total) + studentMark.marks[si]["mark"];
      })
      studentMark.studentid = student._id;
      studentMark.typeofexam = studentMark.typeofexam.toLowerCase();
      studentMark.subjects = student.subjects;
      studentMark.status = status;
      studentMark.total = total;
      studentMark.percentage = (total * (100/(student.subjects.length*maxmark))).toPrecision(2);
      studentMark.grades.forEach(function(gv, gk) {
        var mpercentage = Math.floor(studentMark.percentage);
        if((mpercentage >= gv.lesser) && ((mpercentage <= gv.greater))) {
          studentMark.grade = (status == "Fail") ? "Grade F" : gv.grade;
        }
      })
      if(studentMark.attendance) {
        var attendanceVal = studentMark.attendance.split("/");
        studentMark.attendanceP = (parseInt(attendanceVal[0]) * (100/parseInt(attendanceVal[1]))).toPrecision(4);
      }
      console.log("before store:", studentMark);
      Marks.findOne({studentid: student._id, typeofexam: studentMark.typeofexam, educationyear: studentMark.educationyear}, function(err, markcreated) {
        if (err) return next(err);
        var t = new Date();
        if(markcreated) {
          console.log("mark exists so updating the mark");
        } else {
          console.log("Create new mark");
        }
        if(markcreated) {
          var updated = _.merge(markcreated, studentMark);
          studentMark.updated = t.getTime();
          updated.save(function (err) {
          if (err) { return handleError(res, err); }
            return res.json(200, markcreated);
          });
        } else {
          studentMark.created = studentMark.updated = t.getTime();
          Marks.create(studentMark, function(err, marks) {
            if(err) { return handleError(res, err); }
            return res.json(201, marks);
          });
        }
      })
    });
  } else {
    School.findOne({school: req.body.school}, function (err, school) {
      if (err) return next(err);
      if (!school) return res.send(401);
      var d = new Date();
      delete req.body.serverUpdate;
      console.log("before store:", req.body);
      Marks.create(req.body, function(err, marks) {
        if(err) { return handleError(res, err); }
        return res.json(201, marks);
      });
    });
  }
};

// Updates an existing marks in the DB.
exports.update = function(req, res) {
  if(req.body.import) {
    Marks.findById(req.params.id, function (err, marks) {
      if (err) { return handleError(res, err); }
      if(!marks) { return res.send(404); }
      var updated = _.merge(marks, req.body);
      updated.save(function (err) {
        if (err) { return handleError(res, err); }
        return res.json(200, marks);
      });
    });
  } else {
    if(req.body._id) { delete req.body._id; }
      console.log("requested", req.body);
      School.findOne({school: req.body.school}, function (err, school) {
      if (err) return next(err);
      if (!school) return res.send(401);
      var total = 0;
      var status = "Pass";
      req.body.marks.forEach(function(v) {
        console.log("v:", req.body.marks[v]);
        console.log("v1:", parseInt(req.body.marks[v]));
        if(req.body.marks[v] < school.passmark) {
          status = "Fail";
        }
        total = parseInt(total) + parseInt(req.body.marks[v]);
      });    
      req.body.total = total;
      req.body.percentage = total * (100/(req.body.subjects.length*100));
      school.grades.forEach(function(v) {
        if((req.body.percentage >= v.lesser) && ((req.body.percentage <= v.greater))) {
          req.body.grade = (status == "Fail") ? "Grade F" : v.grade;
        }
      })
      req.body.status = status;
      Marks.findById(req.params.id, function (err, marks) {
        if (err) { return handleError(res, err); }
        if(!marks) { return res.send(404); }
        var updated = _.merge(marks, req.body);
        updated.save(function (err) {
          if (err) { return handleError(res, err); }
          return res.json(200, marks);
        });
      });
    });
  }
};

// Deletes a marks from the DB.
exports.destroy = function(req, res) {
  Marks.findById(req.params.id, function (err, marks) {
    if(err) { return handleError(res, err); }
    if(!marks) { return res.send(404); }
    marks.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}