'use strict';

/**
 * @ngdoc function
 * @name angularfireappApp.controller:AdddataCtrl
 * @description
 * # AdddataCtrl
 * Controller of the angularfireappApp
 */
angular.module('angularfireappApp')
  .controller('AdddataCtrl', function ($scope, Ref, $q, $firebaseArray, $timeout, Auth, $http, $location) {
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
 	$scope.result = '';
    $scope.ipdata = {};
    $scope.school = {};
    $scope.school.school = "St Mary's Hr Sec School";
    $scope.school.schoolphone = "8951572125";
    $scope.allgrades = "Grade A:60-100,Grade B:50-59,Grade C:40-49,Grade F:0-39";
    $scope.school.ranking = "grade";
    $scope.allpassmark = "default:40,11:70,12:70";
    $scope.maximum = "default:100,11:200,12:200";
    $scope.school.period = "June-April";
	$scope.processing = false;
    $scope.csvImport = function(csvdata) {
    	console.log("csvdata", csvdata);
        var schoolData = $scope.school;
        var max = $scope.maximum.split(",");
        schoolData.maxmark = [];
        for (var i = 0; i < max.length; i++) {
            var maxval = max[i].split(":");
            schoolData.maxmark.push({standard:maxval[0],max:parseInt(maxval[1])});
        };
        var allpassmark = $scope.allpassmark.split(",");
        schoolData.passmark = [];
        for (var i = 0; i < allpassmark.length; i++) {
            var maxval = allpassmark[i].split(":");
            schoolData.passmark.push({standard:maxval[0],passmark:parseInt(maxval[1])});
        };
        var allGrades = $scope.allgrades.split(",");
        var grades = [];
        console.log("rank", schoolData.ranking);
        if(schoolData.ranking == 'grade') {
            angular.forEach(allGrades, function(g, gi) {
                var values = g.split(":");
                var range = values[1].split("-");
                grades[gi] = {};
                grades[gi]["grade"] = values[0];
                grades[gi]["lesser"] = parseInt(range[0]);
                grades[gi]["greater"] = parseInt(range[1]);
            });
        } else {
            angular.forEach(allGrades, function(g, gi) {
                var range = g.split("-");
                grades[gi] = {};
                grades[gi]["grade"] = g;
                grades[gi]["lesser"] = parseInt(range[0]);
                grades[gi]["greater"] = parseInt(range[1]);
            });
        }
        schoolData.grades = grades;
        console.log("schoolData", schoolData);
        // push a message to the end of the array
        $scope.schools.$add(schoolData).then(function() {
        	console.log("schools", $scope.schools);
        	var schoolcreated = $scope.schools[$scope.schools.length - 1];
        	console.log("school created", schoolcreated);
	        var hm = {};
			hm.name = "Head Master";
			hm.email = schoolcreated.schoolphone + "@ge.com";
			hm.pepper = Math.random().toString(36).slice(-8);
			hm.role = "hm";
			hm.school = schoolcreated.school;
			hm.schoolid = schoolcreated.$id;
			console.log("hm", hm);
			Auth.$createUser({email: hm.email, password: hm.pepper})
	          .then(function (userData) {
	            console.log("user created", userData);
	            return createProfile(userData, hm);
	          })
	          .then(redirect, showError);
        })
        .catch(alert);
/*
        $http.post('/api/schools', schoolData).success(function(school) {
            console.log("school", school);
            alert("School Successfully created");
            $location.path('/');
        }).error(function(err) {
            console.log('error', err);
        });*/
    }
    function redirect() {
    	$location.path('/');
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
