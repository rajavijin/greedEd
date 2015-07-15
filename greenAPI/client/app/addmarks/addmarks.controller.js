'use strict';

angular.module('greenApiApp')
  .controller('AddmarksCtrl', function ($scope, $http, Auth) {

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

  	$scope.addschoolmarks = function(schoolItem) {
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
    var allmarks = [];
    var ranks = [];
    var allranks = [];
    var allexams = {};
    var sentcount = 0;
    school.ranktype = (school.ranktype) ? school.ranktype : "dynamic";
    if(csvdata && !$scope.processing) {
      $scope.processing = true;
      var newdata = csvdata;
      console.log("total", csvdata.length);
      for (var i = 0; i < newdata.length; i++) {
        var userdata = {};
        if(i > 2) {
          for(var dkey in newdata[i]) {
            var head = newdata[2][dkey].toLowerCase().split(/[;]/);
            var row = newdata[i][dkey].split(/[;]/);
            if(row.length > 1) {
              for (var ri = 0; ri < row.length; ri++) {
                userdata[head[ri].replace(/"/g, "")] = row[ri].replace(/"/g, "");
              };
              userdata.import = true;
              console.log("mark", userdata);
              allmarks.push(userdata);              
            }
          }
        };
      };
    }
    console.log("USERDATA:", allmarks);
    var allmarkSubmit = function(mi) {
      allmarks[mi].school = school.school;
      allmarks[mi].schoolid = school._id;
      allmarks[mi].passmark = school.passmark;
      allmarks[mi].grades = school.grades;
      allmarks[mi].period = school.period;
      var common = Object.keys(newdata[0]);
      console.log("Common", common);
      var commonHead = common[0].toLowerCase().split(";");
      console.log("Common head", commonHead);
      var commonVal = newdata[0][common[0]].toLowerCase().split(";");
      console.log("commonVal", commonVal);
      for (var c = 0; c < commonHead.length; c++) {
        if(commonVal[c]) {
          allmarks[mi][commonHead[c].replace(/"/g, "")] = commonVal[c].replace(/"/g, "");
        }
      };
      console.log("iteration", allmarks[mi]);
      $http.post('api/marks', allmarks[mi]).success(function(created) {
        console.log("created", created);
        if (created.status == "Pass") {
          if(!allexams[created.educationyear+'_'+ created.typeofexam+'_'+created.standard+'_'+created.division])
            allexams[created.educationyear+'_'+ created.typeofexam+'_'+created.standard+'_'+created.division] = [];                
          allexams[created.educationyear+'_'+ created.typeofexam+'_'+created.standard+'_'+created.division].push({_id: created._id, total: created.total});
        }
        if(mi != (allmarks.length -1)) {
          mi++;
          allmarkSubmit(mi);
        } else {
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
        if(mi != (allmarks.length -1)) {
          mi++;
          allmarkSubmit(mi);
        }
      });
    }   
    allmarkSubmit(0);
  }
});
