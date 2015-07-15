'use strict';

angular.module('greenApiApp')
  .controller('AddusersCtrl', function ($scope, $http, Auth, $location) {
    $scope.processing = false;
  	var user = Auth.getCurrentUser();
  	$scope.schools = [];
  	var marks = {};
  	var school = {};
  	$scope.listSchool = true;
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
  	}

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
		allusers[iteration].school = school.school;
		allusers[iteration].schoolid = school._id;
		if(allusers[iteration].accounttype != "Teacher") {
			for(var cc in commondata) {
				allusers[iteration][cc] = commondata[cc]; 
			}
			allusers[iteration].import = true;
			allusers[iteration].email = allusers[iteration].studentid;
			allusers[iteration].subjects = allusers[iteration].secondlanguage + "," + allusers[iteration].commonsubjects; 
			if(!allusers[iteration].division) allusers[iteration].division = '';
		}
	  	console.log("iteration", allusers[iteration]);
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
		});
	}
	alluserSubmit(0);
  }
});
