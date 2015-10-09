'use strict';

/**
 * @ngdoc function
 * @name greenEdBackendApp.controller:AddteacherCtrl
 * @description
 * # AddteacherCtrl
 * Controller of the greenEdBackendApp
 */
angular.module('greenEdBackendApp')
.controller('AddteacherCtrl', function ($scope, $rootScope, $window, $route, $location, $q, $timeout, Auth, Ref) {
  console.log("Teacher Settings", settings);
  var reset = function() {
    $scope.import = false;
    $rootScope.title = "Add Teacher";
    $scope.msg = '';
    $scope.step = 1;
    $scope.teacher = {};
    $scope.required = false;
    $scope.teacher.subjects = [{subject:'',class:''}];
  }
  reset();
  $scope.next = function(step) {
    console.log("Next Step", step);
    if(step == 3) {
      $scope.msg = "Creating Teacher...";
      var allsubjects = [];
      var teacher = $scope.teacher;
      teacher.email = teacher.phone +'t'+settings.sid+'@ge.com';
      teacher.pepper = Math.random().toString(36).slice(-8);
      teacher.role = "teacher";
      teacher.subjects.forEach(function(sk, sv) {
        if(sk["$$hashKey"]) delete sk["$$hashKey"]; 
      })
      console.log("finally", teacher);
      Ref.child(settings.sid+"/users/teacher").orderByChild("email").equalTo(teacher.email).once('value', function(tsnap) {
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

  function createProfile(userData, userDetails) {
    var ref = Ref.child(settings.sid+'/users/teacher/'+userData.uid), def = $q.defer();
    ref.set(userDetails, function(err) {
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
  // $scope.importing = true;
  // $scope.import = true;
  // $scope.importMsg = 'Import completed successfully.';
  $scope.importTeachers = function() {
    $rootScope.title = "Import Teachers";
    $scope.import = true;
    $scope.importing = false;
  }

  $scope.csvImport = function(csvdata) {
    var sentcount = 0;
    if(csvdata && !$scope.processing) {
      $scope.processing = true;
      $scope.importing = true;
      $scope.importMsg = "Importing... ";
      var allusers = [];
      var newdata = csvdata;
      $scope.importTotal = newdata.length;
      console.log("csvdata", csvdata);
      for (var i = 0; i < $scope.importTotal; i++) {
        var userdata = {};
        for(var dkey in newdata[i]) {
          console.log("head", dkey);
          console.log("newdata i", newdata[i][dkey]);
          var head = dkey.toLowerCase().replace(/"/g, "").split(/[,]/);
            var row = newdata[i][dkey].split(/[,]/);
            if(row.length > 1) {
              for (var ri = 0; ri < row.length; ri++) {
                if(head[ri]) userdata[head[ri]] = row[ri].replace(/"/g, "");
              };
            console.log("userdata", userdata);
            allusers.push(userdata);
            } 
        }
      }
    }

    console.log("USERDATA:", allusers);
    var alluserSubmit = function(iteration) {
      $timeout(function() {$scope.importStatus = iteration + 1; $scope.importStatusP = parseInt(((iteration + 1)*100)/$scope.importTotal)+"%";},0);
      var userdata = {};
      userdata.pepper = Math.random().toString(36).slice(-8);
      userdata.subjects = [];
      var allsubjects = allusers[iteration].subjects.split(";");        
      for (var si = 0; si < allsubjects.length; si++) {
        var cdata = allsubjects[si].split(":");
        if(cdata[1].indexOf("-") == -1) cdata[1] = cdata[1] + "-all";
        userdata.subjects.push({subject: cdata[0], class:cdata[1]});
      };
      userdata.name = allusers[iteration].teacher;
      userdata.email = allusers[iteration].teacherphone + "t"+settings.sid+"@ge.com";
      userdata.phone = allusers[iteration].teacherphone;
      userdata.role = "teacher";
      console.log("iteration", userdata);
      Ref.child(settings.sid+"/users/teacher").orderByChild("email").equalTo(userdata.email).once('value', function(tsnap) {
        var key = tsnap.key();
        var val = tsnap.val();
        console.log("snap val", val);
        console.log("snap key", key);
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
              $timeout(function() {$scope.importMsg = "Import completed successfully.";},0);
              $location.path('/addteacher');
            }
          }, showError);
        } else {
          for(var kval in val) {
            console.log("keyval", kval);
            console.log("val", val[kval]);
            var vval = val[kval];
            vval.phone = userdata.phone;
            vval.subjects = userdata.subjects;
            Ref.child(settings.sid+"/users/teacher/"+kval).set(vval);
            if(iteration != (allusers.length -1)) {
              iteration++;
              alluserSubmit(iteration);
            } else {
              console.log("Final");
              $timeout(function() {$scope.importMsg = "Import completed successfully.";},0);
              $location.path('/addteacher');
            }
          }
        }
      });
    }
    alluserSubmit(0);
  }
});
