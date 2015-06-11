'use strict';

angular.module('schoolServerApp')
  .controller('TimetableCtrl', function ($scope, $http, Auth) {
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

  	$scope.addTimeTable = function(schoolItem) {
	  	$scope.listSchool = false;
  		console.log("schoolitem", schoolItem);
  		schoolValues(schoolItem);
  	}

    var schoolValues = function(schoolValues) {
      school = schoolValues;
      console.log("Marks: ", marks);
    }

  $scope.csvImport = function(csvdata) {
    console.log("csvdata", csvdata);
    var sentcount = 0;
    if(csvdata && !$scope.processing) {
      $scope.processing = true;
      var newdata = csvdata;
      console.log("total", csvdata.length);
      var table = {};
      for (var i = 0; i < newdata.length; i++) {
      	for(var dkey in newdata[i]) {
     		var head = dkey.toLowerCase().split(/[,;]/);
          	var row = newdata[i][dkey].split(/[,;]/);
	        if(row.length > 1) {
	        	if(table[row[0]+'-'+row[1]+':'+row[2]] === undefined) table[row[0]+'-'+row[1]+':'+row[2]] = [];

	        	table[row[0]+'-'+row[1]+':'+row[2]].push({time:row[3],subject:row[4]});
	        	
	        }	
      	}
      }
      var timetables = [];
      for(var tablek in table) {
      	var timetable = {};
      	timetable.schoolid = school._id;
      	var timetableVal = tablek.split(":");
      	timetable.class = timetableVal[0];
      	timetable.day = timetableVal[1];
      	timetable.timetable = table[tablek];
      	timetables.push(timetable);
	  }
	  var timetableSubmit = function(iteration) {
	  	console.log("iteration", timetables[iteration]);
		$http.post('api/timetable', timetables[iteration]).success(function(created) {
			console.log("created", created);
			if(iteration != (timetables.length -1)) {
				iteration++;
  				timetableSubmit(iteration);
			}
		}).error(function(err) {
   			console.log('error', err);
			if(iteration != (timetables.length -1)) {
				iteration++;
  				timetableSubmit(iteration);
			}
		});	
	  }
	  timetableSubmit(0);

            /*angular.forEach(newdata, function(data, index) {
        angular.forEach(data, function(d, i) {
        var mark = {};
        mark.school = school.school;
        mark.schoolid = school._id;
        mark.passmark = school.passmark;
        mark.grades = school.grades;
        mark.period = school.period;
          var head = i.toLowerCase().split(/[,;]/);
          var row = d.split(/[,;]/);
          if(row.length > 1) {
            angular.forEach(row, function(r, k) {
            mark[head[k]] = r;
            })
            console.log("mark student", mark.student);
            mark.import = true;
            $http.post('/api/marks', mark).success(function(created) {
              if (created.status == "Pass") {
                if(!allexams[created.educationyear+'_'+ created.typeofexam+'_'+created.standard+'_'+created.division])
                  allexams[created.educationyear+'_'+ created.typeofexam+'_'+created.standard+'_'+created.division] = [];                
                allexams[created.educationyear+'_'+ created.typeofexam+'_'+created.standard+'_'+created.division].push({_id: created._id, total: created.total});
              }
              sentcount++;
              console.log("i", sentcount);
            	if(sentcount == csvdata.length - 1) {
                console.log("Ranks", allexams);
            		console.log("Ranks length", allexams.length);
                angular.forEach(allexams, function(yv, yk) {
                    console.log("educationYear", yk);
                    console.log("educationval", yv);
                    var ri = 1;
                    var ric = 0;
                  var rankcount = yv.length;
                  yv.sort(function(a,b) { return parseInt(a.total) - parseInt(b.total) } );
                  for (var mk = yv.length - 1; mk >= 0; mk--) {
                    yv[mk].rank = ri;
                    if(mk > 0) {
                      if(yv[mk].total == yv[mk-1].total) {
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
                    console.log("current val:", yv[mk]);
                    $http.post('/api/marks/'+yv[mk]._id, {rank: yv[mk].rank, import: true}).success(function(rankupdated) {
                      console.log("rank updated successfully", rankupdated);
                    }).error(function(err) {
                      console.log("rank not updated", err);
                    });
                  };
                })
            	}
            }).error(function(err) {
               console.log('error', err);
            });
          }
        });
      })*/
    }
  }
});
