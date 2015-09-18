'use strict';

/**
 * @ngdoc function
 * @name greenEdApp.controller:AddteacherCtrl
 * @description
 * # AddteacherCtrl
 * Controller of the greenEdApp
 */
angular.module('greenEdApp')
.controller('AddclassCtrl', function ($scope, $window, user, $q, $timeout, Auth, Ref) {
  console.log("User in teacher", user);
  var reset = function() {
    $scope.import = false;
    $scope.msg = '';
    $scope.step = 1;
    $scope.class = {};
    $scope.class.subjects = [{subject:'',class:''}];
  }
  reset();
  $scope.next = function(step) {
    console.log("Step", step);
    if(step == 4) {
      $scope.msg = "Creating Teacher...";
      var allsubjects = [];
      var teacher = $scope.class;
      teacher.email = teacher.phone +'@ge.com';
      teacher.pepper = Math.random().toString(36).slice(-8);
      teacher.password = teacher.pepper;
      teacher.role = "teacher";
      teacher.school = user.school;
      teacher.schoolid = user.schoolid;
      teacher.subjects.forEach(function(sk, sv) {
        if(sk["$$hashKey"]) delete sk["$$hashKey"]; 
      })
      console.log("finally", teacher);
      Ref.child("users").orderByChild("email").equalTo(teacher.email).once('value', function(tsnap) {
        console.log("snap val", tsnap.val());
        if(tsnap.val() === null) {
          Auth.$createUser({email: teacher.email, password: teacher.pepper})
          .then(function (usercreated) {
            console.log("user created", usercreated);
            return createProfile(usercreated, teacher);
          })
          .then(function() { 
            $scope.msg = "Teacher has been created successfully";
          }, showError);
        } else {
          $scope.msg = "Teacher already exists";
          $scope.$apply();
        }
      })
  	} else {
  		$scope.step = step + 1;
  	}
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
    $scope.teacher.subjects.push({subject:'',class:''});
	}
	$scope.removeSubject = function(index) {
		console.log("index", index);
  	$scope.teacher.subjects.splice(index, 1);
	}
  $scope.reset = function() {
    $scope.msg = "";
    reset();
  }
  $scope.importTeachers = function() {
    $scope.import = true;
  }

  $scope.csvImport = function(csvdata) {
    var sentcount = 0;
    if(csvdata && !$scope.processing) {
      $scope.processing = true;
      var allusers = [];
      var newdata = csvdata;
      console.log("csvdata", csvdata);
      for (var i = 0; i < newdata.length; i++) {
        var userdata = {};
        for(var dkey in newdata[i]) {
          var head = dkey.toLowerCase().replace(/"/g, "").split(/[;]/);
            var row = newdata[i][dkey].split(/[;]/);
            if(row.length > 1) {
              for (var ri = 0; ri < row.length; ri++) {
                userdata[head[ri]] = row[ri].replace(/"/g, "");
              };
            console.log("userdata", userdata);
            userdata.accounttype = "Teacher";
            allusers.push(userdata);
            } 
        }
      }
    }

    console.log("USERDATA:", allusers);
    var alluserSubmit = function(iteration) {
      var userdata = {};
      userdata.pepper = Math.random().toString(36).slice(-8);
      userdata.school = user.school;
      userdata.schoolid = user.schoolid;
      userdata.role = "teacher";
      userdata.subjects = [];
      var allsubjects = allusers[iteration].subjects.split(",");        
      for (var si = 0; si < allsubjects.length; si++) {
        var cdata = allsubjects[si].split(":");
        if(cdata[1].indexOf("-") == -1) cdata[1] = cdata[1] + "-all";
        userdata.subjects.push({subject: cdata[0], class:cdata[1]});
      };
      userdata.name = allusers[iteration].teacher;
      userdata.email = allusers[iteration].teacherphone + "@ge.com";
      userdata.phone = allusers[iteration].teacherphone;
      console.log("iteration", userdata);
      Ref.child("users").orderByChild("email").equalTo(userdata.email).once('value', function(tsnap) {
        var key = tsnap.key();
        var val = tsnap.val();
        console.log("snap val", val);
        if(val === null) {
          Auth.$createUser({email: userdata.email, password: userdata.pepper})
          .then(function (usercreated) {
            console.log("user created", usercreated);
            return createProfile(usercreated, userdata);
          })
          .then(function() { 
            if(iteration != (allusers.length -1)) {
              iteration++;
              alluserSubmit(iteration);
            } else {
              $location.path('/');
            }
          }, showError);
        } else {
          val.subjects = userdata.subjects;
          val.name = userdata.name;
          val.phone = userdata.phone;
          Ref.child("users/"+key).set(val);
          if(iteration != (allusers.length -1)) {
            iteration++;
            alluserSubmit(iteration);
          } else {
            $location.path('/');
          }
        }
      });
    }
    alluserSubmit(0);
  }
});
