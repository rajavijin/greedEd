'use strict';

/**
 * @ngdoc function
 * @name greenEdBackendApp.controller:AddstudentCtrl
 * @description
 * # AddstudentCtrl
 * Controller of the greenEdBackendApp
 */
angular.module('greenEdBackendApp')
.controller('AddstudentCtrl', function ($scope, $rootScope, $firebaseArray, $window, user, $q, $timeout, Auth, Ref) {
  console.log("User in teacher", settings);
  var reset = function() {
    $scope.import = false;
    $rootScope.title = "Add Student";
    $scope.msg = '';
    $scope.step = 1;
    $scope.student = {};
    $scope.student.subjects = [{subject:''}];
  }
  reset();
  $scope.teachers = $firebaseArray(Ref.child(settings.sid+'/users/teachers'));
  $scope.next = function(step) {
    console.log("Step", step);
    if(step == 7) {
      $scope.msg = "Creating Teacher...";
      var allsubjects = [];
      var teacher = $scope.student;
      teacher.email = teacher.phone +'@ge.com';
      teacher.pepper = Math.random().toString(36).slice(-8);
      teacher.password = teacher.pepper;
      teacher.role = "teacher";
      teacher.school = user.school;
      teacher.schoolid = settings.sid;
      teacher.subjects.forEach(function(sk, sv) {
        if(sk["$$hashKey"]) delete sk["$$hashKey"]; 
      })
      console.log("finally", teacher);
      // Ref.child("users").orderByChild("email").equalTo(teacher.email).once('value', function(tsnap) {
      //   console.log("snap val", tsnap.val());
      //   if(tsnap.val() === null) {
      //     Auth.$createUser({email: teacher.email, password: teacher.pepper})
      //     .then(function (usercreated) {
      //       console.log("user created", usercreated);
      //       return createProfile(usercreated, teacher);
      //     })
      //     .then(function() { 
      //       $scope.msg = "Teacher has been created successfully";
      //     }, showError);
      //   } else {
      //     $scope.msg = "Teacher already exists";
      //     $scope.$apply();
      //   }
      // })
  	} else {
      $scope.step = step + 1;
    }
  }
  $scope.radioInit = function() {
    var d = document;
    var safari = (navigator.userAgent.toLowerCase().indexOf('safari') != -1) ? true : false;
    var gebtn = function(parEl,child) { return parEl.getElementsByTagName(child); };
    var check_it = function() {
        var inp = gebtn(this,'input')[0];
        if (this.className == 'label_check c_off' || (!safari && inp.checked)) {
            this.className = 'label_check c_on';
            if (safari) inp.click();
        } else {
            this.className = 'label_check c_off';
            if (safari) inp.click();
        };
    };
    var turn_radio = function() {
        var inp = gebtn(this,'input')[0];
        if (this.className == 'label_radio r_off' || inp.checked) {
            var ls = gebtn(this.parentNode,'label');
            for (var i = 0; i < ls.length; i++) {
                var l = ls[i];
                if (l.className.indexOf('label_radio') == -1)  continue;
                l.className = 'label_radio r_off';
            };
            this.className = 'label_radio r_on';
            if (safari) inp.click();
        } else {
            this.className = 'label_radio r_off';
            if (safari) inp.click();
        };
    };
          var body = gebtn(d,'body')[0];
            body.className = body.className && body.className != '' ? body.className + ' has-js' : 'has-js';
            if (!d.getElementById || !d.createTextNode) return;
            var ls = gebtn(d,'label');
            for (var i = 0; i < ls.length; i++) {
                var l = ls[i];
                if (l.className.indexOf('label_') == -1) continue;
                var inp = gebtn(l,'input')[0];
                if (l.className == 'label_check') {
                    l.className = (safari && inp.checked == true || inp.checked) ? 'label_check c_on' : 'label_check c_off';
                    l.onclick = check_it;
                };
                if (l.className == 'label_radio') {
                    l.className = (safari && inp.checked == true || inp.checked) ? 'label_radio r_on' : 'label_radio r_off';
                    l.onclick = turn_radio;
                };
            };
  }
  function showError() {
    alert("error");
  }

  function createProfile(userData, user) {
    var ref = Ref.child('users/'+userData.uid), def = $q.defer();
    ref.set(user, function(err) {
      $timeout(function() {
        if( err ) {
          def.reject(err);
        }
        else {
          def.resolve(ref);
        }
      });
    });
    return def.promise;
  }

  $scope.previous = function(step) {
  	console.log("Step", step);
  	$scope.step = step - 1;
  }
  $scope.createSubject = function() {
    $scope.student.subjects.push({subject:'',class:''});
	}
	$scope.removeSubject = function(index) {
		console.log("index", index);
  	$scope.student.subjects.splice(index, 1);
	}
  $scope.reset = function() {
    $scope.msg = "";
    reset();
  }
  $scope.importTeachers = function() {
  	$rootScope.title = "Import Students";
    $scope.import = true;
  }

  $scope.csvImport = function(csvdata) {
    var sentcount = 0;
    if(csvdata && !$scope.processing) {
      $scope.processing = true;
      var allusers = [];
      var newdata = csvdata;
      console.log("csvdata", csvdata);
      var commondata = {};
      var common = Object.keys(newdata[0]);
      console.log("Common", common);
      var commonHead = common[0].toLowerCase().split(";");
      console.log("Common head", commonHead);
      var commonVal = newdata[0][common[0]].split(";");
      console.log("commonVal", commonVal);
      for (var c = 0; c < commonHead.length; c++) {
        if(commonVal[c]) {
          commondata[commonHead[c].replace(/"/g, "")] = commonVal[c].replace(/"/g, "");
        }
      };
      for (var i = 0; i < newdata.length; i++) {
        var userdata = {};
        if(i > 1) {
          for(var dkey in newdata[i]) {
            var head = newdata[2][dkey].toLowerCase().split(/[;]/);
            var row = newdata[i][dkey].split(/[;]/);
            if(row.length > 1) {
              for (var ri = 0; ri < row.length; ri++) {
                userdata[head[ri].replace(/"/g, "")] = row[ri].replace(/"/g, "");
              };
              console.log("userdata", userdata);
              if(!userdata.division) userdata.division = "all";
              if(userdata.student && (userdata.student != "Student")) allusers.push(userdata);
            } 
          }
        }
      }
    }

    console.log("USERDATA:", allusers);
    var alluserSubmit = function(iteration) {
      var userdata = {};
      userdata.pepper = Math.random().toString(36).slice(-8);
      for(var cc in commondata) {
        allusers[iteration][cc] = commondata[cc]; 
      }
      var parent = {};
      parent.name = allusers[iteration].parent;
      parent.email = allusers[iteration].parentphone+"p"+settings.sid+"@ge.com";
      parent.phone = allusers[iteration].parentphone;
      parent.pepper = Math.random().toString(36).slice(-8);
      parent.role = "parent";
      parent.school = school.school;
      parent.schoolid = school.$id;
      console.log("parent", parent);
      Auth.$createUser({email: parent.email, password: parent.pepper})
          .then(function (parentcreated) {
              console.log("user created", parentcreated);
              userdata.parentid = parentcreated.uid;
              return createProfile(parentcreated, parent);
           })
           .then(function() {
        userdata.parent = allusers[iteration].parent;
        userdata.name = allusers[iteration].student;
        userdata.standard = allusers[iteration].standard;
        userdata.division = allusers[iteration].division;
        userdata.parent = allusers[iteration].parent;
        userdata.sex = allusers[iteration].sex;
        userdata.address = allusers[iteration].address;
        userdata.studentid = allusers[iteration].studentid;
        userdata.teacher = allusers[iteration].teacher;
        userdata.studentid = allusers[iteration].studentid;
        userdata.email = allusers[iteration].studentid+"@ge.com";
        userdata.status = "active";
        var alls = allusers[iteration].secondlanguage + "," + allusers[iteration].commonsubjects 
        var allsubjects = alls.split(",");
        var tidkey = '';
          for (var si = 0; si < allsubjects.length; si++) {
            var cdata = allsubjects[si].split(":");
            var tkey = school.$id+'_'+cdata[1]+'_'+cdata[0]+'_'+userdata.standard+'-'+userdata.division;
            if(!userdata[teachers[tkey]]) {
              userdata[teachers[tkey]] = cdata[1] +'_'+cdata[0];
            } else {
              userdata[teachers[tkey]] += ':'+cdata[0];
            }
            if(cdata[1] == userdata.teacher) {
            tidkey = tkey;
            }
          };
          if(tidkey) userdata.teacherid = teachers[tidkey];
              userdata.usertype = school.$id+"|student";
              userdata.parentkids = userdata.usertype + '|'+ userdata.parentid;
              delete userdata.parentid;
            Auth.$createUser({email: userdata.email, password: userdata.pepper})
             .then(function (usercreated) {
                console.log("student created", usercreated);
                return createProfile(usercreated, userdata);
              })
              .then(function() { 
               if(iteration != (allusers.length -1)) {
            iteration++;
              alluserSubmit(iteration);
          } else {
            $location.path('/addstudent');
          }
        }, showError);
      }, showError); 
    }
    alluserSubmit(0);
  }
});
