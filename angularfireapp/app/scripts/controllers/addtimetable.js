'use strict';

/**
 * @ngdoc function
 * @name angularfireappApp.controller:AddtimetableCtrl
 * @description
 * # AddtimetableCtrl
 * Controller of the angularfireappApp
 */
angular.module('angularfireappApp')
  .controller('AddtimetableCtrl', function ($scope, Auth, $q, Ref, $firebaseArray, $timeout, $http, $location) {
  	var marks = {};
  	var AllMarks = [];
  	var school = {};
  	$scope.listSchool = true;
  
	//synchronize a read-only, synchronized array of schools, limit to most recent 10
    $scope.schools = $firebaseArray(Ref.child('schools').limitToLast(10));
    // display any errors
    $scope.schools.$loaded().catch(alert);

    function alert(msg) {
      $scope.err = msg;
      $timeout(function() {
        $scope.err = null;
      }, 5000);
    }
	var scoresRef = Ref.child('users');
	var teachers = {};
	scoresRef.once("value", function(snap) {
		var fbusers = snap.val();
	    for(var fbuser in fbusers) {
	    	if(fbusers[fbuser].role == "teacher") {
	    		teachers[fbuser] = fbusers[fbuser];
	    	}
        }
        console.log("All Firebase teachers", teachers);
	});

  	$scope.addUsers = function(schoolItem) {
	  	$scope.listSchool = false;
  		console.log("schoolitem", schoolItem);
  		$scope.school = schoolItem;
    });
    
 /*   // push a message to the end of the array
    $scope.messages.set({text: newMessage})
      // display any errors
      .catch(alert);
  		    var fredNameRef = Ref.child('-JuWkw5o0Mgkiv8BXSJl/lastmark');
			fredNameRef.child('educationyear').set("2015-2016");
			fredNameRef.child('typeofexam').set("periodical1");
			fredNameRef.child('educationyears').push("2015-2016");
			fredNameRef.child('typeofexams').push("periodical1");*/
  		schoolValues(schoolItem);
  	}

    var schoolValues = function(schoolValues) {
      school = schoolValues;
      console.log("Marks: ", marks);
    }

  $scope.csvImport = function(csvdata) {
    var sentcount = 0;
    if(csvdata && !$scope.processing) {
		$scope.processing = true;
		var allusers = {};
		var newdata = csvdata;
    	console.log("csvdata", csvdata);
		for (var i = 0; i < newdata.length; i++) {
			var userdata = {};
			if(i > 1) {
				for(var dkey in newdata[i]) {
					var head = newdata[2][dkey].toLowerCase().split(/[;]/);
			  		var row = newdata[i][dkey].toLowerCase().split(/[;]/);
			    	if(row.length > 1) {
			    		for (var ri = 0; ri < row.length; ri++) {
			    			userdata[head[ri].replace(/"/g, "")] = row[ri].replace(/"/g, "");
			    		};

						console.log("userdata", userdata);
						if(!allusers[userdata.standard+'-'+userdata.division]) allusers[userdata.standard+'-'+userdata.division] = {};
						if(!allusers[userdata.standard+'-'+userd ata.division][userdata.day]) allusers[userdata.standard+'-'+userdata.division][userdata.day] = {};
						allusers[userdata.standard+'-'+userdata.division][userdata.day][userdata.time] = userdata.subject;
						for(var teacher in teachers) {
							for (var ti = 0; ti < teachers[teacher].subjects.length; ti++) {
								if((teachers[teacher].subjects[ti].class = userdata.standard+'-'+userdata.division) && (teachers[teacher].subjects[ti].subject.indexOf(userdata.subject) > 0)) {
									if(!allusers[teacher]) allusers[teacher] = {};
									if(!allusers[teacher][userdata.day]) allusers[teacher][userdata.day] = {};
									allusers[teacher][userdata.day][userdata.time] = userdata.subject;
								}
							};
						}
			    	}	
				}
			}
		}
    }
	console.log("Timetables:", allusers);
    var alluserSubmit = function(iteration) {
    	console.log("school", school);
    	console.log("All Firebase Users", allfbusers);
    	console.log("Student id", allusers[iteration].studentid);
    	var student = allfbusers["students"][allusers[iteration].studentid];
    	console.log("Student", student);
    	allusers[iteration].class = commondata.standard +'-'+commondata.division;
    	var studentMark = {};
    	studentMark.student = student.name;
    	studentMark.educationyear = commondata.educationyear;
    	studentMark.typeofexam = commondata.typeofexam;
    	studentMark.class = allusers[iteration].class;
    	studentMark.standard = commondata.standard;
    	studentMark.attendance = allusers[iteration].attendance;
    	studentMark.remarks = allusers[iteration].remarks;
		console.log("iteration", allusers[iteration]);
		console.log("mkey", mkey);
		var total = 0;
		var status = "Pass";
		var maxmark = school.maxmark[0].max;
		for (var mm = 0; mm < school.maxmark.length; mm++) {
			console.log("MM", student.standard);
			if(school.maxmark[mm].standard == student.standard) maxmark = school.maxmark[mm].max;
		};
		var passmark = school.passmark[0].passmark;
		for (var pm = 0; pm < school.passmark.length; pm++) {
			if(school.passmark[pm].standard == student.standard) passmark = school.passmark[pm].passmark;
		};
		console.log("Passmark", passmark);
		console.log("maxmark", maxmark);
		studentMark.marks = {};
		for(var fsub in allfbusers["teachers"][allusers[iteration].class]) {
			console.log("Subject", allusers[iteration][fsub]);
			if(allusers[iteration][fsub]) {
	        	studentMark.marks[fsub] = {teacher: allfbusers["teachers"][allusers[iteration].class][fsub]["teacher"], teacherid:allfbusers["teachers"][allusers[iteration].class][fsub]["teacherid"], maxmark:maxmark, passmark:passmark};
				if(allusers[iteration][fsub] == "ab") {
				  studentMark.marks[fsub]["astatus"] = "absent";
				  studentMark.marks[fsub]["mark"] = 0;
				  status = "Fail";
				} else {
				  studentMark.marks[fsub]["status"] = "present";
				  studentMark.marks[fsub]["mark"] = parseInt(allusers[iteration][fsub]);
				}
				if(studentMark.marks[fsub]["mark"] < passmark) {
				  status = "Fail";
				  studentMark.marks[fsub]["status"] = "Fail";
				} else {
				  studentMark.marks[fsub]["status"] = "Pass";
				}
				total = parseInt(total) + studentMark.marks[fsub]["mark"];
			}
		}
		studentMark.studentid = student.uid;
		studentMark.status = status;
		studentMark.total = total;
		studentMark.percentage = (total * (100/(Object.keys(studentMark.marks).length*maxmark))).toPrecision(4);
		school.grades.forEach(function(gv, gk) {
		var mpercentage = Math.floor(studentMark.percentage);
		if((mpercentage >= gv.lesser) && ((mpercentage <= gv.greater))) {
		  studentMark.grade = (status == "Fail") ? "Grade F" : gv.grade;
		}
		})
		if(allusers[iteration].attendance) {
		var attendanceVal = allusers[iteration].attendance.split("/");
		studentMark.attendanceP = (parseInt(attendanceVal[0]) * (100/parseInt(attendanceVal[1]))).toPrecision(4);
		}
		console.log("Student Mark", studentMark);
		
		AllMarks.push(studentMark);
      	if(iteration != (allusers.length -1)) {
		iteration++;
			alluserSubmit(iteration);
		} else {
			/*AllMarks.sort(dynamicSort("total"));
			var ri = 1;
            var ric = 0;
			for (var mk = AllMarks.length - 1; mk >= 0; mk--) {
				if(AllMarks[mk].status == "Pass") {
	              AllMarks[mk].rank = ri;
	              if(mk > 0) {
	                if(AllMarks[mk].total == AllMarks[mk-1].total) {
	                  ric++;
	                } else {
	                  if(school.ranktype == "dynamic") {
	                    ri = ri + ric + 1;
	                    ric = 0;
	                  } else {
	                    ri++;                          
	                  }
	                }
	              }
				} else {
					AllMarks[mk].rank = 0;
				}

				//Send data to firebase
            }
            console.log("AllMarks Final", AllMarks);
            for (var ii = 0; ii < AllMarks.length; ii++) {
				var mkey = school.$id+'/marks/'+AllMarks[ii].educationyear+'_'+AllMarks[ii].typeofexam;
				$scope.allmarks = $firebaseArray(Ref.child(mkey).limitToLast(1));

			    // display any errors
			    $scope.allmarks.$loaded().catch(alert);
			    // push a message to the end of the array
			    $scope.allmarks.$add(AllMarks[ii])
			      // display any errors
			      .catch(alert);
            };
            var fredNameRef = Ref.child(school.$id+'/lastmark');
			fredNameRef.child('educationyear').set(commondata.educationyear);
			fredNameRef.child('typeofexam').set(commondata.typeofexam);*/
			//$location.path('/');
		}
	}
	alluserSubmit(0);
  }
  function showError() {
	alert("error");
  }
  function alert(a) {
	console.log("error", a);
  }
});