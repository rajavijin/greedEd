'use strict';

/**
 * @ngdoc function
 * @name angularfireappApp.controller:AdduserCtrl
 * @description
 * # AdduserCtrl
 * Controller of the angularfireappApp
 */
angular.module('angularfireappApp')
  .controller('AdduserCtrl', function ($scope, Auth, $q, Ref, $firebaseArray, $timeout, $http, $location) {
  	var marks = {};
  	var school = {};
  	$scope.listSchool = true;
/*    $scope.processing = false;
  	var user = Auth.getCurrentUser();
  	$scope.schools = [];
  	if(user.role == "hm") {
  		$scope.listSchool = false;
	  	$http.get('/api/schools/'+user.schoolid).success(function(schoolItem) {
  			schoolValues(schoolItem);
	  	});
  	} else if (user.role == "admin") {
  		$http.get('/api/schools').success(function(schools) {
	  		console.log("schools", schools);
	  		$scope.schools = schools;
	  	});
  	}*/
  
// synchronize a read-only, synchronized array of schools, limit to most recent 10
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
	scoresRef.orderByChild("role").equalTo("teacher").on("value", function(snapshot) {
	  	snapshot.forEach(function(data) {
	  		var teacherval = data.val();
	    	for (var ti = 0; ti < teacherval.subjects.length; ti++) {
	    		teachers[teacherval.schoolid+'_'+teacherval.name+'_'+teacherval.subjects[ti].subject+'_'+teacherval.subjects[ti].class] = data.key();
	    	};
	    	console.log("teachers", teachers);
	  	});
	});

  	$scope.addUsers = function(schoolItem) {
	  	$scope.listSchool = false;
  		console.log("schoolitem", schoolItem);
  		$scope.school = schoolItem;
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
		var allusers = [];
		var newdata = csvdata;
    	console.log("csvdata", csvdata);
		var type = Object.keys(csvdata[0])[0].split(/[,;]/)[0].replace(/"/g, "");
		console.log("type", type);
		if(type == "Teacher") {
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
		} else {
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
							if(userdata.student && (userdata.student != "Student"))
								allusers.push(userdata);
				    	}	
					}
				}
			}
		}
    }
	console.log("USERDATA:", allusers);
    var alluserSubmit = function(iteration) {
    	var userdata = {};
		userdata.pepper = Math.random().toString(36).slice(-8);
		if(allusers[iteration].accounttype == "Teacher") {
			userdata.school = school.school;
			userdata.schoolid = school.$id;
			userdata.role = "teacher";
			userdata.subjects = [];
    		userdata.students = [];
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
				}}, showError);
		} else {
			for(var cc in commondata) {
				allusers[iteration][cc] = commondata[cc]; 
			}
			var parent = {};
			parent.name = allusers[iteration].parent;
			parent.email = allusers[iteration].parentphone+"@ge.com";
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
	           	userdata.subjects = [];
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
	  				var tkey = userdata.schoolid+'_'+cdata[1]+'_'+cdata[0]+'_'+userdata.standard+'-'+userdata.division;
	  				if(cdata[1] == userdata.teacher) {
						tidkey = tkey;
	  				}
	  				if(!userdata["st_"+teachers[tkey]]) userdata["st_"+teachers[tkey]] = cdata[1]+','+cdata[0]
	  				else userdata["st_"+teachers[tkey]] += "," + cdata[0]; 
	  				//userdata.subjects.push({subject: cdata[0], teacher:cdata[1], teacherid:teachers[tkey]});
			    };
			    if(tidkey) userdata.teacherid = teachers[tidkey];
           		userdata.usertype = school.$id+"|student";
           		userdata.classteacher = userdata.usertype + '|'+ userdata.standard+'-'+userdata.division;
           		userdata.parentkids = userdata.usertype + '|'+ userdata.parentid;
           		delete userdata.parentid;
			    console.log("Student", userdata);
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
			}, showError);
			
		}
	  	/*
		$http.post('api/users', allusers[iteration]).success(function(created) {
			console.log("created", created);
			if(iteration != (allusers.length -1)) {
				iteration++;
  				alluserSubmit(iteration);
			} else {
				$location.path('/');
			}
		}).error(function(err) {
   			console.log('error', err);
			if(iteration != (allusers.length -1)) {
				iteration++;
  				alluserSubmit(iteration);
			}
		});*/
	}
	alluserSubmit(0);
  }
/*    function redirect() {
    	if(iteration != (allusers.length -1)) {
				iteration++;
  				alluserSubmit(iteration);
			} else {
				$location.path('/');
			}
    }*/
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
