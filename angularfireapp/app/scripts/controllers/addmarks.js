'use strict';

/**
 * @ngdoc function
 * @name angularfireappApp.controller:AddmarksCtrl
 * @description
 * # AddmarksCtrl
 * Controller of the angularfireappApp
 */
angular.module('angularfireappApp')
  .controller('AddmarksCtrl', function ($scope, Auth, $q, Ref, $firebaseArray, $firebaseObject, $timeout, $http, $location) {
  	var marks = {};
  	var AllMarks = [];
  	var filters = {};
  	var school = {};
  	var key = '';
  	var ykey = '';
  	var periodicalRef = '';
  	var yearRef = '';
  	var filtersRef = '';
	var defaultMark = {hm:{pass:0,fail:0,Pass:[],Fail:[],allSubjects:[],subjectPass:[], subjectFail:[],subjectPassUsers:{}, subjectFailUsers:{}, gradeData:[], grades:[], gradeUsers:{}, toppers:[]}};
	var dmarks = {};
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
	var allfbusers = {students:{},teachers:{}};
	scoresRef.once("value", function(snap) {
		var fbusers = snap.val();
		console.log("FBUSERS", fbusers);
	    for(var fbuser in fbusers) {
         	if(fbusers[fbuser].usertype) {
         		allfbusers["students"][fbusers[fbuser].studentid] = fbusers[fbuser];
         		allfbusers["students"][fbusers[fbuser].studentid].uid = fbuser;
          	} else if (fbusers[fbuser].role == "teacher") {
          		for (var si = 0; si < fbusers[fbuser].subjects.length; si++) {
          			if(!allfbusers["teachers"][fbusers[fbuser].subjects[si].class]) allfbusers["teachers"][fbusers[fbuser].subjects[si].class] = {};
          			allfbusers["teachers"][fbusers[fbuser].subjects[si].class][fbusers[fbuser].subjects[si].subject] = {teacherid:fbuser, teacher:fbusers[fbuser].name};
          		};
          	}
        }
        console.log("All Firebase users", allfbusers);
	});

  	$scope.addUsers = function(schoolItem) {
	  	$scope.listSchool = false;
  		$scope.school = schoolItem;
  		schoolValues(schoolItem);
  	}

    var schoolValues = function(schoolValues) {
      school = schoolValues;
      filtersRef = Ref.child(school.$id+'/filters');
      $scope.filters = $firebaseObject(filtersRef);
	  $scope.filters.$loaded().then(function(fbfilters) {
		  if(fbfilters.educationyears) {
			filters.typeofexams = fbfilters.typeofexams; filters.educationyears = fbfilters.educationyears;
			filters.typeofexam = fbfilters.typeofexam; filters.educationyear = fbfilters.educationyear;
		  } else {
			filters.typeofexams = []; filters.educationyears = [];
			filters.typeofexam = 0; filters.educationyear = 0;
		  }
	  });
    }

  $scope.csvImport = function(csvdata) {
    var sentcount = 0;
    if(csvdata && !$scope.processing) {
		$scope.processing = true;
		var allusers = [];
		var newdata = csvdata;
		var commondata = {};
		var common = Object.keys(newdata[0]);
		var commonHead = common[0].toLowerCase().split(";");
		var commonVal = newdata[0][common[0]].toLowerCase().split(";");
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

						if(!userdata.division) userdata.division = "all";
						if(userdata.student && (userdata.student != "Student"))
							allusers.push(userdata);
			    	}	
				}
			}
		}
    }
    var alluserSubmit = function(iteration) {
    	var student = allfbusers["students"][allusers[iteration].studentid];
    	allusers[iteration].class = commondata.standard +'-'+commondata.division;
    	var studentMark = {};
    	studentMark.student = student.name;
    	studentMark.educationyear = commondata.educationyear;
    	studentMark.typeofexam = commondata.typeofexam;
    	studentMark.class = allusers[iteration].class;
    	studentMark.standard = commondata.standard;
    	studentMark.attendance = allusers[iteration].attendance;
    	studentMark.remarks = allusers[iteration].remarks;
		var total = 0;
		var status = "Pass";
		var maxmark = school.maxmark[0].max;
		for (var mm = 0; mm < school.maxmark.length; mm++) {
			if(school.maxmark[mm].standard == student.standard) maxmark = school.maxmark[mm].max;
		};
		var passmark = school.passmark[0].passmark;
		for (var pm = 0; pm < school.passmark.length; pm++) {
			if(school.passmark[pm].standard == student.standard) passmark = school.passmark[pm].passmark;
		};
		studentMark.marks = {};
		for(var fsub in allfbusers["teachers"][allusers[iteration].class]) {
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
				  studentMark.marks[fsub]["grade"] = "Grade F";
				} else {
				  studentMark.marks[fsub]["status"] = "Pass";
				  school.grades.forEach(function(sgv, sgk) {
					if((studentMark.marks[fsub]["mark"] >= sgv.lesser) && ((studentMark.marks[fsub]["mark"] <= sgv.greater))) {
					  studentMark.marks[fsub]["grade"] = sgv.grade;
					}
				  })
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
		
		AllMarks.push(studentMark);
      	if(iteration != (allusers.length -1)) {
		iteration++;
			alluserSubmit(iteration);
		} else {
			AllMarks.sort(dynamicSort("total"));
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
			var count = 0;
			var grades = [];
			var sgrades = {};
			var topmark = {};
			var totalrecords = AllMarks.length;
			console.log("total records", totalrecords);
			//update fb data
			key = commondata.educationyear +'_'+commondata.typeofexam;
			ykey = commondata.educationyear;
			dmarks[key] = defaultMark;
			dmarks[ykey] = {};
			periodicalRef = Ref.child(school.$id+'/marks/'+key);
			yearRef = Ref.child(school.$id+'/marks/'+ykey);
			periodicalRef.once('value', function(pval) {
				yearRef.once('value', function(yval) {
					if(pval.val()) dmarks[key] = pval.val();
					if(yval.val()) dmarks[ykey] = yval.val();
					for(var mi = 0; mi < totalrecords; mi++) {
						count++;
						var mark = AllMarks[mi];
						if(!dmarks[ykey][mark.studentid]) dmarks[ykey][mark.studentid] = {pass:0,fail:0,examLabels:[],allSubjects:[],examMarks:[],allMarks:[],ranks:[],subjectDataMarks:{},attendance:[]};
						if(!dmarks[key][mark.class]) dmarks[key][mark.class] = {class:{pass:0,fail:0, Pass:[], Fail:[], allSubjects:[],subjectPass:[], subjectFail:[], subjectPassUsers:{}, subjectFailUsers:{}, gradeData:[], grades:[], gradeUsers:{}, toppers:[]}};
						if(mark.status == "Pass") {dmarks[key]["hm"].pass++; dmarks[ykey][mark.studentid].pass++; dmarks[key]["hm"].Pass.push({class:mark.class,uid:mark.studentid,name:mark.student}); dmarks[key][mark.class]["class"].pass++; dmarks[key][mark.class]["class"].Pass.push({class:mark.class,uid:mark.studentid,name:mark.student});}
						if(mark.status == "Fail") {dmarks[key]["hm"].fail++; dmarks[ykey][mark.studentid].fail++; dmarks[key]["hm"].Fail.push({class:mark.class,uid:mark.studentid,name:mark.student}); dmarks[key][mark.class]["class"].fail++; dmarks[key][mark.class]["class"].Fail.push({class:mark.class,uid:mark.studentid,name:mark.student});}
						for(var mm in mark.marks) {
						  if(!dmarks[key][mark.marks[mm].teacherid]) dmarks[key][mark.marks[mm].teacherid] = {pass:0,fail:0, Pass:[], Fail:[], allSubjects:[],subjectPass:[], subjectFail:[], subjectPassUsers:{}, subjectFailUsers:{}, gradeData:[], gradeUsers:{}, toppers:{}};
						  if(!dmarks[key][mark.marks[mm].teacherid]["subjectFailUsers"]) dmarks[key][mark.marks[mm].teacherid]["subjectFailUsers"] = [];
						  if(!dmarks[key][mark.marks[mm].teacherid]["Fail"]) dmarks[key][mark.marks[mm].teacherid]["Fail"] = [];
						  if(dmarks[ykey][mark.studentid].allSubjects.indexOf(mm) == -1) {
						  	if(!dmarks[ykey][mark.studentid].subjectDataMarks[mm]) dmarks[ykey][mark.studentid].subjectDataMarks[mm] = [];
						    dmarks[ykey][mark.studentid].allSubjects.push(mm);
					        dmarks[ykey][mark.studentid].subjectDataMarks[mm].push({name: mm, y:parseInt(mark.marks[mm].mark)});
						  } else {
					        dmarks[ykey][mark.studentid].subjectDataMarks[mm].push({name: mm, y:parseInt(mark.marks[mm].mark)});
						  }

						  if(dmarks[key][mark.class]["class"].allSubjects.indexOf(mm) == -1) {
						    dmarks[key][mark.class]["class"].subjectPassUsers[mm] = []; dmarks[key][mark.class]["class"].subjectFailUsers[mm] = [];
						    dmarks[key][mark.class]["class"].allSubjects.push(mm);
						    if(mark.marks[mm].status == "Pass") {
						      dmarks[key][mark.class]["class"].subjectPass.push({name:"Pass", y:1});
						      dmarks[key][mark.class]["class"].subjectFail.push({name:"Fail", y:0});
						      dmarks[key][mark.class]["class"].subjectPassUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
						    } else {
						      dmarks[key][mark.class]["class"].subjectPass.push({name:"Pass", y:0});
						      dmarks[key][mark.class]["class"].subjectFail.push({name:"Fail", y:1});
						      dmarks[key][mark.class]["class"].subjectFailUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
						    }
						  } else {
						    if(mark.marks[mm].status == "Pass") {
						      dmarks[key][mark.class]["class"].subjectPass[dmarks[key][mark.class]["class"].allSubjects.indexOf(mm)].y++;
						      dmarks[key][mark.class]["class"].subjectPassUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
						  	} else {
						      dmarks[key][mark.class]["class"].subjectFail[dmarks[key][mark.class]["class"].allSubjects.indexOf(mm)].y++;
						      dmarks[key][mark.class]["class"].subjectFailUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
						  	}
						  }
						  if(dmarks[key][mark.marks[mm].teacherid].allSubjects.indexOf(mark.class+" "+mm) == -1) {
						    dmarks[key][mark.marks[mm].teacherid].allSubjects.push(mark.class+" "+mm);
						    dmarks[key][mark.marks[mm].teacherid].subjectPassUsers[mark.class+" "+mm] = []; dmarks[key][mark.marks[mm].teacherid].subjectFailUsers[mark.class+" "+mm] = [];
						    if(mark.marks[mm].status == "Pass") {
							  dmarks[key][mark.marks[mm].teacherid].subjectPass.push({name:"Pass", y:1});
		                      dmarks[key][mark.marks[mm].teacherid].subjectFail.push({name:"Fail", y:0});
		                      dmarks[key][mark.marks[mm].teacherid].subjectPassUsers[mark.class+" "+mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
		                      dmarks[key][mark.marks[mm].teacherid].pass++; dmarks[key][mark.marks[mm].teacherid].Pass.push({class:mark.class,uid:mark.studentid,name:mark.student});
							} else {
							  dmarks[key][mark.marks[mm].teacherid].subjectPass.push({name:"Pass", y:0});
		                      dmarks[key][mark.marks[mm].teacherid].subjectFail.push({name:"Fail", y:1});
		                      dmarks[key][mark.marks[mm].teacherid].subjectFailUsers[mark.class+" "+mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
		                      dmarks[key][mark.marks[mm].teacherid].fail++; dmarks[key][mark.marks[mm].teacherid].Fail.push({class:mark.class,uid:mark.studentid,name:mark.student});
							}
						  } else {
						    if(mark.marks[mm].status == "Pass") {
						  	  dmarks[key][mark.marks[mm].teacherid].subjectPass[dmarks[key][mark.marks[mm].teacherid].allSubjects.indexOf(mark.class+" "+mm)].y++;
		                      dmarks[key][mark.marks[mm].teacherid].subjectPassUsers[mark.class+" "+mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
		                      dmarks[key][mark.marks[mm].teacherid].pass++; dmarks[key][mark.marks[mm].teacherid].Pass.push({class:mark.class,uid:mark.studentid,name:mark.student});				      
						  	} else {
		                      dmarks[key][mark.marks[mm].teacherid].subjectFail[dmarks[key][mark.marks[mm].teacherid].allSubjects.indexOf(mark.class+" "+mm)].y++;
		                      dmarks[key][mark.marks[mm].teacherid].subjectFailUsers[mark.class+" "+mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
		                      dmarks[key][mark.marks[mm].teacherid].fail++; dmarks[key][mark.marks[mm].teacherid].Fail.push({class:mark.class,uid:mark.studentid,name:mark.student});
						  	}
						  }
						  if(dmarks[key]["hm"].allSubjects.indexOf(mm) == -1) {
						    dmarks[key]["hm"].allSubjects.push(mm);
						    dmarks[key]["hm"].subjectPassUsers[mm] = []; dmarks[key]["hm"].subjectFailUsers[mm] = [];
						    if(mark.marks[mm].status == "Pass") {
						      dmarks[key]["hm"].subjectPass.push({name:"Pass", y:1});
						      dmarks[key]["hm"].subjectFail.push({name:"Fail", y:0});
						      dmarks[key]["hm"].subjectPassUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
						    } else {
						      dmarks[key]["hm"].subjectPass.push({name:"Pass", y:0});
						      dmarks[key]["hm"].subjectFail.push({name:"Fail", y:1});
						      dmarks[key]["hm"].subjectFailUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
						    }
						  } else {
						    if(mark.marks[mm].status == "Pass") {
						      dmarks[key]["hm"].subjectPass[dmarks[key]["hm"].allSubjects.indexOf(mm)].y++;
						      dmarks[key]["hm"].subjectPassUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
						    } else {
						      dmarks[key]["hm"].subjectFail[dmarks[key]["hm"].allSubjects.indexOf(mm)].y++;
						      dmarks[key]["hm"].subjectFailUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
						    }
						  }
						  if(!sgrades[mark.marks[mm].teacherid]) sgrades[mark.marks[mm].teacherid] = [];
						  if(sgrades[mark.marks[mm].teacherid].indexOf(mark.marks[mm].grade) == -1) {
			                  sgrades[mark.marks[mm].teacherid].push(mark.marks[mm].grade);
			                  var gtxt = {name: mark.marks[mm].grade, y:1};
			                  if(mark.marks[mm].grade == "Grade F") gtxt.color = "#ff6c60";
			                  dmarks[key][mark.marks[mm].teacherid].gradeData.push(gtxt);
			                  dmarks[key][mark.marks[mm].teacherid].gradeUsers[mark.marks[mm].grade] = [{class:mark.class,uid:mark.studentid, name:mark.student}];
			              } else {
			                  dmarks[key][mark.marks[mm].teacherid].gradeData[sgrades[mark.marks[mm].teacherid].indexOf(mark.marks[mm].grade)].y++;
			                  dmarks[key][mark.marks[mm].teacherid].gradeUsers[mark.marks[mm].grade].push({class:mark.class,uid:mark.studentid, name:mark.student});
			              }

						  if(!topmark[mark.marks[mm].teacherid+'_'+mark.class+'_'+mm]) {
						    topmark[mark.marks[mm].teacherid+'_'+mark.class+'_'+mm] = mark.marks[mm].mark;
							dmarks[key][mark.marks[mm].teacherid].toppers[mark.class+'_'+mm] = [{student: mark.student, standard: mark.standard, class: mark.class, mark: mark.marks[mm].mark, studentid: mark.studentid}];			    
						  } else if (topmark[mark.marks[mm].teacherid+'_'+mark.class+'_'+mm] < mark.marks[mm].mark) {
						  	topmark[mark.marks[mm].teacherid+'_'+mark.class+'_'+mm] = mark.marks[mm].mark;
						    dmarks[key][mark.marks[mm].teacherid].toppers[mark.class+'_'+mm] = [{student: mark.student, standard: mark.standard, class: mark.class, mark: mark.marks[mm].mark, studentid: mark.studentid}];
						  } else if (topmark[mark.marks[mm].teacherid+'_'+mark.class+'_'+mm] == mark.marks[mm].mark) {
						    dmarks[key][mark.marks[mm].teacherid].toppers[mark.class+'_'+mm].push({student: mark.student, standard: mark.standard, class: mark.class, mark: mark.marks[mm].mark, studentid: mark.studentid});
						  }
						}
						var hmindex = dmarks[key]["hm"].grades.indexOf(mark.grade);
						if(hmindex == -1) {
						  dmarks[key]["hm"].grades.push(mark.grade);
						  var val = {name: mark.grade, y:1};
						  if(mark.grade == "Grade F") val.color = "#ff6c60";
						  dmarks[key]["hm"].gradeData.push(val);
						  dmarks[key]["hm"].gradeUsers[mark.grade] = [{class:mark.class,uid:mark.studentid, name:mark.student}];
						} else {
						  dmarks[key]["hm"].gradeData[hmindex].y++;
						  dmarks[key]["hm"].gradeUsers[mark.grade].push({class:mark.class,uid:mark.studentid, name:mark.student});
						}
						var yindex = dmarks[key][mark.class]["class"].grades.indexOf(mark.grade);
						if(yindex == -1) {
						  dmarks[key][mark.class]["class"].grades.push(mark.grade);
						  var yval = {name: mark.grade, y:1};
						  if(mark.grade == "Grade F") yval.color = "#ff6c60";
						  dmarks[key][mark.class]["class"].gradeData.push(yval);
						  dmarks[key][mark.class]["class"].gradeUsers[mark.grade] = [{class:mark.class,uid:mark.studentid, name:mark.student}];
						} else {
						  dmarks[key][mark.class]["class"].gradeData[yindex].y++;
						  dmarks[key][mark.class]["class"].gradeUsers[mark.grade].push({class:mark.class,uid:mark.studentid, name:mark.student});
						}						
						if(mark.rank == 1) {
						  dmarks[key]["hm"].toppers.push({student: mark.student, standard: mark.standard, class: mark.class, total: mark.total, studentid: mark.studentid});
						  dmarks[key][mark.class]["class"].toppers.push({student: mark.student, standard: mark.standard, class: mark.class, total: mark.total, studentid: mark.studentid});
						}
						dmarks[key][mark.class][mark.studentid] = mark;
						dmarks[ykey][mark.studentid].examLabels.push(mark.typeofexam);
						dmarks[ykey][mark.studentid].examMarks.push({name: mark.typeofexam, y: mark.percentage});
						dmarks[ykey][mark.studentid].allMarks.push({name: mark.typeofexam, y: mark.total});
						dmarks[ykey][mark.studentid].attendance.push(parseInt(mark.attendanceP));
						dmarks[ykey][mark.studentid].ranks.push(mark.rank);
					};
					console.log("Total count", count);
					console.log("Finally", dmarks);
					periodicalRef.set(dmarks[key]);
					yearRef.set(dmarks[ykey]);
					if(filters.typeofexams.indexOf(commondata.typeofexam) == -1) {
						filters.typeofexams.push(commondata.typeofexam); 
						filters.typeofexam = filters.typeofexams.indexOf(commondata.typeofexam);
					}
					if(filters.educationyears.indexOf(commondata.educationyear) == -1) {
						filters.educationyears.push(commondata.educationyear);
						filters.educationyear = filters.educationyears.indexOf(commondata.educationyear);
					}
					filtersRef.set(filters);
					//console.log("Filters Finally", filters);
				})
			})
		}
	}
	alluserSubmit(0);
  }
  	function dynamicSort(property) {
	    var sortOrder = 1;
	    if(property[0] === "-") {
	        sortOrder = -1;
	        property = property.substr(1);
	    }
	    return function (a,b) {
	        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
	        return result * sortOrder;
	    }
	}

    function showError() {
    	alert("error");
    }
    function alert(a) {
    	console.log("error", a);
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
});
