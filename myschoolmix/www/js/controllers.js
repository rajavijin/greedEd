angular.module('starter.controllers', ['starter.services'])

.constant("myConfig", 
  {
    //"base": "http://192.168.1.2", 
    //"server":"http://192.168.1.2:9000",
    "base": "http://localhost", 
    "server":"http://localhost:9000",
    "hmMenu": {"Links":[{"title":"Dashboard", "href":"app/hmdashboard", "class":"ion-stats-bars"}, {"title":"Classes", "href":"app/allclasses", "class": "ion-easel"}, {"title":"Students", "href":"app/allstudents", "class": "ion-person-stalker"},{"title":"Teachers", "href":"app/allteachers", "class": "ion-ios-body"},{"title":"Wall","href":"app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]},
    "parentMenu": {"Links":[{"title":"Children", "href":"app/allstudents", "class": "ion-person-stalker"},{"title":"Wall","href":"app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]},
    "parentSingleMenu": {"Links":[{"title":"Dashboard", "href":"app/studentdashboard", "class":"ion-stats-bars"},{"title":"Profile", "href":"app/studentprofile", "class": "ion-person"},{"title":"Overall Dashboard", "href":"app/studentoveralldashboard", "class":"ion-ios-pulse-strong"},{"title":"Wall","href":"app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]},
    "teacherMenu": {"Links":[{"title":"Dashboard", "href":"app/teacherdashboard", "class":"ion-stats-bars"},{"title":"Classes Profile", "href":"app/classprofile", "class": "ion-person"},{"title":"Profile", "href":"app/teacherprofile", "class": "ion-person"},{"title":"Wall","href":"app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]},
    "classTeacherMenu": {"Links":[{"title":"Class Dashboard", "href":"app/dashboard", "class":"ion-stats-bars"},{"title":"Teacher Dashboard", "href":"app/teacherdashboard", "class":"ion-stats-bars"}, {"title":"Students", "href":"app/allstudents", "class": "ion-person-stalker"},{"title":"Class Profile", "href":"app/classprofile", "class": "ion-person"},{"title":"Profile", "href":"app/teacherprofile", "class": "ion-person"},{"title":"Wall","href":"app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]},
  })
//.constant("myConfig", {"base": "http://52.25.97.15", "server":"http://52.25.97.15"})
.constant("colors", {"red":"#ff6c60"})
.controller('AppCtrl', function($scope, $stateParams, $cordovaSQLite, $rootScope, $state, $window, MyService, myConfig) {
  user = JSON.parse(localStorage.getItem('user')) || user;
  $scope.username = user.name;
  $scope.uid = localStorage.getItem('uid') || '';
  if($scope.uid) {
    $scope.authorized = true;
    if(user.role == "hm") {
      $scope.menuLinks = myConfig.hmMenu;
    } else if (user.role == "parent") {
      console.log("students", user);
      if(user.students.length > 1) {
        $scope.menuLinks = myConfig.parentMenu;
      } else {
        $scope.menuLinks = myConfig.parentSingleMenu;
      }
    } else {
      if(user.standard) {
        $scope.menuLinks = myConfig.classTeacherMenu;
      } else {
        $scope.menuLinks = myConfig.teacherMenu;
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
.controller('HmDashboardCtrl', function($scope, $rootScope, $state, _, $cordovaSQLite, $ionicLoading, $ionicLoading, MyService, colors, $stateParams) {
  var allsubjects = subjectDataPass = subjectDataFail = [];
  var pass = fail = 0;   
  var gradeData = toppers = {};  
  var resetData = function() {
    allsubjects = [];
    subjectDataPass = []
    subjectDataFail = [];
    pass = 0;
    fail = 0;   
    gradeData = {};
    toppers = {};
  }

  $rootScope.hmfilterResults = function(page) {
    filtersData = $rootScope.filtersData;
    $scope.getMarksData();
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
  }
  $scope.getMarksData = function() {
    resetData();
    var params = filtersData;
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    params.studentid = "all";
    console.log("params", params);
    var dbkey = params.schoolid;
    if(!params.typeofexam || (params.typeofexam == 0)) {
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
          for (var i = 0; i < studentMarks.length; i++) {
            processMarksVal(studentMarks[i], i, "online");
          }
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
          var allmarks = JSON.parse(res.rows.item(0).value);
          console.log("allmarks", allmarks);
          for (var i = 0; i < allmarks.length; i++) {
            processMarksVal(allmarks[i], i, "online");
          }
          applyMarks();
        } else {$scope.dashboardStatus = "empty";}
      }, function(err) {

      }).finally(function() {$scope.$broadcast('scroll.refreshComplete'); $ionicLoading.hide();});
    }
  }
  var processMarksVal = function(v, k, status) {
    if(v.status == "Pass") pass++;
    if(v.status == "Fail") fail++;
    for (var i = 0; i < v.marks.length; i++) {
      if(allsubjects.indexOf(v.marks[i].subject) == -1) {
        allsubjects.push(v.marks[i].subject);
      }
      subjectDataPass[v.marks[i].subject] = (subjectDataPass[v.marks[i].subject]) ? subjectDataPass[v.marks[i].subject] : 0;
      subjectDataFail[v.marks[i].subject] = (subjectDataFail[v.marks[i].subject]) ? subjectDataFail[v.marks[i].subject] : 0;   
      if(v.marks[i].mark >= user.passmark) {
        subjectDataPass[v.marks[i].subject]++;
      } else {
        subjectDataFail[v.marks[i].subject]++;
      }
    };
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
    var toppersList = [];
    var gradeVal = [];
    var passvals = []
    var failvals = [];
    for(var topv in toppers) {
      toppersList.push(toppers[topv]);
    }
    for(var gk in gradeData) {
      if(gradeData[gk].name == "Grade F") {
        if(gradeVal.length > 1) {
          localStorage.setItem("gradeVal", JSON.stringify(gradeVal[1]));
          gradeVal[1] = gradeData[gk];
          gradeVal.push(JSON.parse(localStorage.getItem("gradeVal")));
        } else {
          gradeVal.push(gradeData[gk]);
        }
      } else {
        gradeVal.push(gradeData[gk]);
      }
    }
    console.log("gradeVal", gradeVal);
    for (var i = 0; i < allsubjects.length; i++) {
      passvals.push(subjectDataPass[allsubjects[i]]);
      failvals.push(subjectDataFail[allsubjects[i]]);
    };
    $scope.toppers = toppersList;
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
  var allsubjects = subjectDataPass = subjectDataFail = toppers = subjectDataMarks = topperSubjects = [];
  var pass = fail = 0;   
  var gradeData = {};
  var resetData = function() {
    pass = 0;
    fail = 0;
    subjectDataPass = [];
    subjectDataFail = [];
    allsubjects = [];
    subjectDataMarks = [];       
    toppers = [];
    topperSubjects = [];
    gradeData = {};
  }
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $rootScope.filterResults = function(page) {
    console.log("filter is called");
    filtersData = $rootScope.filtersData;
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $scope.getMarksData();
  }
  $scope.getMarksData = function() {
    resetData();
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
      $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
      MyService.getMarks(params).then(function(studentMarks) {
        totalrecords = studentMarks.length;
        console.log("Got marks:", totalrecords);
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          for (var i = 0; i < studentMarks.length; i++) {
            processMarksVal(studentMarks[i], i, "online");
          }
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
          var allmarks = JSON.parse(res.rows.item(0).value);
          console.log("allmarks", allmarks);
          for (var i = 0; i < allmarks.length; i++) {
            processMarksVal(allmarks[i], i, "online");
          }
          applyMarks();
        } else {$scope.dashboardStatus = "empty";}
      }, function(err) {

      }).finally(function() {$scope.$broadcast('scroll.refreshComplete'); $ionicLoading.hide();});
    }
  }
  var processMarksVal = function(v, k, status) {
    if(v.status == "Pass") pass++;
    if(v.status == "Fail") fail++;
    for (var i = 0; i < v.marks.length; i++) {
      if(allsubjects.indexOf(v.marks[i].subject) == -1) {
        allsubjects.push(v.marks[i].subject);
      }
      subjectDataPass[v.marks[i].subject] = (subjectDataPass[v.marks[i].subject]) ? subjectDataPass[v.marks[i].subject] : 0;
      subjectDataFail[v.marks[i].subject] = (subjectDataFail[v.marks[i].subject]) ? subjectDataFail[v.marks[i].subject] : 0;   
      if(v.marks[i].mark >= user.passmark) {
        subjectDataPass[v.marks[i].subject]++;
      } else {
        subjectDataFail[v.marks[i].subject]++;
      }
      if(subjectDataMarks[v.marks[i].subject]) {
        subjectDataMarks[v.marks[i].subject] = parseInt(v.marks[i].mark) + subjectDataMarks[v.marks[i].subject];
      } else {
        subjectDataMarks[v.marks[i].subject] = parseInt(v.marks[i].mark);
      }
      if(topperSubjects[v.marks[i].subject]) {
        if(parseInt(v.marks[i].mark) > topperSubjects[v.marks[i].subject].y) {
          topperSubjects[v.marks[i].subject] = {y: v.marks[i].mark, name: v.student};              
        } else if (parseInt(v.marks[i].mark) == topperSubjects[v.marks[i].subject].y) {
          topperSubjects[v.marks[i].subject].name = topperSubjects[v.marks[i].subject].name + "," + v.student;
        }
      } else {
        topperSubjects[v.marks[i].subject] = {y: v.marks[i].mark, name:v.student};              
      }
    };
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
    var gradeVal = [];
    var passvals = [];
    var failvals = [];
    var topperS = [];
    var toppersList = [];
    for(var topv in toppers) {
      toppersList.push(toppers[topv]);
    }
    for(var gk in gradeData) {
      if(gradeData[gk].name == "Grade F") {
        if(gradeVal.length > 1) {
          localStorage.setItem("gradeVal", JSON.stringify(gradeVal[1]));
          gradeVal[1] = gradeData[gk];
          gradeVal.push(JSON.parse(localStorage.getItem("gradeVal")));
        } else {
          gradeVal.push(gradeData[gk]);
        }
      } else {
        gradeVal.push(gradeData[gk]);
      }
    }
    for (var i = 0; i < allsubjects.length; i++) {
      passvals.push(subjectDataPass[allsubjects[i]]);
      failvals.push(subjectDataFail[allsubjects[i]]);
      if(topperSubjects[allsubjects[i]]) {
        topperS.push(topperSubjects[allsubjects[i]]);
      } else {
        topperS.push({y:0, name: allsubjects[i]});
      }
    };
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
    $scope.topperSubjectsConfig = {
      chart: {renderTo: 'toppersubjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subject Toppers"},tooltip:{pointFormat:''},plotOptions: {column: {depth: 25,showInLegend: false,dataLabels: {enabled: true,format: '{point.y}'}}},
      xAxis: {categories: allsubjects},
      yAxis: {title: {text: null}},
      series: [{name: 'Subject Topper',data: topperS}]
    };    
    $scope.toppers = toppersList;
    console.log("S Toppers", topperS);
  }
})
.controller('TeacherDashboardCtrl', function($scope, $rootScope, $state, $cordovaSQLite, $ionicLoading, MyService, $stateParams) {
  var allsubjects = subjectDataPass = subjectDataFail = toppers = subjectDataMarks = topperSubjects = [];
  var pass = fail = 0;   
  var gradeData = {};
  var resetData = function() {
    pass = 0;
    fail = 0;
    subjectDataPass = [];
    subjectDataFail = [];
    allsubjects = [];
    subjectDataMarks = [];       
    toppers = [];
    topperSubjects = [];
    gradeData = {};
  }
  var title = user.name;
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $rootScope.teacherFilterResults = function(page) {
    console.log("filter is called");
    filtersData = $rootScope.filtersData;
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $scope.getMarksData();
  }
  $scope.getMarksData = function() {
    resetData();
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
          for (var i = 0; i < studentMarks.length; i++) {
            processMarksVal(studentMarks[i], i, "online");
          }
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
          for (var i = 0; i < allmarks.length; i++) {
            processMarksVal(allmarks[i], i, "online");
          }
          applyMarks();
        } else {$scope.dashboardStatus = "empty";}
      }, function(err) {

      }).finally(function() {$scope.$broadcast('scroll.refreshComplete'); $ionicLoading.hide();});
    }
  }
  var processMarksVal = function(v, k, status) {
    if(v.status == "Pass") pass++;
    if(v.status == "Fail") fail++;
    var key = v.standard+v.division;
    for (var i = 0; i < v.marks.length; i++) {
      if(v.marks[i].teacher == title) {
        key += ':'+v.marks[i].subject;
      if(allsubjects.indexOf(key) == -1) {
        allsubjects.push(key);
      }
      subjectDataPass[key] = (subjectDataPass[key]) ? subjectDataPass[key] : 0;
      subjectDataFail[key] = (subjectDataFail[key]) ? subjectDataFail[key] : 0;   
      if(v.marks[i].mark >= user.passmark) {
        subjectDataPass[key]++;
      } else {
        subjectDataFail[key]++;
      }
      if(subjectDataMarks[key]) {
        subjectDataMarks[key] = parseInt(v.marks[i].mark) + subjectDataMarks[key];
      } else {
        subjectDataMarks[key] = parseInt(v.marks[i].mark);
      }
      if(topperSubjects[key]) {
        if(parseInt(v.marks[i].mark) > topperSubjects[key].y) {
          topperSubjects[key] = {y: v.marks[i].mark, name: v.student};              
        } else if (parseInt(v.marks[i].mark) == topperSubjects[key].y) {
          topperSubjects[key].name = topperSubjects[key].name + "," + v.student;
        }
      } else {
        topperSubjects[key] = {y: v.marks[i].mark, name:v.student};              
      }
      }
    };
/*    v.marks.forEach(function(mv, mk) {
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
    })*/
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
    var gradeVal = [];
    var passvals = [];
    var failvals = [];
    var topperS = [];
    var toppersList = [];
    for(var topv in toppers) {
      toppersList.push(toppers[topv]);
    }
    for(var gk in gradeData) {
      if(gradeData[gk].name == "Grade F") {
        if(gradeVal.length > 1) {
          localStorage.setItem("gradeVal", JSON.stringify(gradeVal[1]));
          gradeVal[1] = gradeData[gk];
          gradeVal.push(JSON.parse(localStorage.getItem("gradeVal")));
        } else {
          gradeVal.push(gradeData[gk]);
        }
      } else {
        gradeVal.push(gradeData[gk]);
      }
    }
    for (var i = 0; i < allsubjects.length; i++) {
      passvals.push(subjectDataPass[allsubjects[i]]);
      failvals.push(subjectDataFail[allsubjects[i]]);
      if(topperSubjects[allsubjects[i]]) {
        topperS.push(topperSubjects[allsubjects[i]]);
      } else {
        topperS.push({y:0, name: allsubjects[i]});
      }
    };
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
    $scope.topperSubjectsConfig = {
      chart: {renderTo: 'toppersubjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subject Toppers"},tooltip:{pointFormat:''},plotOptions: {column: {depth: 25,showInLegend: false,dataLabels: {enabled: true,format: '{point.y}'}}},
      xAxis: {categories: allsubjects},
      yAxis: {title: {text: null}},
      series: [{name: 'Subject Topper',data: topperS}]
    };
    $scope.toppers = toppersList;
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
      $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
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
      }).finally(function() {$ionicLoading.hide();});
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
      title = (title == "all/all") ? "All Students" : title + ' Students';
    }
    console.log("Users Param", params);
    $scope.title = title;
    if(MyService.online()) {
      $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
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
      }).finally(function() {$ionicLoading.hide();});
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
      title = (title == "all/all") ? "All Teachers" : title + ' Teachers';
    }
    console.log("Users Param", params);
    $scope.title = title;
    if(MyService.online()) {
      $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
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
      }).finally(function(){$ionicLoading.hide();});
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
  var subjectMarks = [];
  var subjectLabels = [];
  var title = '';
  var filtersData = JSON.parse(localStorage.getItem('filtersData')) || {};
  $rootScope.filtersData = filtersData;
  $rootScope.studentFilterResults = function(page) {
    filtersData = $rootScope.filtersData;
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $scope.getMarksData();
  }
  $scope.user = user;
  $scope.getMarksData = function() {
    console.log("user", user);
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
      title =  sdash[1];
    }
    $scope.single = false;
    if(user.role == 'parent') {
      if(user.students.length == 1) {
        params.studentid = user.students[0].id;
        title = user.students[0].name;
        $scope.single = true;
      }
    }
    $scope.studentid = params.studentid;
    console.log("params", params);
    var dbkey = params.schoolid;
    if(params.typeofexam) {
      dbkey += '_'+params.year+'_'+params.typeofexams[params.typeofexam]+params.studentid;
      if(params.typeofexam % 1 === 0) {
        title += " "+params.typeofexams[params.typeofexam];
      } else {
        title += " "+params.typeofexam;
      }
    }
    $scope.title = title;
    if(MyService.online()) {
      MyService.getMarks(params).then(function(studentMarks) {
        totalrecords = studentMarks.length;
        console.log("Got marks:", totalrecords);
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          subjectMarks = [];
          subjectLabels = [];
          for (var i = 0; i < studentMarks.length; i++) {
            processMarksVal(studentMarks[i], i, "online");
          } 
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
          for (var i = 0; i < allmarks.length; i++) {
            processMarksVal(allmarks[i], i, "online");
          };
        } else {$scope.dashboardStatus = "empty";}
      }, function(err) {

      }).finally(function() {$scope.$broadcast('scroll.refreshComplete'); $ionicLoading.hide();});
    }
  }
  var processMarksVal = function(v, k, status) {
    for (var i = 0; i < v.marks.length; i++) {
      subjectLabels.push(v.marks[i].subject);
      subjectMarks.push(v.marks[i].mark);
    };
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
})
.controller('StudentOverallDashboardCtrl', function($scope, $rootScope, $stateParams, $cordovaSQLite, $ionicLoading, MyService) {
  var examLabels = examMarks = examGrades = allsubjects = attendance = ranks = allMarks = [];
  var subjectDataMarks = {};
  var student = '';
  var pass = fail = 0;
  var resetData = function() {
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
  }
  $rootScope.noexams = true;
  $rootScope.overallFilterResults = function(page) {
    console.log("Filtersdata", $rootScope.filtersData);
    filtersData = $rootScope.filtersData;
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $scope.getMarksData();
  }
  $scope.getMarksData = function() {
    resetData();
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
    } else {
      params.studentid = user._id;
    }    
    if(!params.studentid) {
      params.studentid = "all";
    }
    params.typeofexam = 0;
    console.log("params", params);
    if(MyService.online()) {
      MyService.getMarks(params).then(function(studentMarks) {
        totalrecords = studentMarks.length;
        console.log("Got marks:", totalrecords);
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          for (var i = 0; i < studentMarks.length; i++) {
            processMarksVal(studentMarks[i], i, "online");
          };
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
          for (var i = 0; i < allmarks.length; i++) {
            processMarksVal(allmarks[i], i, "online");
          };
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
    for (var i = 0; i < v.marks.length; i++) {
      if(allsubjects.indexOf(v.marks[i].subject) == -1) {
        allsubjects.push(v.marks[i].subject);
      }
      if(!subjectDataMarks[v.marks[i].subject])
        subjectDataMarks[v.marks[i].subject] = [];
      subjectDataMarks[v.marks[i].subject].push({name: v.marks[i].subject, y:parseInt(v.marks[i].mark)});
    };
    student = v.student;
  }
  var applyMarks = function() {
    var allsubjectData = [];
    for (var i = 0; i < allsubjects.length; i++) {
      allsubjectData.push({name: allsubjects[i], data: subjectDataMarks[allsubjects[i]]});
    };
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
    $scope.loading = true;
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
      $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
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
      }).finally(function(){$ionicLoading.hide();$scope.loading = false;});
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
      $scope.loading = true;
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
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
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
        }).finally(function(){$ionicLoading.hide();$scope.loading = false;});
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
    $scope.loading = true;
    var dbkey = user.schoolid;
    var params = {};
    var title = '';
    params.schoolid = user.schoolid;
    var classteacher = true;
    if(user.standard) {
      params.standard = user.standard;
      params.division = user.division;
      title = params.standard + '/'+params.division +' Profile';
    } else if ($stateParams.standard) {
      params.standard = $stateParams.standard;
      params.division = $stateParams.division;
      title = params.standard + '/'+params.division +' Profile';
    } else {
      params.standard = params.division = 'all';
      title = user.name+' Students Profile';
      classteacher = false;
    }
    params.sex = params.status = 'all';
    $scope.title = title;
    $scope.classteacher = classteacher;
    $scope.standard = params.standard;
    $scope.division = params.division;
    $scope.school = user.school;
    dbkey += '_'+params.standard+'_'+params.division+'_profile';
    if(MyService.online()) {
      $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
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
      }).finally(function(){$ionicLoading.hide(); $scope.loading = false;});
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
.controller('WallCtrl', function($scope, $state, $ionicModal, $ionicLoading, MyService, myConfig) {
  if(user.role == 'parent') {
    $scope.add = false;
  } else {
    $scope.add = true;
  }
  $scope.addpost = function() {
    $state.go('app.addpost', {});
  }
  $scope.getWall = function() {
    $scope.title = "Wall";
    $scope.base = myConfig.server;
    if(MyService.online()) {
      $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
      var params = {};
      params.to = "all";
      if(user.role == "hm") {
        params.to = "hm";
      }
      else if(user.role == "teacher") {
        for (var s = 0; s < user.subjects.length; s++) {
          params.to += ","+user.subjects[s].class;
        };  
      } else if (user.role == "parent") {
        for (var ss = 0; ss < user.students.length; ss++) {
          params.to += ","+user.students[ss].class;
        }
      }
      params.schoolid = user.schoolid;
      MyService.getWall(params).then(function(wall) {
        if(wall) {
          angular.forEach(wall, function(w, wk) {
            console.log("wk", wk);
            console.log("likeuids", w.likeuids);
            console.log("likeuids length", w.likeuids.length);
            wall[wk].liked = false;
            if(wall[wk].likecount == 1) {
              wall[wk].likecountVal = "Like";
            } else {
              wall[wk].likecountVal = "Likes";
            }
            if(w.likeuids.length > 0) {
              for (var i = 0; i < w.likeuids.length; i++) {
                if(wall[wk].likeuids[i]._id == user._id) {
                  wall[wk].liked = true;
                }
              };
            }
            console.log("wall", wall);
            if(wk == wall.length - 1) $scope.walls = wall;
          })
        }
      }).finally(function() {$scope.$broadcast('scroll.refreshComplete'); $ionicLoading.hide();})
    } else {

    }
  }
  $ionicModal.fromTemplateUrl('templates/image-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.openModal = function() {
    $scope.modal.show();
  };

  $scope.closeModal = function() {
    $scope.modal.hide();
  };

  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
  // Execute action on hide modal
  $scope.$on('modal.hide', function() {
    // Execute action
  });
  // Execute action on remove modal
  $scope.$on('modal.removed', function() {
    // Execute action
  });
  $scope.$on('modal.shown', function() {
    console.log('Modal is shown!');
  });

  $scope.showImage = function(index) {
    $scope.imageSrc = index;
    $scope.openModal();
  }
  $scope.like = function(index, id, action) {
    if(MyService.online()) {
      var walldata = {};
      walldata.like = (action == "like") ? 1 : -1;
      walldata.likeuid = {_id:user._id, name:user.name};
      walldata._id = id;
      MyService.updateWall(walldata).then(function(wall) {
        console.log("Liked/Disliked", wall);
        if(wall) {
          wall.liked = (action == "like") ? true : false;
          if(wall.likecount == 1) {
            wall.likecountVal = "Like";
          } else {
            wall.likecountVal = "Likes";
          }
          $scope.walls[index] = wall; 
        }
      });
    }
  }
})
.controller('AddPostCtrl', function($scope, $state, $cordovaCamera, $cordovaFileTransfer, $ionicLoading, MyService, myConfig) {
  console.log("Add Post");
  $scope.post = {};
  $scope.recievers = {};
  $scope.pictures = [];
  $scope.classes = user.subjects;
  $scope.role = user.role;
  $scope.recieverToggle = true;
  $scope.toggleClasses = function(status) {
    for (var i = 0; i < user.subjects.length; i++) {
      $scope.recievers[user.subjects[i].class] = status;
    };
  }
    $scope.takePicture = function() {
     var options = {
      quality: 50,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.CAMERA,
      allowEdit: false,
      encodingType: Camera.EncodingType.JPEG,
      targetWidth: 320,
      targetHeight: 240,
      popoverOptions: CameraPopoverOptions,
      saveToPhotoAlbum: false
    };
    $cordovaCamera.getPicture(options).then(
    function(imageURI) {
      $scope.pictures.push("data:image/jpeg;base64," + imageURI);
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
      $scope.pictures.push(imageURI);
      $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-calm">Success</ion-spinner>', duration:500});
    },
    function(err){
      $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-calm">Error</ion-spinner>', duration:500});
    })
  };

  $scope.submit = function() {
    if(MyService.online()) {
      var params = $scope.post;
      params.userid = user._id;
      params.user = user.name;
      params.schoolid = user.schoolid;
      params.to = [];
      params.date = Date.now();
      if(user.role == 'hm') {
        params.to.push("all");
      } else {
        var allrecievers = $scope.recievers;
        for (var reciever in allrecievers) {
          if(allrecievers[reciever]) {
            console.log("rec", reciever);
            params.to.push(reciever);
          }
        }
      }
      var options = {
        fileKey: "file",
        fileName: user._id +'_'+ params.date + ".jpg",
        chunkedMode: false,
        mimeType: "image/jpeg",
      };
      params.pictures = [];
      var pictures = $scope.pictures;
      console.log("params", params);
      if(pictures.length > 0) {
        for (var i = 0; i < pictures.length; i++) {
          $cordovaFileTransfer.upload(myConfig.server+"/api/wall/upload", pictures[i], options).then(function (result) {
            console.log("i", i);
            console.log("total", pictures.length);
            console.log("SUCCESS: " + JSON.stringify(result.response));
            console.log("SUCCESS: " + result.response);
            params.pictures.push(result.response.replace(/"/g, ''));
            if(i == pictures.length) {
              console.log("creating wall");
              MyService.createWall(params).then(function(wall) {
                console.log('Wall', wall);
                if(wall) {
                  $state.go("app.wall", {}, {reload:true});
                }
              })
            }
          }, function (err) {
              console.log("ERROR: " + JSON.stringify(err));
          }, function (progress) {
            console.log("PROGRESS: "+JSON.stringify(progress));
              // constant progress updates
          });
        };
      } else {
        MyService.createWall(params).then(function(wall) {
          console.log('Wall', wall);
          if(wall) {
            $state.go("app.wall", {}, {reload:true});
          }
        });
      }
    }
  }

})
.controller('LoginCtrl', function($scope, $rootScope, $http, $state, $ionicPopup, $ionicHistory, $ionicLoading, MyService, myConfig) {
  $scope.uid = localStorage.getItem('uid') || '';
  user = (localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')) : {};
  if($scope.uid) {
    if(user.role == "hm") {
      $scope.menuLinks = myConfig.hmMenu;
      $state.go('app.hmdashboard', {}, {reload: true});
    } else if (user.role == "parent") {
      if(user.students.length > 1) {
        $scope.menuLinks = myConfig.parentMenu;
        $state.go('app.allstudents', {}, {reload: true});
      } else {
        $scope.menuLinks = myConfig.parentSingleMenu;
        $state.go('app.studentDashboard', {}, {reload: true});
      }
    } else {
      if(user.standard) {
        $scope.menuLinks = myConfig.classTeacherMenu;
        $state.go('app.dashboard', {}, {reload: true});
      } else {
        $scope.menuLinks = myConfig.teacherMenu;                            
        $state.go('app.teacherdashboard', {}, {reload: true});
      }
    }
  }
  //teacher single
  $scope.user = {
    email: '8787876464',
    password: 'c7rjm7vi'
  }
  //teacher
   $scope.user = {
    email: '8978341219',
    password: 'l9yx8ncdi'
  };
  //hm
  $scope.user = {
    email: "8951572125",
    password: 'ZBqSp0lN/9hPkS123qkyHw=='
  };
  //parent with multiple student
  $scope.user = {
    email: '9944046100',
    password: 'hsqddkj4i'
  };
  //parent with single student
  $scope.user = {
    email: '8879900341',
    password: '1l8zolxr'
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