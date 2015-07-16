'use strict';

angular.module('greenApiApp')
  .controller('AddDataCtrl', function ($scope, $http, $location) {
  	$scope.result = '';
    $scope.ipdata = {};
    $scope.school = {};
    $scope.school.school = "St Mary's Hr Sec School";
    $scope.school.schoolphone = "8951572125";
    $scope.school.allgrades = "Grade A:60-100,Grade B:50-59,Grade C:40-49,Grade F:0-39";
    $scope.school.ranking = "grade";
    $scope.school.allpassmark = "default:40,11:70,12:70";
    $scope.school.maximum = "default:100,11:200,12:200";
    $scope.school.period = "June-April";
	$scope.processing = false;
    $scope.csvImport = function(csvdata) {
    	console.log("csvdata", csvdata);
        /*if(csvdata && !$scope.processing) {
            $scope.processing = true;
            var updatedResults = [];
            var lastknown = [];
            $scope.updatedItems = [];
            var newdata = csvdata;
            angular.forEach(newdata, function(data, index) {
                var lastknownData = {};
                angular.forEach(data, function(d, i) {
                    var head = i.toLowerCase().split(";");
                    var row = d.split(";");
                    if(row.length > 1) {
                        angular.forEach(row, function(r, k) {
                            lastknownData[head[k]] = r;
                        })
                        lastknownData["import"] = true;
                        lastknownData["school"] = $scope.school.school;
                        lastknownData["email"] = lastknownData["student"].replace(" ", "-").toLowerCase()+lastknownData["studentid"];
                        lastknown.push(lastknownData);
                    }
                });
            })        
        }*/
        var schoolData = $scope.school;
        var max = schoolData.maximum.split(",");
        schoolData.maxmark = [];
        for (var i = 0; i < max.length; i++) {
            var maxval = max[i].split(":");
            schoolData.maxmark.push({standard:maxval[0],max:maxval[1]});
        };
        var allpassmark = schoolData.allpassmark.split(",");
        schoolData.passmark = [];
        for (var i = 0; i < allpassmark.length; i++) {
            var maxval = allpassmark[i].split(":");
            schoolData.passmark.push({standard:maxval[0],passmark:maxval[1]});
        };
        var allGrades = schoolData.allgrades.split(",");
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
        $http.post('/api/schools', schoolData).success(function(school) {
            console.log("school", school);
            alert("School Successfully created");
            $location.path('/');
        }).error(function(err) {
            console.log('error', err);
        });
    }

    var createUser = function(userData, schoolData, i) {
        userData[i].schoolid = schoolData._id;
        userData[i].school = schoolData.school;
        console.log("userDataSent", userData[i]);
        /*$http.post('/api/users', userData[i]).success(function(created) {
            i++;
            console.log("total items ", userData.length);
            console.log("iterate ", i);
            if(userData.length > i) {
                createUser(userData, schoolData, i);
            }
            if(userData.length == i) {
            	$location.path('/');
            }
        }).error(function(err) {
            console.log('error', err);
        });*/
     //       $scope.updatedItems.push({Status:error,ID: lastknownData.username, Username: lastknownData.email});
    }    
  });

