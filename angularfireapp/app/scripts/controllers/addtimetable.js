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
	scoresRef.orderByChild("role").equalTo("teacher").once("value", function(snap) {
		var fbusers = snap.val();
		snap.forEach(function(tdata) {
			var data = tdata.val();
			var tid = tdata.key();
			for (var i = 0; i < data.subjects.length; i++) {
				teachers[data.subjects[i].class+'_'+data.subjects[i].subject] = tid;
			};
		})
        console.log("All Firebase teachers", teachers);
	});

  	$scope.addUsers = function(schoolItem) {
	  	$scope.listSchool = false;
  		console.log("schoolitem", schoolItem);
  		$scope.school = schoolItem;
  		schoolValues(schoolItem);
    };
    
    var schoolValues = function(schoolValues) {
      school = schoolValues;

    }
    var daysIndex = function(day) {
    	var days = {};
    	days["monday"] = 0;
    	days["tuesday"] = 1;
    	days["wednesday"] = 2;
    	days["thursday"] = 3;
    	days["friday"] = 4;
    	days["saturday"] = 5;
    	return days[day];
    }


  $scope.csvImport = function(csvdata) {
  	var timeRef = Ref.child(school.$id+'/timetable');
  	timeRef.once('value', function(timetableDataSnap) {
  	var allusers = timetableDataSnap.val() || {};
  	console.log("allusers", allusers);
    var sentcount = 0;
    if(csvdata && !$scope.processing) {
		$scope.processing = true;
		var days = {};
		var tdays = {};
		var newdata = csvdata;
    	console.log("csvdata", csvdata);
		for (var i = 0; i < newdata.length; i++) {
			var userdata = {};
			for(var dkey in newdata[i]) {
				var head = dkey.toLowerCase().split(/[,;]/);
		  		var row = newdata[i][dkey].toLowerCase().split(/[,;]/);
		    	if(row.length > 1) {
		    		for (var ri = 0; ri < row.length; ri++) {
		    			userdata[head[ri].replace(/"/g, "")] = row[ri].replace(/"/g, "");
		    		};

					var tclass = userdata.standard+'-'+userdata.division;
					console.log("tclass", tclass);
					if(!allusers[tclass]) allusers[tclass] = {};
					if(!allusers[tclass][daysIndex(userdata.day)]) allusers[tclass][daysIndex(userdata.day)] = {};
					if(userdata.time.indexOf("am") == -1) {
						var tt = userdata.time.replace("pm", "");
						if(tt.length == 1) var timekey = 'pm0'+tt;
						else var timekey = "pm"+tt;
					} else {
						var tt = userdata.time.replace("am", "");
						if(tt.length == 1) var timekey = 'am0'+tt;
						else var timekey = "am"+tt;
					}
					console.log("timekey", timekey);
					allusers[tclass][daysIndex(userdata.day)][timekey] = {subject:userdata.subject, time:userdata.time, day:userdata.day};

					var subjects = [];
					if(userdata.subject.indexOf("/") == -1) {
						subjects.push(userdata.subject);
					} else { subjects = userdata.subject.split("/"); }
					console.log("subjects", subjects);
					for (var si = 0; si < subjects.length; si++) {
						var teacherid = teachers[tclass+'_'+subjects[si]];
						console.log("teacherid", teacherid);
						if(!allusers[teacherid]) allusers[teacherid] = {};
						if(!allusers[teacherid][daysIndex(userdata.day)]) allusers[teacherid][daysIndex(userdata.day)] = {};
						allusers[teacherid][daysIndex(userdata.day)][timekey] = {subject:userdata.subject, time:userdata.time, class:tclass, day:userdata.day};
					};

		    	}	
			}
			if(i == newdata.length - 1) {
				console.log("allusers", allusers);
				timeRef.set(allusers);
			}
		}
    }
  	})

  }
  function showError() {
	alert("error");
  }
  function alert(a) {
	console.log("error", a);
  }
});