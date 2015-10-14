'use strict';

/**
 * @ngdoc function
 * @name greenEdBackendApp.controller:AddstudentCtrl
 * @description
 * # AddstudentCtrl
 * Controller of the greenEdBackendApp
 */
angular.module('greenEdBackendApp')
.controller('AddstudentCtrl', function ($scope, $rootScope, Data, $location, $firebaseArray, $window, user, $q, $timeout, Auth, Ref) {
  console.log("User in teacher", settings);
  //test

  var reset = function() {
    $scope.import = false;
    $rootScope.title = "Add Student";
    $scope.msg = '';
    $scope.step = 1;
    $scope.student = {status:"active",subjects:[{subject:''}]};
    //$scope.student = {status:"active", name: "R.S.Abhilash", id:"600001", sex:"male", address:"Bhavani Nivas, Nithravilai Post", parent:"A.Ramachandran", parentphone:"9944711000", standard:"6", division:"a", subjects:[{subject:"Malayalam"},{subject:"English"},{subject:"Hindi"},{subject:"Math"},{subject:"Science"},{subject:"Social"}]};
  }
  reset();
  var allteachers = {};
  Ref.child(settings.sid+"/users/teacher").once('value', function(tsnap) {
    console.log("tsnap val", tsnap.val());
    tsnap.forEach(function(tdata) {
      var tid = tdata.key();
      var td = tdata.val();
      for (var i = 0; i < td.subjects.length; i++) {
        var alltkey = td.subjects[i].class+"_"+td.subjects[i].subject;
        allteachers[alltkey.toLowerCase()] = {uid: tid,name: td.name};
      };
    });
    console.log("allteachers", allteachers);
    
  });
  var createStudent = function(student) {
    console.log("student data", student);
    student.email = student.id+"s"+settings.sid+"@ge.com";
    student.role = "student";
    for (var si = 0; si < student.subjects.length; si++) {
      var cdata = student.subjects[si];
      var tskey = student.standard + "-" + student.division +"_"+ student.subjects[si].subject;
      console.log("tskey", tskey);
      var st = allteachers[tskey.toLowerCase()];
      console.log("st", st);
      if(st) {
        student.subjects[si].tid = st.uid;
        student.subjects[si].tname = st.name;
      }
    }
    Ref.child(settings.sid+"/users/student").orderByChild("email").equalTo(student.email).once('value', function(ssnap) {
      console.log("snap val", ssnap.val());
      var studentVal = ssnap.val();
      if(studentVal === null) {
        student.pepper = Math.random().toString(36).slice(-8);
        Auth.$createUser({email: student.email, password: student.pepper})
         .then(function (usercreated) {
            console.log("student created", usercreated);
            return createProfile(student, usercreated);
          }, showError);
      } else {
        console.log("ssnap key", Object.keys(studentVal)[0]);
        var student_id = Object.keys(studentVal)[0];
        return Ref.child(settings.sid+"/users/student/"+student_id).update(angular.copy(student));   
      }
    });
  }
  // $scope.teachers = $firebaseArray(Ref.child(settings.sid+'/users/teachers'));
  $scope.next = function(step) {
    console.log("Step", step);
    if(step == 7) {
      $scope.msg = "Creating Student...";
      var parent = {};
      parent.name = $scope.student.parent;
      parent.email = $scope.student.parentphone+"p"+settings.sid+"@ge.com";
      parent.phone = $scope.student.parentphone;
      parent.pepper = Math.random().toString(36).slice(-8);
      parent.role = "parent";
      parent.sid = settings.sid;
      console.log("parent", parent);
      Ref.child(settings.sid+"/users/parent").orderByChild("email").equalTo(parent.email).once('value', function(psnap) {
        console.log("snap val", psnap.val());
        if(psnap.val() === null) {
          Auth.$createUser({email: parent.email, password: parent.pepper})
            .then(function (parentcreated) {
                console.log("user created", parentcreated);
                $scope.student.pid = parentcreated.uid;
                return createProfile(parent, parentcreated);
             })
             .then(function() {
              var student = createStudent($scope.student);
              $timeout(function() { $scope.msg = "Student created";},0);
            }, showError);
        } else {
          $scope.student.pid = psnap.key();
          var student = createStudent($scope.student);
          $timeout(function() { $scope.msg = "Student created";},0);
        }
      })
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
  function showError(err) {
    console.log("error", err);
  }

  function createProfile(userData, userd) {
    console.log("userData", userData);
    console.log("user", userd);
    var ref = Ref.child(settings.sid+'/users/'+userData.role+'/'+userd.uid), def = $q.defer();
    ref.set(userData, function(err) {
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
    $scope.importing = false;
  }
  $scope.csvImport = function(csvdata) {
    var sentcount = 0;
    if(csvdata && !$scope.processing) {
      $scope.processing = true;
      $scope.importing = true;
      $scope.importMsg = "Importing... ";
      $scope.processing = true;
      var allusers = [];
      var newdata = csvdata;
      console.log("csvdata", csvdata);
      var commondata = {};
      var common = Object.keys(newdata[0]);
      console.log("Common", common);
      var commonHead = common[0].toLowerCase().match(/\w+|"[^"]+"/g);
      console.log("Common head", commonHead);
      var commonVal = newdata[0][common[0]].match(/\w+|"[^"]+"/g);
      console.log("commonVal", commonVal);
      for (var c = 0; c < commonHead.length; c++) {
        if(commonVal[c]) {
          commondata[commonHead[c].replace(/"/g, "")] = commonVal[c].replace(/"/g, "");
        }
      };
      var totalRec = newdata.length;
      $scope.importTotal = totalRec - 3;
      console.log('common data', commondata);
      for (var i = 0; i < totalRec; i++) {
        var userdata = {subjects:[]};
        if(i > 2) {
          for(var dkey in newdata[i]) {
            console.log("dkey", dkey);
            console.log("i", i);
            var head = newdata[2][dkey].toLowerCase().split(/[,]/);
            var row = newdata[i][dkey].match(/"[^"]+"|[^,]+/g);
            console.log("head", head);
            console.log("row", row);
            if(row.length > 1) {
              for (var ri = 0; ri < row.length; ri++) {
                userdata[head[ri].replace(/"/g, "")] = row[ri].replace(/"/g, "");
              };
              for(var cc in commondata) {
                if(cc == "commonsubjects") {
                  var csubjects = commondata[cc].split(",");
                  for (var cci = 0; cci < csubjects.length; cci++) {
                    userdata.subjects.push({subject: csubjects[cci]});
                  };
                  userdata.subjects.push({subject: userdata["secondlanguage"]});
                  delete userdata["secondlanguage"];
                } else {
                  userdata[cc] = commondata[cc]; 
                }
              }
              console.log("userdata", userdata);
              if(!userdata.division) userdata.division = "all";
              allusers.push(userdata);
            } 
          }
        }
      }
    }
    console.log("USERDATA:", allusers);
    var alluserSubmit = function(iteration) {
      $timeout(function() {$scope.importStatus = iteration + 1; $scope.importStatusP = parseInt(((iteration + 1)*100)/$scope.importTotal)+"%";},0);
      var parent = {};
      parent.name = allusers[iteration].parent;
      parent.email = allusers[iteration].parentphone+"p"+settings.sid+"@ge.com";
      parent.phone = allusers[iteration].parentphone;
      parent.pepper = Math.random().toString(36).slice(-8);
      parent.role = "parent";
      parent.schoolid = settings.sid;
      console.log("parent", parent);
      Ref.child(settings.sid+"/users/parent").orderByChild("email").equalTo(parent.email).once('value', function(psnap) {
        console.log("snap val", psnap.val());
        var pval = psnap.val();
        if(pval === null) {
          Auth.$createUser({email: parent.email, password: parent.pepper})
            .then(function (parentcreated) {
                console.log("user created", parentcreated);
                allusers[iteration].pid = parentcreated.uid;
                return createProfile(parent, parentcreated);
             })
             .then(function() {
              var student = createStudent(allusers[iteration]);
              if(iteration != (allusers.length - 1)) {
                iteration++;
                alluserSubmit(iteration);
              } else {
                $timeout(function() {$scope.importMsg = "Import completed successfully.";},0);
                $location.path('/addstudent');
              }
            }, showError);
        } else {
          console.log("p key", Object.keys(pval)[0]);
          allusers[iteration].pid = Object.keys(pval)[0];
          var student = createStudent(allusers[iteration]);
          if(iteration != (allusers.length -1)) {
            iteration++;
            alluserSubmit(iteration);
          } else {
            $timeout(function() {$scope.importMsg = "Import completed successfully.";},0);
            $location.path('/addstudent');
          }
        }
      })     
    }
    alluserSubmit(0);
  }
});
