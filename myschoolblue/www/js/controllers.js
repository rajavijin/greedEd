angular.module('starter.controllers', ['starter.services'])

.controller('AppCtrl', function($scope, $stateParams, $cordovaSQLite, $rootScope, $state, $window, MyService) {
  user = JSON.parse(localStorage.getItem('user')) || user;
  $scope.school = user.school;
  $scope.uid = localStorage.getItem('uid') || '';
  if($scope.uid) {
    $scope.authorized = true;
    if(user.role == "hm") {
      $scope.menuLinks = {"Links":[{"title":"Dashboard", "href":"app/hmdashboard", "class":"ion-stats-bars"}, {"title":"Classes", "href":"app/allclasses", "class": "ion-easel"}, {"title":"Students", "href":"app/allstudents", "class": "ion-person-stalker"},{"title":"Teachers", "href":"app/allteachers", "class": "ion-ios-body"},{"title":"Wall","href":"app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};
    } else if (user.role == "parent") {
      if(user.students.length > 1) {
        $scope.menuLinks = {"Links":[{"title":"Children", "href":"app/allstudents", "class": "ion-person-stalker"},{"title":"Wall","href":"app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};
      } else {
        $scope.menuLinks = {"Links":[{"title":"Dashboard", "href":"app/studentdashboard", "class":"ion-stats-bars"},{"title":"Profile", "href":"app/studentprofile", "class": "ion-person"},{"title":"Wall","href":"app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};
      }
    } else {
      if(user.standard) {
        $scope.menuLinks = {"Links":[{"title":"Class Dashboard", "href":"app/dashboard", "class":"ion-stats-bars"},{"title":"Teacher Dashboard", "href":"app/teacherdashboard", "class":"ion-stats-bars"}, {"title":"Students", "href":"app/allstudents", "class": "ion-person-stalker"},{"title":"Profile", "href":"app/classprofile", "class": "ion-person"},{"title":"Wall","href":"app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};
      } else {
        $scope.menuLinks = {"Links":[{"title":"Dashboard", "href":"app/teacherdashboard", "class":"ion-stats-bars"},{"title":"Profile", "href":"app/classprofile", "class": "ion-person"},{"title":"Wall","href":"app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};                            
      }
    }
  } else {
    $scope.authorized = false;
    $scope.menuLinks = {"Links":[{"title":"log-in", "href":"app.home", "class": "ion-log-in"}]};
  }
  if(localStorage.getItem('filterdata')) {
    filtersData = JSON.parse(localStorage.getItem('filterdata'));
  } else {
    filtersData.years = user.years;
    filtersData.educationyear = user.years.indexOf(user.educationyear);
    if(user.typeofexams.length > 0) {
      console.log("MY current page:", $state.current.name);
      user.typeofexams.unshift("All");
      filtersData.typeofexams = user.typeofexams;
      filtersData.typeofexam = user.typeofexams.indexOf(user.latesttypeofexam);
    }
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
  }
  $rootScope.filtersData = filtersData;
  var filterStatus = function(page) {
    $rootScope.noexams = false;
    $rootScope.page = page;
    console.log("dashboard index:", page.indexOf('ashboard'));
    console.log("Page:", page);
    if((page.indexOf('ashboard') > 0) && (filtersData.years.length > 0)) {
        $rootScope.filters = true;
    } else {
        $rootScope.filters = false;
    }     
    if(filtersData.typeofexams) {
      if(page == 'app.studentDashboard') {
        filtersData.typeofexams[0] = "NoAll";
        if(filtersData.typeofexam == 0) filtersData.typeofexam = user.typeofexams.indexOf(user.latesttypeofexam);
      } else {
        filtersData.typeofexams[0] = "All";
      }
      console.log("filt data", filtersData);
      localStorage.setItem('filtersData', JSON.stringify(filtersData));
      $rootScope.filtersData = filtersData;
    } 
  } 
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){ 
    if(fromState.name == 'logout') {
      $window.location.reload(true);
    } 
    if(toState.name == 'logout') {
      console.log("Logging out:");
      localStorage.removeItem('uid');
      localStorage.removeItem("DashParam");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      $state.go("home", {}, {reload: true});      
    }
    filterStatus(toState.name);
  })
  filterStatus($state.current.name);
})
.controller('HmDashboardCtrl', function($scope, $rootScope, $state, _, $cordovaSQLite, $ionicLoading, $ionicLoading, MyService, $stateParams) {
  var allsubjects = subjectDataPass = subjectDataFail = [];
  var pass = fail = 0;   
  var gradeData = toppers = {};
  $rootScope.hmfilterResults = function(page) {
    filtersData = $rootScope.filtersData;
    $scope.getMarksData();
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
  }
  $scope.getMarksData = function() {
    var params = filtersData;
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    params.studentid = "all";
    console.log("params", params);
    var dbkey = params.schoolid;
    if(!params.typeopexam || (params.typeofexam == 0)) {
      $scope.title = "School Overall Dashboard";      
    } else {
      $scope.title = "School "+ params.typeofexams[params.typeofexam] + " Dashboard";
      dbkey += '_'+params.year+'_'+params.typeofexams[params.typeofexam]+'_hm';
    }
    if(MyService.online()) {
      $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
      MyService.getMarks(params).then(function(studentMarks) {
        totalrecords = studentMarks.length;
        console.log("Got marks:", totalrecords);
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          pass = 0;
          fail = 0;
          subjectDataPass = [];
          subjectDataFail = [];
          allsubjects = [];
          gradeData = {};
          toppers = {};
          angular.forEach(studentMarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
          var query = "INSERT into marks (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from marks where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            console.log("record count", sres.rows.length);
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(studentMarks)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {$scope.dashboardStatus = "empty";}    
      }).finally(function() {$scope.$broadcast('scroll.refreshComplete'); $ionicLoading.hide();});
    } else {
      var type = user.typeofexams[params.typeofexam];
      var query = 'SELECT * from marks where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          pass = 0;
          fail = 0;
          subjectDataPass = [];
          subjectDataFail = [];
          allsubjects = [];
          gradeData = {};
          toppers = {};          
          var allmarks = JSON.parse(res.rows.item(0).value);
          console.log("allmarks", allmarks);
          angular.forEach(allmarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
        } else {$scope.dashboardStatus = "empty";}
      }, function(err) {

      }).finally(function() {$scope.$broadcast('scroll.refreshComplete'); $ionicLoading.hide();});
    }
  }
  var processMarksVal = function(v, k, status) {
    if(v.status == "Pass") pass++;
    if(v.status == "Fail") fail++;
    v.marks.forEach(function(mv, mk) {
      if(allsubjects.indexOf(mv.subject) == -1) {
        allsubjects.push(mv.subject);
      }
      subjectDataPass[mv.subject] = (subjectDataPass[mv.subject]) ? subjectDataPass[mv.subject] : 0;
      subjectDataFail[mv.subject] = (subjectDataFail[mv.subject]) ? subjectDataFail[mv.subject] : 0;   
      if(mv.mark >= user.passmark) {
        subjectDataPass[mv.subject]++;
      } else {
        subjectDataFail[mv.subject]++;
      }
    })
    if(gradeData[v.grade]) {
      gradeData[v.grade] = {name: v.grade, y: parseInt(gradeData[v.grade].y) + 1};
    } else {
      if(v.grade)
        gradeData[v.grade] = {name: v.grade, y: 1};
    }
    if(toppers[v.standard+v.division]) {
      if(toppers[v.standard+v.division].total < v.total) {
        toppers[v.standard+v.division] = {student: v.student, standard: v.standard, division: v.division.toUpperCase(), total: v.total, studentid: v.studentid};
      }
    } else {
      toppers[v.standard+v.division] = {student: v.student, standard: v.standard, division: v.division.toUpperCase(), total: v.total, studentid: v.studentid};
    }
  }
  var applyMarks = function() {
    console.log("Toppers", toppers);
    var toppersList = [];
    _.each(toppers, function(v, k) {
      if(v) {
        toppersList.push(v);
      }
    });
    $scope.toppers = toppersList;
    var gradeVal = [];
    angular.forEach(gradeData, function(gv, gk) {
      gradeVal.push(gv);
    })
    var passvals = []
    var failvals = []
    angular.forEach(allsubjects, function(us, uk) {
      passvals.push(subjectDataPass[us]);
      failvals.push(subjectDataFail[us]);
    })
    $scope.passfailConfig = {
      chart: {renderTo: 'passfailstatus',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      title: {text:"Pass/Fail"},plotOptions: {pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}},tickInterval:1},
      series: [{type: 'pie',name: 'Total',data: [{name:"Pass", y:pass},{name:"Fail", y:fail}]}]
    };
    $scope.subjectsConfig = {
      chart: {renderTo: 'subjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subjects Pass/Fail"},plotOptions: {column: {depth: 25,dataLabels: {enabled: true,format: '{point.y}'}}},
      xAxis: {categories: allsubjects},
      yAxis: {title: {text: null}},
      series: [{name: 'Pass',data: passvals},{name: 'Fail',data: failvals}]
    }; 
    $scope.gradeConfig = {
      chart: {renderTo: 'grades',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
      title: {text:"Grades"},plotOptions: {pie: {innerSize: 0,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: gradeVal}]
    };
  }
})
.controller('DashboardCtrl', function($scope, $rootScope, $state, $cordovaSQLite, $ionicLoading, MyService, $stateParams) {
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $rootScope.filterResults = function(page) {
    console.log("filter is called");
    filtersData = $rootScope.filtersData;
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $scope.getMarksData();
  }
  var allsubjects = subjectDataPass = subjectDataFail = toppers = subjectDataMarks = topperSubjects = [];
  var pass = fail = 0;   
  var gradeData = {};
  $scope.getMarksData = function() {
    $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
    var params = filtersData;
    console.log("user", user);
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    params.studentid = params.standard = params.division = "all";
    if(user.standard) {
      params.standard = user.standard;
      params.division = (user.division) ? user.division : "all";
    }
    var tdashparams = localStorage.getItem("DashParam") || '';
    console.log("tdashparams", tdashparams);
    if(tdashparams) {
      var tdashp = tdashparams.split("|");
      if(tdashp[1]){
        params.standard = tdashp[0];
        params.division = tdashp[1];
      }
    }
    $scope.standard = params.standard;
    $scope.division = params.division;
    if(!params.typeofexam || (params.typeofexam == 0)) {
      $scope.title = params.standard +'/'+params.division+' Overall Dashboard';
    } else {
      $scope.title = params.standard +'/'+params.division+' '+params.typeofexams[params.typeofexam]+' Dashboard';      
      var dbkey = params.schoolid +'_'+params.year+'_'+params.typeofexams[params.typeofexam]+'_'+params.standard+'_'+params.division;
    }
    console.log("params", params);
    if(MyService.online()) {
      MyService.getMarks(params).then(function(studentMarks) {
        totalrecords = studentMarks.length;
        console.log("Got marks:", totalrecords);
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          pass = 0;
          fail = 0;
          subjectDataPass = [];
          subjectDataFail = [];
          allsubjects = [];
          subjectDataMarks = [];       
          toppers = [];
          topperSubjects = [];
          gradeData = {};
          angular.forEach(studentMarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
          var query = "INSERT into marks (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from marks where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(studentMarks)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {$scope.dashboardStatus = "empty";}    
      }).finally(function() {$scope.$broadcast('scroll.refreshComplete'); $ionicLoading.hide();});
    } else {
      var type = user.typeofexams[params.typeofexam];
      var query = 'SELECT * from marks where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          pass = 0;
          fail = 0;
          subjectDataPass = [];
          subjectDataFail = [];
          allsubjects = [];
          subjectDataMarks = [];       
          toppers = [];
          topperSubjects = [];
          gradeData = {};
          var allmarks = JSON.parse(res.rows.item(0).value);
          console.log("allmarks", allmarks);
          angular.forEach(allmarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
        } else {$scope.dashboardStatus = "empty";}
      }, function(err) {

      }).finally(function() {$scope.$broadcast('scroll.refreshComplete'); $ionicLoading.hide();});
    }
  }
  var processMarksVal = function(v, k, status) {
    if(v.status == "Pass") pass++;
    if(v.status == "Fail") fail++;
    v.marks.forEach(function(mv, mk) {
      if(allsubjects.indexOf(mv.subject) == -1) {
        allsubjects.push(mv.subject);
      }
      subjectDataPass[mv.subject] = (subjectDataPass[mv.subject]) ? subjectDataPass[mv.subject] : 0;
      subjectDataFail[mv.subject] = (subjectDataFail[mv.subject]) ? subjectDataFail[mv.subject] : 0;   
      if(mv.mark >= user.passmark) {
        subjectDataPass[mv.subject]++;
      } else {
        subjectDataFail[mv.subject]++;
      }
      if(subjectDataMarks[mv.subject]) {
        subjectDataMarks[mv.subject] = parseInt(mv.mark) + subjectDataMarks[mv.subject];
      } else {
        subjectDataMarks[mv.subject] = parseInt(mv.mark);
      }
      if(topperSubjects[mv.subject]) {
        if(parseInt(mv.mark) > topperSubjects[mv.subject].total) {
          topperSubjects[mv.subject] = {total: mv.mark, student:v.student, subject: mv.subject, classd: v.standard+v.division.toUpperCase()};              
        } else if (parseInt(mv.mark) == topperSubjects[mv.subject].total) {
          topperSubjects[mv.subject].student = topperSubjects[mv.subject].student + "," + v.student;
        }
      } else {
        topperSubjects[mv.subject] = {total: mv.mark, student:v.student, subject: mv.subject, classd: v.standard+v.division.toUpperCase()};              
      }
    })
    if(gradeData[v.grade]) {
      gradeData[v.grade] = {name: v.grade, y: parseInt(gradeData[v.grade].y) + 1};
    } else {
      if(v.grade)
        gradeData[v.grade] = {name: v.grade, y: 1};
    }
    if(toppers[v.standard]) {
      if(toppers[v.standard].total < v.total) {
        toppers[v.standard] = {student: v.student, studentid:v.studentid, standard: v.standard, division: v.division.toUpperCase(), total: v.total};
      }
    } else {
      toppers[v.standard] = {student: v.student, studentid:v.studentid, standard: v.standard, division: v.division.toUpperCase(), total: v.total};
    }
  }
  var applyMarks = function() {
    $scope.tpassfailConfig = {};
    var gradeVal = [];
    angular.forEach(gradeData, function(gv, gk) {
      gradeVal.push(gv);
    })
    var passvals = [];
    var failvals = [];
    var topperS = [];
    angular.forEach(allsubjects, function(us, uk) {
      passvals.push(subjectDataPass[us]);
      failvals.push(subjectDataFail[us]);
      if(topperSubjects[us]) {
        topperS.push(topperSubjects[us]);
      } else {
        topperS.push({total:0, student:"", subject: us, classd: ""});
      }
    })
    $scope.tpassfailConfig = {
      chart: {renderTo: 'tpassfailstatus',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      title: {text:"Pass/Fail"},plotOptions: {pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [["Pass", pass],["Fail", fail]]}]
    };
    $scope.tgradeConfig = {
      chart: {renderTo: 'tgrades',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
      title: {text:"Grades"},plotOptions: {pie: {innerSize: 0,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: gradeVal}]
    };
    $scope.tsubjectsConfig = {
      chart: {renderTo: 'tsubjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subjects Pass/Fail"},plotOptions: {column: {depth: 25,dataLabels: {enabled: true,format: '{point.y}'}}},
      xAxis: {categories: allsubjects},
      yAxis: {title: {text: null}},
      series: [{name: 'Pass',data: passvals},{name: 'Fail',data: failvals}]
    };    
    var toppersList = [];
    _.each(toppers, function(v, k) {
      if(v) {
        toppersList.push(v);
      }
    });
    $scope.toppers = toppersList;
    $scope.subjectToppers = topperS;
  }
})
.controller('TeacherDashboardCtrl', function($scope, $rootScope, $state, $cordovaSQLite, $ionicLoading, MyService, $stateParams) {
  var title = user.name;
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $rootScope.teacherFilterResults = function(page) {
    console.log("filter is called");
    filtersData = $rootScope.filtersData;
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $scope.getMarksData();
  }
  var allsubjects = subjectDataPass = subjectDataFail = toppers = subjectDataMarks = topperSubjects = [];
  var pass = fail = 0;   
  var gradeData = {};
  $scope.getMarksData = function() {
    $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
    var params = filtersData;
    console.log("user", user);
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    params.studentid = "all";
    params.standard = "teacher";
    title = (localStorage.getItem("DashParam")) ? localStorage.getItem("DashParam") : title; 
    params.division = title;
    console.log("params", params);
    $scope.username = title;
    $scope.title = title +" Dashboard";
    if(params.typeofexam) {
      var dbkey = params.schoolid +'_'+params.year+'_'+params.typeofexams[params.typeofexam]+'_'+params.standard+'_'+params.division;
      $scope.title = title+" "+params.typeofexams[params.typeofexam]+" Dashboard";
    }
    if(MyService.online()) {
      MyService.getMarks(params).then(function(studentMarks) {
        totalrecords = studentMarks.length;
        console.log("Got marks:", totalrecords);
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          pass = 0;
          fail = 0;
          subjectDataPass = [];
          subjectDataFail = [];
          allsubjects = [];
          subjectDataMarks = [];       
          toppers = [];
          topperSubjects = [];
          gradeData = {};
          angular.forEach(studentMarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
          var query = "INSERT into marks (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from marks where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(studentMarks)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {$scope.dashboardStatus = "empty";}    
      }).finally(function() {$scope.$broadcast('scroll.refreshComplete'); $ionicLoading.hide();});
    } else {
      var type = user.typeofexams[params.typeofexam];
      var query = 'SELECT * from marks where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          pass = 0;
          fail = 0;
          subjectDataPass = [];
          subjectDataFail = [];
          allsubjects = [];
          subjectDataMarks = [];       
          toppers = [];
          topperSubjects = [];
          gradeData = {};
          var allmarks = JSON.parse(res.rows.item(0).value);
          console.log("allmarks", allmarks);
          angular.forEach(allmarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
        } else {$scope.dashboardStatus = "empty";}
      }, function(err) {

      }).finally(function() {$scope.$broadcast('scroll.refreshComplete'); $ionicLoading.hide();});
    }
  }
  var processMarksVal = function(v, k, status) {
    if(v.status == "Pass") pass++;
    if(v.status == "Fail") fail++;
    var key = v.standard+v.division
    v.marks.forEach(function(mv, mk) {
      if(mv.teacher == title) {
        key += ':'+mv.subject;
        if(allsubjects.indexOf(key) == -1) {
          allsubjects.push(key);
        }
        subjectDataPass[key] = (subjectDataPass[key]) ? subjectDataPass[key] : 0;
        subjectDataFail[key] = (subjectDataFail[key]) ? subjectDataFail[key] : 0;   
        if(mv.mark >= user.passmark) {
          subjectDataPass[key]++;
        } else {
          subjectDataFail[key]++;
        }
/*        if(subjectDataMarks[mv.subject]) {
          subjectDataMarks[mv.subject] = parseInt(mv.mark) + subjectDataMarks[mv.subject];
        } else {
          subjectDataMarks[mv.subject] = parseInt(mv.mark);
        }*/
        if(topperSubjects[key]) {
          if(parseInt(mv.mark) > topperSubjects[key].total) {
            topperSubjects[key] = {total: mv.mark, student:v.student, subject: mv.subject, classd: v.standard+v.division.toUpperCase()};              
          } else if (parseInt(mv.mark) == topperSubjects[key].total) {
            topperSubjects[key].student = topperSubjects[key].student + "," + v.student;
          }
        } else {
          topperSubjects[key] = {total: mv.mark, student:v.student, subject: mv.subject, classd: v.standard+v.division.toUpperCase()};              
        }
      }
    })
    if(gradeData[v.grade]) {
      gradeData[v.grade] = {name: v.grade, y: parseInt(gradeData[v.grade].y) + 1};
    } else {
      if(v.grade)
        gradeData[v.grade] = {name: v.grade, y: 1};
    }
    var sub = key.split(":");
    if(toppers[key]) {
      if(toppers[key].total < v.total) {
        toppers[key] = {student: v.student, studentid:v.studentid, standard: v.standard, division: v.division.toUpperCase(), total: v.total, subject: sub[1]};
      }
    } else {
      toppers[key] = {student: v.student, studentid:v.studentid, standard: v.standard, division: v.division.toUpperCase(), total: v.total, subject: sub[1]};
    }
  }
  var applyMarks = function() {
    $scope.tpassfailConfig = {};
    var gradeVal = [];
    angular.forEach(gradeData, function(gv, gk) {
      gradeVal.push(gv);
    })
    var passvals = [];
    var failvals = [];
    var topperS = [];
    angular.forEach(allsubjects, function(us, uk) {
      passvals.push(subjectDataPass[us]);
      failvals.push(subjectDataFail[us]);
      if(topperSubjects[us]) {
        topperS.push(topperSubjects[us]);
      } else {
        topperS.push({total:0, student:"", subject: us, classd: ""});
      }
    })
    $scope.tpassfailConfig = {
      chart: {renderTo: 'tpassfailstatus',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      title: {text:"Pass/Fail"},plotOptions: {pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [["Pass", pass],["Fail", fail]]}]
    };
    $scope.tgradeConfig = {
      chart: {renderTo: 'tgrades',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
      title: {text:"Grades"},plotOptions: {pie: {innerSize: 0,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: gradeVal}]
    };
    $scope.tsubjectsConfig = {
      chart: {renderTo: 'tsubjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subjects Pass/Fail"},plotOptions: {column: {depth: 25,dataLabels: {enabled: true,format: '{point.y}'}}},
      xAxis: {categories: allsubjects},
      yAxis: {title: {text: null}},
      series: [{name: 'Pass',data: passvals},{name: 'Fail',data: failvals}]
    };    
    var toppersList = [];
    angular.forEach(allsubjects, function(v, k) {
        toppersList.push(toppers[v]);
    });
    console.log("Toppers", toppersList);
    $scope.toppers = toppersList;
    $scope.subjectToppers = topperS;
  }
})
.controller('AllClassesCtrl', function($scope, $rootScope, $cordovaSQLite, $ionicLoading, MyService) {
  var processUsers = function(users) {
    $scope.allClasses = true;
    var classes = [];
    var all = [];
    var standard = [];
    angular.forEach(users, function(uv, uk) {
      var allusers = [];
      var classd = uv.standard + uv.division;
      if(classes.indexOf(classd) == -1) {
        uv.classd = uv.standard + uv.division;
        allusers.push(uv);
        classes.push(classd);
        var sdkey = uv.standard+uv.division;
        var skey = uv.standard;
        if(uv.standard.length > 1) {
          sdkey = "_"+sdkey;
          skey = "_"+skey;
        }
        if(standard.indexOf(uv.standard) == -1 ) {
          all.push({standard:uv.standard, d: "all", division: "", classd: skey});
          standard.push(uv.standard);
        }
        all.push({standard:uv.standard, d:uv.division, division: uv.division.toUpperCase(), classd: sdkey});
      }
    });
    $scope.users = all;
  }
  $scope.getClassesData = function() {
    var params = {};
    params.schoolid = user.schoolid;
    params.sex = params.status = 'all';
    var dbkey = user.schoolid+"_students";
    console.log("Class Params", params);
    if(MyService.online()) {
      MyService.getUsers(params).then(function(users) {
        console.log("Got users", users.length);
        if(users.length > 0) {
          processUsers(users);
          var query = "INSERT into users (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from users where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(users)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {
          $scope.allClasses = false;
        }    
      });
    } else {
      var query = 'SELECT * from users where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          var allusers = JSON.parse(res.rows.item(0).value);
          processUsers(allusers);
        }
      }, function(err) {
        console.log("offline all users error", err);
      });
    }
  }  
})
.controller('AllStudentsCtrl', function($scope, $stateParams, $rootScope, $cordovaSQLite, $ionicLoading, MyService) {
  $scope.currentuser = user;
  $scope.filtersData = filtersData;
  $scope.getStudentsData = function() {
    var dbkey = user.schoolid;
    var params = {};
    params.schoolid = user.schoolid;
    params.sex = params.status = "all";
    if(user.role == 'parent') {
      title = user.name + ' Children';
      params._id = '';
      angular.forEach(user.students, function(sv, skey) {
        if(skey != user.students.length -1) {
          params._id += sv.id+'|';
        } else {
          params._id += sv.id;
        }
      })
      dbkey += '_'+user.name;
    } else {
      params.standard = (user.standard) ? user.standard : 'all';
      params.division = (user.division) ? user.division : 'all';
      if($stateParams.standard) params.standard = $stateParams.standard;
      if($stateParams.division) params.division = $stateParams.division;
      title = params.standard+'/'+params.division;
      if($stateParams.sex && $stateParams.sex != "all") {params.sex = $stateParams.sex; title += ' '+$stateParams.sex}
      if($stateParams.status && $stateParams.status != "all") {params.status = $stateParams.status; title += ' '+$stateParams.status}
      dbkey += "_"+params.standard+'_'+params.division+'_'+params.sex+'_'+params.status;
      title = title + ' Students';
    }
    console.log("Users Param", params);
    $scope.title = title;
    if(MyService.online()) {
      MyService.getUsers(params).then(function(users) {
        if(users.length > 0) {
          console.log("Got all users:", users.length);
          $scope.allStudents = true;
          $scope.users = users;
          var query = "INSERT into users (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from users where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(users)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {
          $scope.allStudents = false;
        }    
      });
    } else {
      var query = 'SELECT * from users where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          var allusers = JSON.parse(res.rows.item(0).value);
          $scope.allStudents = true;
          $scope.users = allusers;
        } else {
          $scope.allStudents = false;
        }
      }, function(err) {
        console.log("offline all users error", err);
      });
    }
  }
})
.controller('AllTeachersCtrl', function($scope, $stateParams, $rootScope, $cordovaSQLite, $ionicLoading, MyService) {
  $scope.currentuser = user;
  $scope.filtersData = filtersData;
  $scope.getTeachersData = function() {
    var dbkey = user.schoolid;
    var params = {};
    params.schoolid = user.schoolid;
    params.role = 'teacher';
    params.sex = params.status = "all";
    if(user.role == 'parent') {
      title = user.name + ' Children';
      params._id = '';
      angular.forEach(user.students, function(sv, skey) {
        if(skey != user.students.length -1) {
          params._id += sv.id+'|';
        } else {
          params._id += sv.id;
        }
      })
      dbkey += '_'+user.name;
    } else {
      params.standard = (user.standard) ? user.standard : 'all';
      params.division = (user.division) ? user.division : 'all';
      if($stateParams.standard) params.standard = $stateParams.standard;
      if($stateParams.division) params.division = $stateParams.division;
      title = params.standard+'/'+params.division;
      if($stateParams.sex && $stateParams.sex != "all") {params.sex = $stateParams.sex; title += ' '+$stateParams.sex}
      if($stateParams.status && $stateParams.status != "all") {params.status = $stateParams.status; title += ' '+$stateParams.status}
      dbkey += "_"+params.standard+'_'+params.division+'_'+params.sex+'_'+params.status;
      title = title + ' Students';
    }
    console.log("Users Param", params);
    $scope.title = title;
    if(MyService.online()) {
      MyService.getUsers(params).then(function(users) {
        if(users.length > 0) {
          console.log("Got all users:", users.length);
          $scope.allStudents = true;
          $scope.users = users;
          var query = "INSERT into users (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from users where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(users)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {
          $scope.allStudents = false;
        }    
      });
    } else {
      var query = 'SELECT * from users where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          var allusers = JSON.parse(res.rows.item(0).value);
          $scope.allStudents = true;
          $scope.users = allusers;
        } else {
          $scope.allStudents = false;
        }
      }, function(err) {
        console.log("offline all users error", err);
      });
    }
  }
})
.controller('StudentDashboardCtrl', function($scope, $rootScope, $cordovaSQLite, $ionicLoading, $state, $stateParams, $ionicSideMenuDelegate, MyService) {
  console.log("SD filtersData", filtersData);
  var filtersData = JSON.parse(localStorage.getItem('filtersData')) || {};
  console.log("filtersData", filtersData);
  $rootScope.filtersData = filtersData;
  $scope.user = user;
  $rootScope.studentFilterResults = function(page) {
    filtersData = $rootScope.filtersData;
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $scope.getMarksData();
  }
  var subjectMarks = [];
  var subjectLabels = [];
  $scope.getMarksData = function() {
    $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
    var params = filtersData;
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    var sdashparams = localStorage.getItem("DashParam") || '';
    if(sdashparams) {
      console.log("Came from list: ", sdashparams);
      var sdash = sdashparams.split("-");
      params.studentid = sdash[0];
      params.standard = "all";
      params.division = "all";
      $scope.title =  sdash[1];
    }
    if(user.role == 'parent') {
      if(user.students.length == 1) {
        params.studentid = user.students[0].id;
        $scope.title = user.students[0].name;
      }
    }
    $scope.studentid = params.studentid;
    console.log("params", params);
    var dbkey = params.schoolid;
    if(params.typeofexam) {
      dbkey += '_'+params.year+'_'+user.typeofexams[params.typeofexam]+params.studentid;
      if(params.typeofexam % 1 === 0) {
        $scope.title += " "+params.typeofexams[params.typeofexam];
      } else {
        $scope.title += " "+params.typeofexam;
      }
    }
    if(MyService.online()) {
      MyService.getMarks(params).then(function(studentMarks) {
        totalrecords = studentMarks.length;
        console.log("Got marks:", totalrecords);
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          subjectMarks = [];
          subjectLabels = []; 
          angular.forEach(studentMarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          var query = "INSERT into marks (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from marks where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(studentMarks)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {$scope.dashboardStatus = "empty";}    
      }).finally(function() {$scope.$broadcast('scroll.refreshComplete'); $ionicLoading.hide();});
    } else {
      console.log("dbkey", dbkey);
      var query = 'SELECT * from marks where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        console.log("total records:", totalrecords);
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          subjectMarks = [];
          subjectLabels = [];
          var allmarks = JSON.parse(res.rows.item(0).value);
          console.log("allmarks", allmarks);
          angular.forEach(allmarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
        } else {$scope.dashboardStatus = "empty";}
      }, function(err) {

      }).finally(function() {$scope.$broadcast('scroll.refreshComplete'); $ionicLoading.hide();});
    }
  }
  var processMarksVal = function(v, k, status) {
    v.marks.forEach(function(mv, mk) {
      subjectLabels.push(mv.subject);
      subjectMarks.push(mv.mark);
    })
    $scope.ssubjectsConfig = {
      chart: {renderTo: 'ssubjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subject Marks"},plotOptions: {column: {depth: 25,showInLegend: false, dataLabels: {enabled: true,format: '{point.y}'}, events: {legendItemClick: function () {return false;}}}},
      xAxis: {categories: subjectLabels},
      yAxis: {title: {text: null}},
      series: [{name: 'Marks',data: subjectMarks}]
    };
    if(v.attendance) {
      var att = v.attendance.split("/");
      $scope.sattendanceConfig = {
      title: {text:"Attendance"},chart: {renderTo: 'sattendance',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
      plotOptions: {pie: {innerSize: 0,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [['Present', parseInt(att[0])],['Absent', parseInt(att[1]) - parseInt(att[0])]]}]
      };
    }
    $scope.mark = v;
  }
  $scope.getMarksData();
})
.controller('StudentOverallDashboardCtrl', function($scope, $rootScope, $stateParams, $cordovaSQLite, $ionicLoading, MyService) {
    var examLabels = examMarks = examGrades = allsubjects = attendance = ranks = allMarks = [];
    var subjectDataMarks = {};
    var student = '';
    var pass = fail = 0;
    $rootScope.noexams = true;
  $rootScope.overallFilterResults = function(page) {
    console.log("Filtersdata", $rootScope.filtersData);
    filtersData = $rootScope.filtersData;
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $scope.getMarksData();
  }
  $scope.getMarksData = function() {
    $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
    var params = filtersData;
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    params.standard = user.standard;
    params.division = (user.division) ? user.division : "all";
    var dbkey = params.schoolid +'_'+params.year+'_'+user.typeofexams[params.typeofexam];
    if($stateParams.standard) {
      params.standard = $stateParams.standard;
      dbkey += '_'+$stateParams.standard;
    }
    if($stateParams.division) {
      params.division = $stateParams.division;
      dbkey += '_'+$stateParams.division;
    }    
    var dashparam = localStorage.getItem("DashParam") || '';
    console.log("dashparam", dashparam);
    if(dashparam) {
      var dashp = dashparam.split("-");
      params.studentid = dashp[0];
    }    
    if(!params.studentid) {
      params.studentid = "all";
    }
    params.typeofexam = 0;
    console.log("params", params);
    examLabels = [];
    examMarks = [];
    examGrades = [];
    eachData = [];
    subjectDataMarks = {};
    student = '';
    attendance = [];
    ranks = [];
    pass = 0;
    fail = 0;
    allMarks = [];
    if(MyService.online()) {
      MyService.getMarks(params).then(function(studentMarks) {
        totalrecords = studentMarks.length;
        console.log("Got marks:", totalrecords);
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          angular.forEach(studentMarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
          var query = "INSERT into marks (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from marks where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(studentMarks)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {$scope.dashboardStatus = "empty";}    
      }).finally(function() {$scope.$broadcast('scroll.refreshComplete'); $ionicLoading.hide();});
    } else {
      var type = user.typeofexams[params.typeofexam];
      var query = 'SELECT * from marks where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          var allmarks = JSON.parse(res.rows.item(0).value);
          console.log("allmarks", allmarks);
          angular.forEach(allmarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
        } else {$scope.dashboardStatus = "empty";}
      }, function(err) {

      }).finally(function() {$scope.$broadcast('scroll.refreshComplete'); $ionicLoading.hide();});;
    }
  }
  var processMarksVal = function(v, k, status) {
    examLabels.push(v.typeofexam);
    examMarks.push({name: v.typeofexam, y: v.percentage});
    allMarks.push({name: v.typeofexam, y: v.total});
    attendance.push(v.attendanceP);
    if(v.status == "Pass") pass = pass + 1;
    if(v.status == "Fail") fail = fail + 1;

    ranks.push(v.rank);
    v.marks.forEach(function(mv, mk) {
      if(allsubjects.indexOf(mv.subject) == -1) {
        allsubjects.push(mv.subject);
      }
      if(!subjectDataMarks[mv.subject])
        subjectDataMarks[mv.subject] = [];
      subjectDataMarks[mv.subject].push({name: mv.subject, y:parseInt(mv.mark)});
    })
    student = v.student;
  }
  var applyMarks = function() {
    $scope.title = student;
    $scope.somarksConfig = {
      chart: {renderTo: 'somarks',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Percentage"},plotOptions: {column: {depth: 25,showInLegend: false, dataLabels: {enabled: true,format: '{point.y}%'},events: {legendItemClick: function () {return false;}}},allowPointSelect: false},
      xAxis: {categories: examLabels},
      yAxis: {title: {text: null},max:100},
      series: [{name: 'Percentage',data: examMarks}]
    };
    $scope.allmarksConfig = {
      chart: {renderTo: 'allmarks',type: 'line', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Total Mark"},plotOptions: {line: {dataLabels: {enabled: true},showInLegend: false,enableMouseTracking: false,events: {legendItemClick: function () {return false;}}}},
      xAxis: {categories: examLabels},
      yAxis: {title: {text: null}, max:allsubjects.length*100},
      series: [{name: 'Total',data: allMarks}]
    };    
    var allsubjectData = [];
    allsubjects.forEach(function(sv, sk) {
      allsubjectData.push({name: sv, data: subjectDataMarks[sv]});
    })
    console.log("examLabels", examLabels);
    console.log("subjectDataMarks", subjectDataMarks);
    console.log("attendance", attendance);
    $scope.sosubjectsConfig = {
      chart: {renderTo: 'sosubjects',type: 'spline', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subjects"},plotOptions: {spline: {depth: 25}},
      xAxis: {categories: examLabels},
      yAxis: {title: {text: null}},
      series: allsubjectData
    };
    $scope.ranksConfig = {
      chart: {renderTo: 'ranks',type: 'line', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Rank"},plotOptions: {line: {dataLabels: {enabled: true},showInLegend: false,enableMouseTracking: false,events: {legendItemClick: function () {return false;}}}},
      xAxis: {categories: examLabels},
      yAxis: {title: {text: null},tickInterval: 1, min: 0,},
      series: [{name: 'Rank',data: ranks}]
    }; 
    $scope.opassfailConfig = {
      chart: {renderTo: 'opassfail',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      title: {text:"Total Pass/Fail"},plotOptions: {pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [["Pass", pass],["Fail", fail]]}]
    };        
    $scope.soattendanceConfig = {
      chart: {renderTo: 'soattendance',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Attendance"},plotOptions: {column: {depth: 25,showInLegend: false, dataLabels: {enabled: true,format: '{point.y}%'},events: {legendItemClick: function () {return false;}}},allowPointSelect: false},
      xAxis: {categories: examLabels},
      yAxis: {title: {text: null}, max:100},
      series: [{name: 'Attendance',data: attendance}]
    };
  }
})
.controller('StudentProfileCtrl', function($scope, $rootScope, $cordovaSQLite, $ionicLoading, MyService, $stateParams) {
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $scope.currentuser = user;
  $scope.filtersData = filtersData;
  $scope.getStudentsData = function() {
    var params = {};
    params.sex = params.status = 'all';
    params.schoolid = user.schoolid;
    if($stateParams.standard) {
      params.standard = $stateParams.standard;
      dbkey += "_"+$stateParams.standard;
    }
    if($stateParams.division) {
      params.division = $stateParams.division;
      dbkey += "_"+$stateParams.division;
    }
    if($stateParams.studentid) {
      params._id = $stateParams.studentid;
      dbkey += "_"+$stateParams.studentid;
    }
    if(user.students.length == 1) {
      params._id = user.students[0].id;
    }
    var dbkey = params.schoolid+'_'+params._id;
    if(MyService.online()) {
      MyService.getUsers(params).then(function(users) {
        if(users.length > 0) {
          $scope.allStudents = true;
          $scope.user = users[0];
          var query = "INSERT into users (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from users where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(users)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {
          $scope.allStudents = false;
        }    
      });
    } else {
      var query = 'SELECT * from users where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          var allusers = JSON.parse(res.rows.item(0).value);
          $scope.allStudents = true;
          $scope.user = allusers[0];
        } else {
          $scope.allStudents = false;
        }
      }, function(err) {
        console.log("offline all users error", err);
      });
    }
  }
})
.controller('TeacherProfileCtrl', function($scope, $rootScope, $cordovaSQLite, $ionicLoading, MyService, $stateParams) {
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $scope.filtersData = filtersData;
  $scope.getTeacherData = function() {
    if(user.role == 'teacher') {
      $scope.user = user;
    } else {
      var params = {};
      params.sex = params.status = 'all';
      params.schoolid = user.schoolid;
      params.role = "teacher";
      if($stateParams.teacher) {
        params.name = $stateParams.teacher;
        dbkey += "_"+$stateParams.teacher;
      }
      var dbkey = params.schoolid+'_'+params.name;
      console.log("Profile params:", params);
      if(MyService.online()) {
        MyService.getUsers(params).then(function(users) {
          if(users.length > 0) {
            $scope.allStudents = true;
            $scope.user = users[0];
            var query = "INSERT into users (key, value) VALUES (?, ?)";
            var selectq = 'SELECT key from users where key = "'+dbkey+'"';
            $cordovaSQLite.execute(db, selectq).then(function(sres) {
              if(sres.rows.length == 0) {
                var values = [dbkey, JSON.stringify(users)];
                $cordovaSQLite.execute(db, query, values).then(function(res) {
                  console.log("insertId: " + res.insertId);
                })
              }
            })
          } else {
            $scope.allStudents = false;
          }    
        });
      } else {
        var query = 'SELECT * from users where key = "'+dbkey+'"';
        $cordovaSQLite.execute(db, query).then(function(res) {
          totalrecords = res.rows.length;
          if(totalrecords > 0) {
            var allusers = JSON.parse(res.rows.item(0).value);
            $scope.allStudents = true;
            $scope.user = allusers[0];
          } else {
            $scope.allStudents = false;
          }
        }, function(err) {
          console.log("offline all users error", err);
        });
      }
    }
  }
})
.controller('ClassProfileCtrl', function($scope, $rootScope, $cordovaSQLite, $ionicLoading, MyService, $stateParams) {
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $scope.currentuser = user;
  $scope.filtersData = filtersData;
  var classData = {};
  $scope.getStudentsData = function() {
    var dbkey = user.schoolid;
    var params = {};
    params.schoolid = user.schoolid;
    params.standard = (user.standard) ? user.standard : 'all';
    params.division = (user.division) ? user.division : 'all';
    params.sex = params.status = 'all';
    if($stateParams.standard) params.standard = $stateParams.standard;
    if($stateParams.division) params.division = $stateParams.division;
    $scope.standard = params.standard;
    $scope.division = params.division;
    $scope.title = params.standard + '/'+params.division +' Profile';
    dbkey += '_'+params.standard+'_'+params.division+'_profile';
    if(MyService.online()) {
      MyService.getUsers(params).then(function(allusers) {
        console.log("Got all users:", allusers.length);
        if(allusers.length > 0) {
          $scope.allClasses = true;
          classData = {};
          angular.forEach(allusers, function(v,k) {
            processMarksVal(v, k, "online");
          })
          classData.total = allusers.length;
          console.log("classData", classData);
          $scope.classData = classData;
          var query = "INSERT into users (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from users where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(allusers)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {
          $scope.allClasses = false;
        }    
      });
    } else {
      var query = 'SELECT * from users where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          var allusers = JSON.parse(res.rows.item(0).value);
          $scope.allStudents = true;
          angular.forEach(allusers, function(v,k) {
            processMarksVal(v, k, "online");
          })
          classData.total = totalrecords;
          console.log("classData", classData);
          $scope.classData = classData;
        } else {
          $scope.allStudents = false;
        }
      }, function(err) {
        console.log("offline all users error", err);
      });
    }
  }
  var processMarksVal = function(v, k, status) {
    classData.teacher = v.teacher;
    if(!classData.male) classData.male = 0;
    classData.male = (v.sex.toLowerCase() == "male") ? classData.male + 1 : classData.male;
    if(!classData.female) classData.female = 0;
    classData.female = (v.sex.toLowerCase() == "female") ? classData.female + 1 : classData.female;
    if(!classData.allstudent) classData.allstudents = [];
    classData.allstudents.push({name: v.name, studentid: v._id});
  }
})
.controller('WallCtrl', function($scope, $state) {
  console.log("Awesome Wall");
  $scope.addpost = function() {
    $state.go('app.addpost', {});
  }
  
})
.controller('AddPostCtrl', function($scope, $cordovaCamera, $ionicLoading, MyService) {
  console.log("Add Post");
  $scope.post = {};
  $scope.post.pictures = [];
  $scope.data = { "ImageURI" :  "Select Image" };
    $scope.takePicture = function() {
    var options = {
        quality: 50,
        destinationType: Camera.DestinationType.DATA_URL,
        sourceType: Camera.PictureSourceType.CAMERA,
      };
    $cordovaCamera.getPicture(options).then(
    function(imageURI) {
      $scope.post.pictures.push("data:image/jpeg;base64," +imageURI);
      $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-calm">Success</ion-spinner>', duration:500});
    },
    function(err){
      $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-calm">Error</ion-spinner>', duration:500});
      })
    }

    $scope.selectPicture = function() { 
    var options = {
      quality: 50,
      destinationType: Camera.DestinationType.FILE_URI,
      sourceType: Camera.PictureSourceType.PHOTOLIBRARY
    };

    $cordovaCamera.getPicture(options).then(
    function(imageURI) {
      //A hack that you should include to catch bug on Android 4.4 (bug < Cordova 3.5):
      console.log("imageURI", imageURI);
      window.resolveLocalFileSystemURI(imageURI, function(fileEntry) {

        //If this doesn't work
        $scope.image = fileEntry.nativeURL;

        //Try this
        //var image = document.getElementById('myImage');
        //image.src = fileEntry.nativeURL;
      });
      $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-calm">Success</ion-spinner>', duration:500});
    },
    function(err){
      $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-calm">Error</ion-spinner>', duration:500});
    })
  };

    $scope.uploadPicture = function() {
    $ionicLoading.show({template: 'Sto inviando la foto...'});
    var fileURL = $scope.picData;
    var options = new FileUploadOptions();
    options.fileKey = "file";
    options.fileName = fileURL.substr(fileURL.lastIndexOf('/') + 1);
    options.mimeType = "image/jpeg";
    options.chunkedMode = true;

    var params = {};
    params.value1 = "someparams";
        params.value2 = "otherparams";

    options.params = params;

    var ft = new FileTransfer();
    ft.upload(fileURL, encodeURI("http://www.yourdomain.com/upload.php"), viewUploadedPictures, function(error) {$ionicLoading.show({template: 'Errore di connessione...'});
    $ionicLoading.hide();}, options);
    }
  $scope.submit = function() {
    if(MyService.online()) {
      var params = $scope.post;
      params.from = user._id;
      params.school = user.schoolid;
      params.to = "";
      if(user.role == 'hm') {
        params.to = "all";
      } else if (user.role == 'teacher') {
        if(user.standard) {
          params.to = user.standard+':'+user.division;
        } else {
          for (var i = 0; i < user.subjects.length; i++) {
            params.to += (i == user.subjects.length - 1) ? user.subjects[i].class : user.subjects[i].class + ',';
          }
        }
      }
      console.log("data", params);

    } else {
      
    }
  }
})
.controller('LoginCtrl', function($scope, $rootScope, $http, $state, $ionicPopup, $ionicHistory, $ionicLoading, MyService) {
  $scope.uid = localStorage.getItem('uid') || '';
  user = (localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')) : {};
  if($scope.uid) {
    if(user.role == "hm") {
      $scope.menuLinks = {"Links":[{"title":"Dashboard", "href":"app/hmdashboard", "class":"ion-stats-bars"}, {"title":"Classes", "href":"app/allclasses", "class": "ion-easel"}, {"title":"Students", "href":"app/allstudents", "class": "ion-person-stalker"},{"title":"Teachers", "href":"app/allteachers", "class": "ion-ios-body"},{"title":"Wall","href":"app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};
      $state.go('app.hmdashboard', {}, {reload: true});
    } else if (user.role == "parent") {
      if(user.students.length > 1) {
        $scope.menuLinks = {"Links":[{"title":"Children", "href":"app/allstudents", "class": "ion-person-stalker"},{"title":"Wall","href":"app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};
        $state.go('app.allstudents', {}, {reload: true});
      } else {
        $scope.menuLinks = {"Links":[{"title":"Dashboard", "href":"app/studentdashboard", "class":"ion-stats-bars"},{"title":"Profile", "href":"app/studentprofile", "class": "ion-person"},{"title":"Wall","href":"app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};
        $state.go('app.studentDashboard', {}, {reload: true});
      }
    } else {
      if(user.standard) {
        $scope.menuLinks = {"Links":[{"title":"Class Dashboard", "href":"app/dashboard", "class":"ion-stats-bars"},{"title":"Teacher Dashboard", "href":"app/teacherdashboard", "class":"ion-stats-bars"}, {"title":"Students", "href":"app/allstudents", "class": "ion-person-stalker"},{"title":"Profile", "href":"app/classprofile", "class": "ion-person"},{"title":"Wall","href":"app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};
        $state.go('app.dashboard', {}, {reload: true});
      } else {
        $scope.menuLinks = {"Links":[{"title":"Dashboard", "href":"app/teacherdashboard", "class":"ion-stats-bars"}, {"title":"Wall","href":"app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};                            
        $state.go('app.teacherdashboard', {}, {reload: true});
      }
    }
  }
  //teacher
   $scope.user = {
    email: '7890003311@school-a.com',
    password: 'lgbzc9pb9'
  };  
  //parent with multiple student
  $scope.user = {
    email: '9944046100@school-a.com',
    password: '3w92lz0k9'
  };
  //parent with single student
  $scope.user = {
    email: '8879900341@school-a.com',
    password: 'z0db49529'
  };
  //hm
  $scope.user = {
    email: "8951572125",
    password: 'm1dtovranFLQ1mpgaCuL+w=='
  };
  //teacher single
  $scope.user = {
    email: '8787876464',
    password: 'ii1ss8aor'
  }
  $scope.login = function() {
    if(($scope.user.email == null) || ($scope.user.password == null)) {
      alert('Please fill the fields');
    } else {
      if(MyService.online()) {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
        MyService.login($scope.user).then(function(data) {
          $scope.email = null;
          $scope.password = null;
          $scope.authorized = true;
          $ionicLoading.hide();
          if(data.role == "hm") {
            $state.go("app.hmdashboard", {}, {'reload': true});
          } else if (data.role == "parent") {
            if(data.students.length == 1) {
              $state.go("app.studentDashboard", {}, {'reload': true});
            } else {
              $state.go("app.allstudents", {}, {'reload': true});            
            }
          } else {
            if(data.standard) {
              $state.go("app.dashboard", {}, {'reload': true});
            } else {
              $state.go("app.teacherdashboard", {}, {'reload': true});              
            }
          }
        }, function(err) {
          $ionicLoading.hide();
        });      
      } else {
        console.log("User login offline: ", user);
        if(user && (user.email == $scope.user.email)) {
          localStorage.setItem("uid", user._id);
          if(user.role == "hm") {
            $state.go("app.hmdashboard", {}, {'reload': true});
          } else if (user.role == "parent") {
            if(user.students.length == 1) {
              $state.go("app.studentDashboard", {}, {'reload': true});
            } else {
              $state.go("app.allstudents", {}, {'reload': true});            
            }
          } else {
            $state.go("app.dashboard", {}, {'reload': true});
          }
        } else {
          $ionicPopup.alert({
              title: 'Login failed!',
              template: 'Connect to internet and try again'
          });     
        }
      }
    }
  };
})
.controller('LogoutCtrl', function($scope, $http, $state) {
    delete $http.defaults.headers.common.Authorization;
    console.log("Logging out:");
    localStorage.removeItem('uid');
    localStorage.removeItem("DashParam");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    $state.go("home", {}, {reload: true});
});