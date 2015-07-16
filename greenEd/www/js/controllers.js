angular.module('starter.controllers', ['starter.services','monospaced.elastic', 'angularMoment'])

.constant("myConfig", 
  {
    "base": "http://localhost", 
    "server":"http://localhost:8100",
/*    "base": "http://52.27.236.42", 
    "server":"http://52.27.236.42",*/
 })
//.constant("myConfig", {"base": "http://52.25.97.15", "server":"http://52.25.97.15"})
.controller('AppCtrl', function($scope, $rootScope, $state, $window, $ionicAnalytics, MyService) {
  user = JSON.parse(localStorage.getItem('user')) || user;
  $scope.username = user.name;
  $scope.uid = localStorage.getItem('uid') || '';
  if($scope.uid) {
    $scope.authorized = true;
    $scope.menuLinks = MyService.getMenus();   
  } else {
    $scope.authorized = false;
    $scope.menuLinks = {"Links":[{}]};
  }
  if(localStorage.getItem('filterdata')) {
    filtersData = JSON.parse(localStorage.getItem('filterdata'));
  } else {
    filtersData.years = user.years;
    filtersData.educationyear = user.years.indexOf(user.educationyear);
    if(user.typeofexams.length > 0) {
      user.typeofexams.unshift("All");
      filtersData.typeofexams = user.typeofexams;
      filtersData.typeofexam = user.typeofexams.indexOf(user.latesttypeofexam);
    }
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
  }
  $rootScope.filtersData = filtersData;
  var filterStatus = function(page) {
    $rootScope.noexams = false;
    if((page.indexOf('ashboard') > 0) && (filtersData.years.length > 0)) {
      $rootScope.filters = true;
      console.log("page", page);
      if(filtersData.typeofexams) {
        if(page.indexOf('studentdashboard') >= 0) {
          filtersData.typeofexams[0] = "NoAll";
          if(filtersData.typeofexam == 0) filtersData.typeofexam = user.typeofexams.indexOf(user.latesttypeofexam);
        } else {
          filtersData.typeofexams[0] = "All";
        }
        localStorage.setItem('filtersData', JSON.stringify(filtersData));
        $rootScope.filtersData = filtersData;
      }
      $rootScope.page = page;
    } else {
      $rootScope.filters = false;
    }     
  } 
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){ 
    $ionicAnalytics.track('pages', {page:toState.name, url:toState.url});
    if(fromState.name == 'logout') {
      $window.location.reload(true);
    } 
    if(toState.name == 'logout') {
      localStorage.removeItem('uid');
      localStorage.removeItem("DashParam");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      $state.go("home", {}, {reload: true});      
    }
    filterStatus(toState.url.split("/")[1]);
  })
  filterStatus($state.current.url.split("/")[1]);
  $rootScope.$on('$cordovaPush:tokenReceived', function(event, data) {
    console.log('Ionic Push: Got token ', data.token, data.platform);
    localStorage.setItem("devicetoken", data.token);
    if(MyService.online()) {
      var tparams = {schoolid: user.schoolid, tokens:data.token, uid:user._id, role:user.role, platform:data.platform};
      tparams.class = [];  
      if(user.role == "parent") {
        tparams.uids = [];
        for (var i = 0; i < user.students.length; i++) {
          tparams.uids.push(user.students[i].id);
          tparams.class.push(user.students[i].class);
        };
      } else if (user.role == "teacher") {
        for (var i = 0; i < user.subjects.length; i++) {
          tparams.class.push(user.subjects[i].class);
        }
      } else {
        tparams.class.push("all");
      }
      MyService.saveToken(tparams).then(function(stored) {
        console.log("Stored token", stored);
      }, function(err) {
        console.log("Storing token failed", err);
      });
    }
  });
  
})
.controller('HmDashboardCtrl', function($scope, $rootScope, $state, $cordovaSQLite, $ionicLoading, $ionicLoading, MyService, $stateParams) {
  var allsubjects = subjectDataPass = subjectDataFail = [];
  var pass = fail = 0;   
  var gradeData = toppers = params = {};  
  var resetData = function() {
    allsubjects = [];
    subjectDataPass = []
    subjectDataFail = [];
    pass = 0;
    fail = 0;   
    gradeData = {};
    toppers = {};
  }

  $rootScope.hmdashboardfilters = function() {
    filtersData = $rootScope.filtersData;
    $scope.getMarksData();
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
  }
  $scope.getMarksData = function() {
    resetData();
    params = filtersData;
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
          /*var query = "INSERT into marks (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from marks where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            console.log("record count", sres.rows.length);
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(studentMarks)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })*/
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
      if(v.marks[i].mark >= v.marks[i].passmark) {
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
      passvals.push({name:"Pass", y: subjectDataPass[allsubjects[i]]});
      failvals.push({name:"Fail", y: subjectDataFail[allsubjects[i]]});
    };
    $scope.toppers = toppersList;
    $scope.passfailConfig = {
      chart: {renderTo: 'passfailstatus',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      title: {text:"Pass/Fail"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.studentsfiltered", {year:params.year,typeofexam:params.typeofexam,standard:"all",division:"all",status:event.point.name,subject:"all"});}}},pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [{name:"Pass", y:pass},{name:"Fail", y:fail}]}]
    };
    $scope.subjectsConfig = {
      chart: {renderTo: 'subjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subjects Pass/Fail"},tooltip:{pointFormat:'<span style="color:{point.color}">\u25CF</span> {point.category}: <b>{point.y}</b>'},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.studentsfiltered", {year:params.year,typeofexam:params.typeofexam,standard:"all",division:"all",status:event.point.name,subject:event.point.category});}}},column: {depth: 25,dataLabels: {enabled: true,format: '{point.y}'}}},
      xAxis: {categories: allsubjects},
      yAxis: {title: {text: null}},
      series: [{name: 'Pass',data: passvals},{name: 'Fail',data: failvals}]
    }; 
    $scope.gradeConfig = {
      chart: {renderTo: 'grades',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
      title: {text:"Grades"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.studentsfiltered", {year:params.year,typeofexam:params.typeofexam,standard:"all",division:"all",status:"all",subject:"all",grade:event.point.name});}}},pie: {innerSize: 0,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: gradeVal}]
    };
  }
})
.controller('DashboardCtrl', function($scope, $rootScope, $state, $cordovaSQLite, $ionicLoading, MyService, $stateParams) {
  var allsubjects = subjectDataPass = subjectDataFail = toppers = subjectDataMarks = topperSubjects = [];
  var pass = fail = 0;   
  var gradeData = params = {};
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
  $rootScope.dashboardfilters = function() {
    console.log("filter is called");
    filtersData = $rootScope.filtersData;
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $scope.getMarksData();
  }
  $scope.cache = true;
  $scope.getMarksData = function() {
    $scope.access = true;
    resetData();
    $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
    params = filtersData;
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    params.studentid = params.standard = params.division = "all";
    if($stateParams.standard) {
      params.standard = $stateParams.standard;
      params.division = $stateParams.division;
    } else {
      if(user.standard) {
        params.standard = user.standard;
        params.division = (user.division) ? user.division : "all";
      } else if (user.role == "parent") {
        if(user.students.length == 1) {
          var pclass = user.students[0].class.split("-");
          params.standard = pclass[0];
          params.division = pclass[1];
        }
        $scope.access = false;
      }
    }
    $scope.standard = params.standard;
    $scope.division = params.division;
      console.log("in", 0);
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
          /*var query = "INSERT into marks (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from marks where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            console.log("record count", sres.rows.length);
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(studentMarks)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })*/
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
      if(v.marks[i].mark >= v.marks[i].passmark) {
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
      passvals.push({name:"Pass", y: subjectDataPass[allsubjects[i]]});
      failvals.push({name:"Fail", y: subjectDataFail[allsubjects[i]]});
      if(topperSubjects[allsubjects[i]]) {
        topperS.push(topperSubjects[allsubjects[i]]);
      } else {
        topperS.push({y:0, name: allsubjects[i]});
      }
    };
    $scope.tpassfailConfig = {
      chart: {renderTo: 'tpassfailstatus',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      title: {text:"Pass/Fail"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.studentsfiltered", {year:params.year,typeofexam:params.typeofexam,standard:params.standard,division:params.division,status:event.point.name,subject:"all"});}}},pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [["Pass", pass],["Fail", fail]]}]
    };
    $scope.tgradeConfig = {
      chart: {renderTo: 'tgrades',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
      title: {text:"Grades"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.studentsfiltered", {year:params.year,typeofexam:params.typeofexam,standard:params.standard,division:params.division,status:"all",subject:"all",grade:event.point.name});}}},pie: {innerSize: 0,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: gradeVal}]
    };
    $scope.tsubjectsConfig = {
      chart: {renderTo: 'tsubjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subjects Pass/Fail"},tooltip:{pointFormat:'<span style="color:{point.color}">\u25CF</span> {point.category}: <b>{point.y}</b>'},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.studentsfiltered", {year:params.year,typeofexam:params.typeofexam,standard:params.standard,division:params.division,status:event.point.name,subject:event.point.category});}}},column: {depth: 25,dataLabels: {enabled: true,format: '{point.y}'}}},
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
  var teacher = '';
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
  $rootScope.teacherdashboardfilters = function() {
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
    params.studentid = "all";
    params.standard = "teacher";
    params.division = ($stateParams.teacherid) ? $stateParams.teacherid : user.name; 
    $scope.username = params.division;
    $scope.title = $stateParams.teacher +" Dashboard";
    if(params.typeofexam) {
      var dbkey = params.schoolid +'_'+params.year+'_'+params.typeofexams[params.typeofexam]+'_'+params.standard+'_'+params.division;
      $scope.title = $stateParams.teacher+" "+params.typeofexams[params.typeofexam]+" Dashboard";
    }
    teacher = params.division;
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
          /*var query = "INSERT into marks (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from marks where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(studentMarks)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })*/
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
    var key = v.standard+'-'+v.division;
    for (var i = 0; i < v.marks.length; i++) {
      if(v.marks[i].teacher == teacher) {
        key += ':'+v.marks[i].subject;
      if(allsubjects.indexOf(key) == -1) {
        allsubjects.push(key);
      }
      subjectDataPass[key] = (subjectDataPass[key]) ? subjectDataPass[key] : 0;
      subjectDataFail[key] = (subjectDataFail[key]) ? subjectDataFail[key] : 0;   
      if(v.marks[i].mark >= v.marks[i].passmark) {
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
      passvals.push({name: "Pass", y:subjectDataPass[allsubjects[i]]});
      failvals.push({name: "Fail", y:subjectDataFail[allsubjects[i]]});
      if(topperSubjects[allsubjects[i]]) {
        topperS.push(topperSubjects[allsubjects[i]]);
      } else {
        topperS.push({y:0, name: allsubjects[i]});
      }
    };
    $scope.tpassfailConfig = {
      chart: {renderTo: 'tpassfailstatus',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      title: {text:"Pass/Fail"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.studentsfiltered", {year:params.year,typeofexam:params.typeofexam,standard:"teacher",division:teacher,status:event.point.name,subject:"all"});}}},pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [["Pass", pass],["Fail", fail]]}]
    };
    $scope.tgradeConfig = {
      chart: {renderTo: 'tgrades',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
      title: {text:"Grades"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.studentsfiltered", {year:params.year,typeofexam:params.typeofexam,standard:"teacher",division:teacher,status:"all",subject:"all",grade:event.point.name});}}},pie: {innerSize: 0,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: gradeVal}]
    };
    $scope.tsubjectsConfig = {
      chart: {renderTo: 'tsubjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subjects Pass/Fail"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){var cat = event.point.category.split(':'); var cla = cat[0].split("-");$state.go("app.studentsfiltered", {year:params.year,typeofexam:params.typeofexam,standard:cla[0],division:cla[1],status:event.point.name,subject:cat[1]});}}},column: {depth: 25,dataLabels: {enabled: true,format: '{point.y}'}}},
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
  $scope.filterToggle = function() {$scope.filterStatus = !$scope.filterStatus;}
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
        if(uv.division != "all")
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
.controller('AllStudentsCtrl', function($scope, $stateParams, $rootScope, $cordovaSQLite, MyService) {
  var title = '';
  $scope.currentuser = user;
  $scope.filtersData = filtersData;
  $scope.filterToggle = function() {$scope.filterStatus = !$scope.filterStatus;}
  $scope.getStudentsData = function() {
    var dbkey = user.schoolid;
    var params = {};
    params.schoolid = user.schoolid;
    params.sex = params.status = params.standard = params.division = "all";
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
    } else if (user.role == 'teacher') {
      params.standard = 'teacher';
      params.division = user.name;
      title = user.name + ' Students';
      dbkey += "teacher_"+params.division;
    } 
    if($stateParams.standard) {
      params.standard = $stateParams.standard;
      params.division = $stateParams.division;
      params._id = "all";
      if($stateParams.sex && $stateParams.sex != "all") {params.sex = $stateParams.sex; title += ' '+$stateParams.sex}
      if($stateParams.status && $stateParams.status != "all") {params.status = $stateParams.status; title += ' '+$stateParams.status}
    }
    title = params.standard+'/'+params.division + " Students";
    dbkey += "_"+params.standard+'_'+params.division+'_'+params.sex+'_'+params.status;
    title = (title == "all/all Students") ? "All Students" : title;
    console.log("Users Param", params);
    $scope.title = title;
    $scope.role = user.role;
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
.controller('StudentsFilteredCtrl', function($scope, $stateParams, $rootScope, $cordovaSQLite, MyService) {
  var title = '';
  $scope.currentuser = user;
  $scope.filtersData = filtersData;
  $scope.filterToggle = function() {$scope.filterStatus = !$scope.filterStatus;}
  $scope.getStudentsData = function() {
    var params = $stateParams;
    params.schoolid = user.schoolid;
    params.typeofexam = filtersData.typeofexams[params.typeofexam];
    params.mark = user.passmark;
    if(params.standard != "all") title = params.standard +'/'+params.division;
    title += " "+params.typeofexam;
    if(params.subject != "all") title += " "+params.subject;
    if(params.status != "all") title += " "+params.status;
    if(params.grade != "all") title += " "+params.grade;
    $scope.title = title;
    var dbkey = params.schoolid+"_"+params.year+"_"+params.typeofexam+"_"+params.standard+'_'+params.division+'_'+params.status+'_'+params.subject+'_'+params.grade;
    console.log("Params", params);
    if(MyService.online()) {
      MyService.listUsers(params).then(function(users) {
        if(users.length > 0) {
          console.log("Got all users:", users.length);
          console.log("Got all users:", users[0]);
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
.controller('AllTeachersCtrl', function($scope, $stateParams, $rootScope, $cordovaSQLite, MyService) {
  $scope.currentuser = user;
  $scope.filtersData = filtersData;
  $scope.filterToggle = function() {$scope.filterStatus = !$scope.filterStatus;}
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
  var subjectMarks = [];
  var subjectLabels = [];
  var title = '';
  var filtersData = JSON.parse(localStorage.getItem('filtersData')) || {};
  $rootScope.filtersData = filtersData;
  $scope.cache = true;
  $rootScope.studentdashboardfilters = function() {
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
    params.standard = "all";
    params.division = "all";
    $scope.single = false;
    $scope.noaccess = false;
    if($stateParams.studentid) {
      params.studentid = $stateParams.studentid;
      title = $stateParams.studentname;
    } else {
      params.studentid = user.students[0].id;
      title = user.students[0].name;
      $scope.single = true;
    }
    if(user.role == 'parent') {
      if(user.students.length > 1) $scope.noaccess = false;
      else $scope.noaccess = true;
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
    console.log("StateParams:", $stateParams);
    if(MyService.online()) {
      $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
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
          /*var query = "INSERT into marks (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from marks where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(studentMarks)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })*/
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
      series: [{name: 'Mark',data: subjectMarks}]
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
  $scope.cache = true;
  $rootScope.studentoveralldashboardfilters = function() {
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
    params.standard = "all";
    params.division = "all";
    if($stateParams.studentid) {
      params.studentid = $stateParams.studentid;
      title = $stateParams.studentname;
    } else {
      params.studentid = user.students[0].id;
      title = user.students[0].name;
    }
    params.typeofexam = 0;
    $scope.title = title;
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
          };
          applyMarks();
          /*var query = "INSERT into marks (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from marks where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(studentMarks)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })*/
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
      yAxis: {title: {text: null}},
      series: [{name: 'Total',data: allMarks}]
    };    
    $scope.sosubjectsConfig = {
      chart: {renderTo: 'sosubjects',type: 'spline', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subjects"},tooltip:{pointFormat:'{point.y}'},plotOptions: {spline: {depth: 25,dataLabels: {enabled: true,format: '{point.y}'}}},
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
  $scope.getStudentsData = function() {
    var id = ($stateParams.studentid) ? $stateParams.studentid : user.students[0].id;
    if(MyService.online()) {
      MyService.getProfile({_id: id}).then(function(userprofile) {
        console.log("Profile user", userprofile);
        $scope.user = userprofile;
        var query = "INSERT into users (key, value) VALUES (?, ?)";
        var selectq = 'SELECT key from users where key = "'+id+'"';
        $cordovaSQLite.execute(db, selectq).then(function(sres) {
          if(sres.rows.length == 0) {
            var values = [id, JSON.stringify(userprofile)];
            $cordovaSQLite.execute(db, query, values).then(function(res) {
              console.log("insertId: " + res.insertId);
            })
          }
        })
      });
    } else {
      var query = 'SELECT * from users where key = "'+id+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        var allusers = JSON.parse(res.rows.item(0).value);
        $scope.userprofile = allusers[0];
      }, function(err) {
        console.log("offline all users error", err);
      });
    }
  }
})
.controller('TeacherProfileCtrl', function($scope, $rootScope, $cordovaSQLite, $ionicLoading, MyService, $stateParams) {
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $scope.filtersData = filtersData;
  var teacherSubjects = function(user) {
    var allsubjects = [];
    var allclasses = [];
    for (var i = 0; i < user.subjects.length; i++) {
      if(allclasses.indexOf(user.subjects[i].class) == -1) {
        allclasses.push(user.subjects[i].class);
      }
      if(allsubjects.indexOf(user.subjects[i].subject) == -1) {
        allsubjects.push(user.subjects[i].subject);
      }
    }
    $scope.class = allclasses.join();
    $scope.subject = allsubjects.join();
  }
  $scope.getTeacherData = function() {
    if(user.role == 'teacher') {
      $scope.user = user;
      teacherSubjects(user);
    } else {
      $scope.loading = true;
      var params = {};
      params.sex = params.status = 'all';
      params.schoolid = user.schoolid;
      params.role = "teacher";
      if($stateParams.teacherid) {
        params.name = $stateParams.teacherid;
        dbkey += "_"+$stateParams.teacherid;
      }
      var dbkey = params.schoolid+'_'+params.name;
      console.log("Profile params:", params);
      if(MyService.online()) {
        MyService.getUsers(params).then(function(users) {
          console.log("teacher", users);
          if(Object.keys(users).length > 0) {
            $scope.allStudents = true;
            $scope.user = users[0];
            teacherSubjects(users[0]);
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
            teacherSubjects(allusers[0]);
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
    console.log("user", v);
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
  $scope.cache = false;
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
        if(wall) {
          wall.liked = (action == "like") ? true : false;
          if(wall.likecount == 1) {
            wall.likecountVal = "Like";
          } else {
            wall.likecountVal = "Likes";
          }
          console.log("Liked/Disliked", wall);
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
  $scope.post.pictures = [];
  $scope.classes = user.subjects;
  $scope.role = user.role;
  $scope.recieverToggle = true;
  $scope.toggleClasses = function(status) {
    for (var i = 0; i < user.subjects.length; i++) {
      $scope.recievers[user.subjects[i].class] = status;
    };
  }
  var upload = function(imageURI) {
    var ft = new FileTransfer(),
        options = new FileUploadOptions();
    options.fileKey = "file";
    options.fileName = user._id +'_'+ Date.now() + ".jpg"; // We will use the name auto-generated by Node at the server side.
    options.mimeType = "image/jpeg";
    options.chunkedMode = false;
    options.enctype="multipart/form-data";
    ft.upload(imageURI, myConfig.server+"/api/wall/upload",
      function (e) {
        console.log("response", e.response);
        $scope.post.pictures.push(myConfig.server+e.response.replace(/"/g, ''));  
        $ionicLoading.hide();
      },
      function (e) {
        $ionicLoading.hide();
        alert("uploaded failed");
      }, options);    
  }
  $scope.takePicture = function(type) {
    if(type == 'browse') {
      var options = {
        quality: 45,
        destinationType: Camera.DestinationType.FILE_URI,
        encodingType: Camera.EncodingType.JPEG,
        sourceType: Camera.PictureSourceType.PHOTOLIBRARY
      };
    } else {
      var options = {
        quality: 45,
        destinationType: Camera.DestinationType.DATA_URL,
        encodingType: Camera.EncodingType.JPEG,
        sourceType: Camera.PictureSourceType.CAMERA
      };
    }
    navigator.camera.getPicture(
      function (imageURI) {
          console.log(imageURI);
          if(type == 'click') imageURI = "data:image/jpeg;base64," + imageURI;
          $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
          upload(imageURI);
      },
      function (message) {
          $ionicLoading.hide();
          // We typically get here because the use canceled the photo operation. Fail silently.
      }, options);
  }
 /* $scope.selectPicture = function() { 
    var options = {
        quality: 60,
        destinationType: Camera.DestinationType.FILE_URI,
        encodingType: Camera.EncodingType.JPEG,
    };
    navigator.camera.getPicture(
      function (imageURI) {
          console.log(imageURI);
          $ionicLoading.show({template: '<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
          upload(imageURI);
      },
      function (message) {
          $ionicLoading.hide();
          // We typically get here because the use canceled the photo operation. Fail silently.
      }, options);
  };
*/
  $scope.submit = function() {
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
    if(MyService.online()) {
      MyService.createWall(params).then(function(wall) {
        console.log('Wall', wall);
        if(wall) {
          $state.go("app.wall", {}, {reload:true});
        }
      });      
/*      var options = {
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
      }*/
    }
  }
})
.controller('TimeTableCtrl', function($scope, $rootScope, $stateParams, $ionicSideMenuDelegate, $state, $ionicSlideBoxDelegate, MyService) {
  $ionicSideMenuDelegate.$getByHandle('right-menu').canDragContent(false);
  console.log("filters", $rootScope.filters);
  // Called to navigate to the main app
  $scope.startApp = function() {
    $state.go('main');
  };
  $scope.next = function() {
    $ionicSlideBoxDelegate.next();
  };
  $scope.previous = function() {
    $ionicSlideBoxDelegate.previous();
  };
  
  // Called each time the slide changes
  $scope.slideChanged = function(index) {
    $scope.data.slideIndex = index;
    $scope.title = $scope.data.slides[index].day;
  };

  $scope.getTimeTable = function() {
    console.log("State params:", $stateParams);
    if($stateParams) {
      var params = $stateParams;
    } else {
      var params = {};
    }
    if(!params.subject) params.subject = 'all';
    params.schoolid = user.schoolid;
    if(!params.class) {
      if(user.role == 'parent') {
        if(user.students.length == 1) {
          params.class = user.students[0].class;
        }
      } else if(user.role == 'teacher') {
        for (var i = 0; i < user.subjects.length; i++) {
          params.class += (i == user.subjects.length - 1) ? user.subjects[i].class : user.subjects[i].class + ",";
        };
      }
    }
    if(params.subject == "all") {
      $scope.classStatus = false;
    } else {
      $scope.classStatus = true;
    }
    if(MyService.online()) {
      MyService.getTimetable(params).then(function(timetables) {
        if(timetables.length > 0) {
          var totaldays = [];
          var timedata = {};
          var daycontainer = {};
          var j = 0;
          console.log("timetable:", timetables);
          for (var i = 0; i < timetables.length; i++) {
            var available = false;
            for (var td = 0; td < totaldays.length; td++) {
              if(totaldays[td].day == timetables[i].day) available = true;
            };
            console.log("totaldays", totaldays);
            console.log("available", available);
            if(!available) {
              totaldays.push({day: timetables[i].day});
              daycontainer[timetables[i].day] = (daycontainer[timetables[i].day]) ? daycontainer[timetables[i].day] : j;
              console.log("daycontainer", daycontainer);
              console.log("timetables i", timetables[i]);
              if(params.subject == "all") {
                totaldays[daycontainer[timetables[i].day]].timetable = timetables[i].timetable;
              } else {
                totaldays[daycontainer[timetables[i].day]].timetable = [];
              }
              j++;
            }
            if(params.subject) {
              console.log("i", i);
              for (var k = 0; k < timetables[i].timetable.length; k++) {
                if(params.subject.indexOf(timetables[i].timetable[k].subject) >= 0) {
                  timetables[i].timetable[k].class = timetables[i].class;
                  totaldays[daycontainer[timetables[i].day]].timetable.push(timetables[i].timetable[k]);
                }
              }
            }
          }
          $scope.data = {
            numViewableSlides : totaldays.length,
            slideIndex : 0,
            initialInstruction : true,
            secondInstruction : false,
            slides : totaldays
          };
          console.log("Data", $scope.data.slides);
          $scope.title = totaldays[0].day;
        }
      })
    } else {

    }
  }
})
.controller('MessagesCtrl', function($scope, $rootScope, $ionicLoading, $cordovaSQLite, $http, $state, $stateParams, MyService) {
  var title = '';
  var mesgroupVal = {};
  var mesgroup = {};
  $scope.title = "Messages";
  $scope.group = false;
  $scope.filterStatus = false;
  $scope.currentuser = user;
  $scope.filtersData = filtersData;
  var params = {};
  var dbkey = user.schoolid;
  params.schoolid = user.schoolid;
  params.userId = user._id;
  params.name = user.name;
  params.classes = '';
  if(user.role == "parent") {
    if($rootScope.role == "parentSingle") {
      params.userId = user.students[0].id;
      params.name = user.students[0].name;
      params.classes = user.students[0].class;
      params.subjects = user.students[0].subjects;
    } else {
      console.log("students", user.students);
      for (var index = 0; index < user.students.length; index++) {
        if(user.students[index].id == $stateParams.userId) {
          params.userId = user.students[index].id
          params.classes = user.students[index].class;
          params.name = user.students[index].name;
          params.subjects = user.students[index].subjects;
        }
      };
    }
  }
  else if (user.role == "teacher") {
    for (var i = 0; i < user.subjects.length; i++) {
      params.classes += (i == 0) ? user.subjects[i].class : ","+user.subjects[i].class;
    }
    params.name = user.name + " Teacher";
    params.userId = user._id;
  }
  var dbmkey = params.schoolid+'_'+params.userId;
  $scope.to = {};
  $scope.tab = "messages";
  $scope.params = params;
  $scope.filterToggle = function() {$scope.filterStatus = !$scope.filterStatus;}
  $scope.allowEdit = function() {
    $scope.group = !$scope.group;
  }
  $scope.groupStatus = function(group) {
    if(group) {
      $scope.group = true;
    } else {
      $scope.group = false;
    }
  }
  $scope.goto = function(to) {
    console.log("to", to);
    $state.go("app.messagebox", {to:to}, {reload:true});
  }
  var title = 'Select user/class to chat';
  $scope.getUsers = function() {
    var userParam = {schoolid: params.schoolid};
    params.standard = params.division = "all";
    if (user.role == 'teacher') {
      userParam.standard = 'teacher';
      userParam.division = user.name;
      userParam.role = "student,hm";
    } else if (user.role == 'parent') {
      userParam.role = "teacher,hm";
      userParam.name = 'Head Master';
      for (var q = 0; q < params.subjects.length; q++) {
        userParam.name += ","+params.subjects[q].teacher;
      }
      title = "Select user to chat";
    } else {
      userParam.role = "student,teacher";
    }
    console.log("Users Param", params);
    $scope.title = title;
    $scope.tab = "user";
    if(MyService.online()) {
      $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
      MyService.getUsers(userParam).then(function(users) {
        console.log("users", users[0]);
          console.log("Got all users:", users.length);
        if(users.length > 0) {
          $scope.allStudents = true;
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
          $scope.allStudents = false;
        }    
      }).finally(function() {$scope.$broadcast('scroll.refreshComplete'); $ionicLoading.hide();});
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
  var processUsers = function(users) {
    var AllContacts = [];
    var indexes = [];
    for (var i = 0; i < users.length; i++) {
      if(users[i].role == 'student') {
        if(indexes.indexOf(users[i].standard+'-'+users[i].division) == -1) {
          indexes.push(users[i].standard+'-'+users[i].division);
          AllContacts.push({id:users[i].standard+"-"+users[i].division,toName:users[i].standard+'-'+users[i].division,toId:users[i].standard+'-'+users[i].division,role:"class",type:"group",userId:params.userId,name:params.name});
        }
        AllContacts.push({id:params.userId+"-"+users[i]._id,toName:"Parent of "+users[i].name,toId:users[i]._id,role:users[i].role,type:"single",userId:params.userId,name:params.name});
      } else if (users[i].role == 'hm') {
        AllContacts.push({id:params.userId+"-"+users[i]._id,toName:users[i].name,toId:users[i]._id,role:users[i].role,type:"single",userId:params.userId,name:params.name});
      } else {
        AllContacts.push({id:params.userId+"-"+users[i]._id,toName:users[i].name+" Teacher",toId:users[i]._id,role:users[i].role,type:"single",userId:params.userId,name:params.name});
      }
    }
    console.log("AllContacts",AllContacts);
    $scope.contacts = AllContacts;
  }

  $scope.getMessages = function() {
    $scope.empty = true;
    $scope.title = "Messages";
    $scope.tab = "messages";
    console.log("Messages Params", params);
    if(MyService.online()) {
      MyService.getMessages(params).then(function(messages) {
      console.log("Messages", messages);
      for (var i = 0; i < messages.length; i++) {
        $scope.empty = false;
        mesgroupVal[messages[i].chatname] = messages[i];
        if(params.userId == messages[i].userId) {

        } else {
          console.log("seen calculation begins",mesgroupVal[messages[i].chatname].seencount);
          if(messages[i].type == "single") {
            mesgroupVal[messages[i].chatname].to[0].name = messages[i].name;
            mesgroupVal[messages[i].chatname].to[0].id = messages[i].userId;          
            mesgroupVal[messages[i].chatname].name = params.name;
            mesgroupVal[messages[i].chatname].userId = params.userId;
          } else {
            mesgroupVal[messages[i].chatname].to[0].name = messages[i].chatname;
            mesgroupVal[messages[i].chatname].to[0].id = messages[i].chatname;          
            mesgroupVal[messages[i].chatname].name = params.name;
            mesgroupVal[messages[i].chatname].userId = params.userId;
          }
          console.log("calculating seen",params.userId);
          console.log("seen",messages[i].seen);
          if(messages[i].seen.indexOf(params.userId) == -1) {
            console.log("mesgroup", mesgroup[messages[i].chatname]);
            if(mesgroup[messages[i].chatname] === undefined) {
              mesgroup[messages[i].chatname] = 1;
            } else {
              mesgroup[messages[i].chatname] = parseInt(mesgroup[messages[i].chatname]) + 1;
            }
          }
        }
        console.log("count", mesgroup[messages[i].chatname]);
        mesgroupVal[messages[i].chatname].seencount = mesgroup[messages[i].chatname];
      }
      console.log("final messages", mesgroupVal);
      $scope.messages = mesgroupVal;
      }, function(err) {  
        console.log("error", err);
      }).finally(function() {$scope.$broadcast('scroll.refreshComplete'); $ionicLoading.hide();});
    } else {

    }
  }
/*  var processMessages = function(messages) {
    for (var i = 0; i < messages.length; i++) {
    };
  }*/
  $scope.toMessageBox = function(msg) {
    //href="#/app/messages/{{contact.id}}/{{contact.toId}}/{{contact.toName}}/{{params.userId}}/{{params.name}}/{{contact.type}}"
    console.log("Messages", mesgroupVal);
    console.log("contact", msg);
    var tomsgbox = {chatname: msg.id,toId:msg.toId,toName:msg.toName,userId:msg.userId,name:msg.name,type:msg.type}
    if(msg.type == "single") {
      for(var gmes in mesgroupVal) {
        if(msg.toName == mesgroupVal[gmes].to[0].name) {
          tomsgbox.chatname = mesgroupVal[gmes].chatname;
        }
      }
      console.log("tomsg", tomsgbox);
      $state.go("app.messagebox", tomsgbox, {reload:true})
    } else {
      $state.go("app.messagebox", tomsgbox, {reload:true})
    }
  }
})
.controller('MessageBoxCtrl', function($scope, $rootScope, $state, $stateParams, MockService, $ionicActionSheet, $ionicPopup, $ionicScrollDelegate, $timeout, $interval, MyService) {
  console.log("state Params MB", $stateParams);
  // mock acquiring data via $stateParams
  $scope.messages = [];
  var params = $stateParams;
  var dbkey = user.schoolid;
  params.schoolid = user.schoolid;
  if($rootScope.role == "parentSingle") {
    params.userId = user.students[0].id;
    params.name = "Parent of "+user.students[0].name;
  }
    $scope.params = params;
    $scope.input = {
      message: localStorage['userMessage-' + params.toId] || ''
    };

    var messageCheckTimer;

    var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    var footerBar; // gets set in $ionicView.enter
    var scroller;
    var txtInput; // ^^^

    $scope.$on('$ionicView.enter', function() {
      console.log('UserMessages $ionicView.enter');

      getMessages();
      
      $timeout(function() {
        footerBar = document.body.querySelector('#userMessagesView .bar-footer');
        scroller = document.body.querySelector('#userMessagesView .scroll-content');
        txtInput = angular.element(footerBar.querySelector('textarea'));
      }, 0);

      messageCheckTimer = $interval(function() {
        // here you could check for new messages if your app doesn't use push notifications or user disabled them
      }, 20000);
    });

    $scope.$on('$ionicView.leave', function() {
      console.log('leaving UserMessages view, destroying interval');
      // Make sure that the interval is destroyed
      if (angular.isDefined(messageCheckTimer)) {
        $interval.cancel(messageCheckTimer);
        messageCheckTimer = undefined;
      }
    });

    $scope.$on('$ionicView.beforeLeave', function() {
      if (!$scope.input.message || $scope.input.message === '') {
        localStorage.removeItem('userMessage-' + params.toId);
      }
    });
    function getMessages() {
      // the service is mock but you would probably pass the toUser's GUID here
      MyService.getConversation(params).then(function(data) {
        console.log("My recieved Messages", data);
        $scope.doneLoading = true;
        $scope.messages = data;
        MyService.updateMessages({schoolid:params.schoolid,chatname:params.chatname,type:params.type,seen:params.userId}).then(function(updated) {
          console.log("updated Messages", updated);
        }, function(err) {
          console.log("something wrong updating");
        })
        $timeout(function() {
          viewScroll.scrollBottom();
        }, 0);
      }, function(err) {
        console.log("Not able to get messages");
      });
    }

    $scope.$watch('input.message', function(newValue, oldValue) {
      console.log('input.message $watch, newValue ' + newValue);
      if (!newValue) newValue = '';
      //localStorage['userMessage-' + $scope.toUser._id] = newValue;
    });

    $scope.sendMessage = function(sendMessageForm) {
      var message = {
        chatname: params.chatname,
        to: [{id:params.toId,name:params.toName}],
        text: $scope.input.message
      };
      // if you do a web service call this will be needed as well as before the viewScroll calls
      // you can't see the effect of this in the browser it needs to be used on a real device
      // for some reason the one time blur event is not firing in the browser but does on devices
      keepKeyboardOpen();
      
      $scope.input.message = '';
      //MockService.sendMessage(message).then(function(data) {

      message.date = new Date();
      message.name = params.name;
      message.userId = params.userId;
      message.schoolid = params.schoolid;
      message.type = params.type;
      $scope.messages.push(message);
      MyService.sendMessage(message).then(function(data) {
        console.log("Message sent successfully", data);
      }, function(err) {
        console.log("Error sending message", err);
      })
      $timeout(function() {
        keepKeyboardOpen();
        viewScroll.scrollBottom(true);
      }, 0);

/*      $timeout(function() {
        $scope.messages.push(MockService.getMockMessage());
        keepKeyboardOpen();
        viewScroll.scrollBottom(true);
      }, 2000);*/

      //});
    };
    
    // this keeps the keyboard open on a device only after sending a message, it is non obtrusive
    function keepKeyboardOpen() {
      console.log('keepKeyboardOpen');
      txtInput.one('blur', function() {
        console.log('textarea blur, focus back on it');
        txtInput[0].focus();
      });
    }

    $scope.onMessageHold = function(e, itemIndex, message) {
      console.log('onMessageHold');
      console.log('message: ' + JSON.stringify(message, null, 2));
      $ionicActionSheet.show({
        buttons: [{
          text: 'Copy Text'
        }, {
          text: 'Delete Message'
        }],
        buttonClicked: function(index) {
          switch (index) {
            case 0: // Copy Text
              //cordova.plugins.clipboard.copy(message.text);

              break;
            case 1: // Delete
              // no server side secrets here :~)
              $scope.messages.splice(itemIndex, 1);
              $timeout(function() {
                viewScroll.resize();
              }, 0);

              break;
          }
          
          return true;
        }
      });
    };

    // this prob seems weird here but I have reasons for this in my app, secret!
    $scope.viewProfile = function(msg) {
      if (msg.userId === $scope.user._id) {
        // go to your profile
      } else {
        // go to other users profile
      }
    };
    
    // I emit this event from the monospaced.elastic directive, read line 480
    $scope.$on('taResize', function(e, ta) {
      console.log('taResize');
      if (!ta) return;
      
      var taHeight = ta[0].offsetHeight;
      console.log('taHeight: ' + taHeight);
      
      if (!footerBar) return;
      
      var newFooterHeight = taHeight + 10;
      newFooterHeight = (newFooterHeight > 44) ? newFooterHeight : 44;
      
      footerBar.style.height = newFooterHeight + 'px';
      scroller.style.bottom = newFooterHeight + 'px'; 
    });
 
})
.controller('LoginCtrl', function($scope, $state, $ionicModal, $ionicLoading, $ionicUser, $ionicPush, $ionicAnalytics, MyService) {
  $scope.uid = localStorage.getItem('uid') || '';
  user = (localStorage.getItem('user')) ? JSON.parse(localStorage.getItem('user')) : {};
  if($scope.uid) {
    if(user.role == "hm") {
  //    $scope.menuLinks = myConfig.hmMenu;
      $state.go('app.hmdashboard', {}, {reload: true});
    } else if (user.role == "parent") {
      if(user.students.length > 1) {
    //    $scope.menuLinks = myConfig.parentMenu;
        $state.go('app.wall', {}, {reload: true});
      } else {
      //  $scope.menuLinks = myConfig.parentSingleMenu;
        $state.go('app.studentDashboard', {}, {reload: true});
      }
    } else {
      if(user.standard) {
        //$scope.menuLinks = myConfig.classTeacherMenu;
        $state.go('app.dashboard', {}, {reload: true});
      } else {
        //$scope.menuLinks = myConfig.teacherMenu;                            
        $state.go('app.teacherdashboard', {}, {reload: true});
      }
    }
  }
  $scope.user = {
    email: '',
    password: '',
  }
  $scope.users = [
  {
    title: 'Head Master',
    email: "8951572125",
    password: 'RYO9f1P47qaDuMrj36+doA=='
  },
  {
    title: 'Class Teacher',
    email: "9944711040",
    password: "he49m5cdi"
  },
  {
    title: 'Subject Teacher',
    email: "9894321256",
    password: "xg6re8kt9"
  },
  {
    title: "Parent with single Student",
    email: "9944711001",
    password: "kmx6r"
  },
  {
    title: 'Parent with multiple student',
    email: '7890089011',
    password: 'l7k2ihpvi'
  }];
  $scope.fillUser = function(modal, email, password) {
    modal.hide();
    $scope.user = {
      email: email,
      password: password
    }
    $scope.login();
  }
  $scope.showUsers = function() {
    $ionicModal.fromTemplateUrl('templates/selectusers.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
      $scope.modal.show();
    });
  }
  //parent with multiple student
//  $scope.user = $scope.users[0];
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
          var iuser = {
            user_id: data._id,
            name: data.name,
            role: data.role,
            school:data.school
          }
          // Identify your user with the Ionic User Service
          $ionicUser.identify(iuser).then(function(tok){
            console.log("got something", tok);
            console.log('Identified user ' + iuser.name + '\n ID ' + iuser.user_id);
            $ionicAnalytics.register();
            // Register with the Ionic Push service.  All parameters are optional.
            $ionicPush.register({
              canShowAlert: true, //Can pushes show an alert on your screen?
              canSetBadge: true, //Can pushes update app icon badges?
              canPlaySound: true, //Can notifications play a sound?
              canRunActionsOnWake: true, //Can run actions outside the app,
              onNotification: function(notification) {
                //Handle new push notifications here
                console.log("This is where i handle notifications", notification);
                //$state.go('app.messagebox', {chatname:notification.chatname,name:notification.name,userId:notification.userId,toName:notification.toName,toId:notification.toId,type:notification.type}, {reload:true});
                $state.go('app.messages', {}, {reload:true});
              }
            },iuser);
          })

          if(data.role == "hm") {
            $state.go("app.hmdashboard", {}, {'reload': true});
          } else if (data.role == "parent") {
            if(data.students.length == 1) {
              $state.go("app.studentDashboard", {}, {'reload': true});
            } else {
              $state.go("app.wall", {}, {'reload': true});            
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
})

// services
.factory('MockService', ['$http', '$q',
  function($http, $q) {
    var me = {};

    me.getUserMessages = function(d) {
      /*
      var endpoint =
        'http://www.mocky.io/v2/547cf341501c337f0c9a63fd?callback=JSON_CALLBACK';
      return $http.jsonp(endpoint).then(function(response) {
        return response.data;
      }, function(err) {
        console.log('get user messages error, err: ' + JSON.stringify(
          err, null, 2));
      });
      */
      var deferred = $q.defer();
      
     setTimeout(function() {
        deferred.resolve(getMockMessages());
      }, 1500);
      
      return deferred.promise;
    };

    me.getMockMessage = function() {
      return {
        userId: '534b8e5aaa5e7afc1b23e69b',
        date: new Date(),
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
      };
    }

    return me;
  }
])

// fitlers
.filter('nl2br', ['$filter',
  function($filter) {
    return function(data) {
      if (!data) return data;
      return data.replace(/\n\r?/g, '<br />');
    };
  }
])

// directives
.directive('autolinker', ['$timeout',
  function($timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        $timeout(function() {
          var eleHtml = element.html();

          if (eleHtml === '') {
            return false;
          }

          var text = Autolinker.link(eleHtml, {
            className: 'autolinker',
            newWindow: false
          });

          element.html(text);

          var autolinks = element[0].getElementsByClassName('autolinker');

          for (var i = 0; i < autolinks.length; i++) {
            angular.element(autolinks[i]).bind('click', function(e) {
              var href = e.target.href;
              console.log('autolinkClick, href: ' + href);

              if (href) {
                //window.open(href, '_system');
                window.open(href, '_blank');
              }

              e.preventDefault();
              return false;
            });
          }
        }, 0);
      }
    }
  }
])

function onProfilePicError(ele) {
  this.ele.src = ''; // set a fallback
}

function getMockMessages() {
  return {"messages":[{"_id":"535d625f898df4e80e2a125e","text":"Ionic has changed the game for hybrid app development.","userId":"534b8fb2aa5e7afc1b23e69c","date":"2014-04-27T20:02:39.082Z","read":true,"readDate":"2014-12-01T06:27:37.944Z"},{"_id":"535f13ffee3b2a68112b9fc0","text":"I like Ionic better than ice cream!","userId":"534b8e5aaa5e7afc1b23e69b","date":"2014-04-29T02:52:47.706Z","read":true,"readDate":"2014-12-01T06:27:37.944Z"},{"_id":"546a5843fd4c5d581efa263a","text":"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.","userId":"534b8fb2aa5e7afc1b23e69c","date":"2014-11-17T20:19:15.289Z","read":true,"readDate":"2014-12-01T06:27:38.328Z"},{"_id":"54764399ab43d1d4113abfd1","text":"Am I dreaming?","userId":"534b8e5aaa5e7afc1b23e69b","date":"2014-11-26T21:18:17.591Z","read":true,"readDate":"2014-12-01T06:27:38.337Z"},{"_id":"547643aeab43d1d4113abfd2","text":"Is this magic?","userId":"534b8fb2aa5e7afc1b23e69c","date":"2014-11-26T21:18:38.549Z","read":true,"readDate":"2014-12-01T06:27:38.338Z"},{"_id":"547815dbab43d1d4113abfef","text":"Gee wiz, this is something special.","userId":"534b8e5aaa5e7afc1b23e69b","date":"2014-11-28T06:27:40.001Z","read":true,"readDate":"2014-12-01T06:27:38.338Z"},{"_id":"54781c69ab43d1d4113abff0","text":"I think I like Ionic more than I like ice cream!","userId":"534b8fb2aa5e7afc1b23e69c","date":"2014-11-28T06:55:37.350Z","read":true,"readDate":"2014-12-01T06:27:38.338Z"},{"_id":"54781ca4ab43d1d4113abff1","text":"Yea, it's pretty sweet","userId":"534b8e5aaa5e7afc1b23e69b","date":"2014-11-28T06:56:36.472Z","read":true,"readDate":"2014-12-01T06:27:38.338Z"},{"_id":"5478df86ab43d1d4113abff4","text":"Wow, this is really something huh?","userId":"534b8fb2aa5e7afc1b23e69c","date":"2014-11-28T20:48:06.572Z","read":true,"readDate":"2014-12-01T06:27:38.339Z"},{"_id":"54781ca4ab43d1d4113abff1","text":"Create amazing apps - ionicframework.com","userId":"534b8e5aaa5e7afc1b23e69b","date":"2014-11-29T06:56:36.472Z","read":true,"readDate":"2014-12-01T06:27:38.338Z"}],"unread":0};
}

// configure moment relative time
moment.locale('en', {
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "%d sec",
    m: "a minute",
    mm: "%d minutes",
    h: "an hour",
    hh: "%d hours",
    d: "a day",
    dd: "%d days",
    M: "a month",
    MM: "%d months",
    y: "a year",
    yy: "%d years"
  }
});

/*
 * angular-elastic v2.4.2
 * (c) 2014 Monospaced http://monospaced.com
 * License: MIT
 */

angular.module('monospaced.elastic', [])

  .constant('msdElasticConfig', {
    append: ''
  })

  .directive('msdElastic', [
    '$timeout', '$window', 'msdElasticConfig',
    function($timeout, $window, config) {
      'use strict';

      return {
        require: 'ngModel',
        restrict: 'A, C',
        link: function(scope, element, attrs, ngModel) {

          // cache a reference to the DOM element
          var ta = element[0],
              $ta = element;

          // ensure the element is a textarea, and browser is capable
          if (ta.nodeName !== 'TEXTAREA' || !$window.getComputedStyle) {
            return;
          }

          // set these properties before measuring dimensions
          $ta.css({
            'overflow': 'hidden',
            'overflow-y': 'hidden',
            'word-wrap': 'break-word'
          });

          // force text reflow
          var text = ta.value;
          ta.value = '';
          ta.value = text;

          var append = attrs.msdElastic ? attrs.msdElastic.replace(/\\n/g, '\n') : config.append,
              $win = angular.element($window),
              mirrorInitStyle = 'position: absolute; top: -999px; right: auto; bottom: auto;' +
                                'left: 0; overflow: hidden; -webkit-box-sizing: content-box;' +
                                '-moz-box-sizing: content-box; box-sizing: content-box;' +
                                'min-height: 0 !important; height: 0 !important; padding: 0;' +
                                'word-wrap: break-word; border: 0;',
              $mirror = angular.element('<textarea tabindex="-1" ' +
                                        'style="' + mirrorInitStyle + '"/>').data('elastic', true),
              mirror = $mirror[0],
              taStyle = getComputedStyle(ta),
              resize = taStyle.getPropertyValue('resize'),
              borderBox = taStyle.getPropertyValue('box-sizing') === 'border-box' ||
                          taStyle.getPropertyValue('-moz-box-sizing') === 'border-box' ||
                          taStyle.getPropertyValue('-webkit-box-sizing') === 'border-box',
              boxOuter = !borderBox ? {width: 0, height: 0} : {
                            width:  parseInt(taStyle.getPropertyValue('border-right-width'), 10) +
                                    parseInt(taStyle.getPropertyValue('padding-right'), 10) +
                                    parseInt(taStyle.getPropertyValue('padding-left'), 10) +
                                    parseInt(taStyle.getPropertyValue('border-left-width'), 10),
                            height: parseInt(taStyle.getPropertyValue('border-top-width'), 10) +
                                    parseInt(taStyle.getPropertyValue('padding-top'), 10) +
                                    parseInt(taStyle.getPropertyValue('padding-bottom'), 10) +
                                    parseInt(taStyle.getPropertyValue('border-bottom-width'), 10)
                          },
              minHeightValue = parseInt(taStyle.getPropertyValue('min-height'), 10),
              heightValue = parseInt(taStyle.getPropertyValue('height'), 10),
              minHeight = Math.max(minHeightValue, heightValue) - boxOuter.height,
              maxHeight = parseInt(taStyle.getPropertyValue('max-height'), 10),
              mirrored,
              active,
              copyStyle = ['font-family',
                           'font-size',
                           'font-weight',
                           'font-style',
                           'letter-spacing',
                           'line-height',
                           'text-transform',
                           'word-spacing',
                           'text-indent'];

          // exit if elastic already applied (or is the mirror element)
          if ($ta.data('elastic')) {
            return;
          }

          // Opera returns max-height of -1 if not set
          maxHeight = maxHeight && maxHeight > 0 ? maxHeight : 9e4;

          // append mirror to the DOM
          if (mirror.parentNode !== document.body) {
            angular.element(document.body).append(mirror);
          }

          // set resize and apply elastic
          $ta.css({
            'resize': (resize === 'none' || resize === 'vertical') ? 'none' : 'horizontal'
          }).data('elastic', true);

          /*
           * methods
           */

          function initMirror() {
            var mirrorStyle = mirrorInitStyle;

            mirrored = ta;
            // copy the essential styles from the textarea to the mirror
            taStyle = getComputedStyle(ta);
            angular.forEach(copyStyle, function(val) {
              mirrorStyle += val + ':' + taStyle.getPropertyValue(val) + ';';
            });
            mirror.setAttribute('style', mirrorStyle);
          }

          function adjust() {
            var taHeight,
                taComputedStyleWidth,
                mirrorHeight,
                width,
                overflow;

            if (mirrored !== ta) {
              initMirror();
            }

            // active flag prevents actions in function from calling adjust again
            if (!active) {
              active = true;

              mirror.value = ta.value + append; // optional whitespace to improve animation
              mirror.style.overflowY = ta.style.overflowY;

              taHeight = ta.style.height === '' ? 'auto' : parseInt(ta.style.height, 10);

              taComputedStyleWidth = getComputedStyle(ta).getPropertyValue('width');

              // ensure getComputedStyle has returned a readable 'used value' pixel width
              if (taComputedStyleWidth.substr(taComputedStyleWidth.length - 2, 2) === 'px') {
                // update mirror width in case the textarea width has changed
                width = parseInt(taComputedStyleWidth, 10) - boxOuter.width;
                mirror.style.width = width + 'px';
              }

              mirrorHeight = mirror.scrollHeight;

              if (mirrorHeight > maxHeight) {
                mirrorHeight = maxHeight;
                overflow = 'scroll';
              } else if (mirrorHeight < minHeight) {
                mirrorHeight = minHeight;
              }
              mirrorHeight += boxOuter.height;
              ta.style.overflowY = overflow || 'hidden';

              if (taHeight !== mirrorHeight) {
                ta.style.height = mirrorHeight + 'px';
                scope.$emit('elastic:resize', $ta);
              }
              
              scope.$emit('taResize', $ta); // listen to this in the UserMessagesCtrl

              // small delay to prevent an infinite loop
              $timeout(function() {
                active = false;
              }, 1);

            }
          }

          function forceAdjust() {
            active = false;
            adjust();
          }

          /*
           * initialise
           */

          // listen
          if ('onpropertychange' in ta && 'oninput' in ta) {
            // IE9
            ta['oninput'] = ta.onkeyup = adjust;
          } else {
            ta['oninput'] = adjust;
          }

          $win.bind('resize', forceAdjust);

          scope.$watch(function() {
            return ngModel.$modelValue;
          }, function(newValue) {
            forceAdjust();
          });

          scope.$on('elastic:adjust', function() {
            initMirror();
            forceAdjust();
          });

          $timeout(adjust);

          /*
           * destroy
           */

          scope.$on('$destroy', function() {
            $mirror.remove();
            $win.unbind('resize', forceAdjust);
          });
        }
      };
    }
  ]);

// autolinker
/*!
 * Autolinker.js
 * 0.15.0
 *
 * Copyright(c) 2014 Gregory Jacobs <greg@greg-jacobs.com>
 * MIT Licensed. http://www.opensource.org/licenses/mit-license.php
 *
 * https://github.com/gregjacobs/Autolinker.js
 */
!function(a,b){"function"==typeof define&&define.amd?define([],function(){return a.returnExportsGlobal=b()}):"object"==typeof exports?module.exports=b():a.Autolinker=b()}(this,function(){var a=function(b){a.Util.assign(this,b),this.matchValidator=new a.MatchValidator};return a.prototype={constructor:a,urls:!0,email:!0,twitter:!0,newWindow:!0,stripPrefix:!0,className:"",htmlCharacterEntitiesRegex:/(&nbsp;|&#160;|&lt;|&#60;|&gt;|&#62;)/gi,matcherRegex:function(){var a=/(^|[^\w])@(\w{1,15})/,b=/(?:[\-;:&=\+\$,\w\.]+@)/,c=/(?:[A-Za-z][-.+A-Za-z0-9]+:(?![A-Za-z][-.+A-Za-z0-9]+:\/\/)(?!\d+\/?)(?:\/\/)?)/,d=/(?:www\.)/,e=/[A-Za-z0-9\.\-]*[A-Za-z0-9\-]/,f=/\.(?:international|construction|contractors|enterprises|photography|productions|foundation|immobilien|industries|management|properties|technology|christmas|community|directory|education|equipment|institute|marketing|solutions|vacations|bargains|boutique|builders|catering|cleaning|clothing|computer|democrat|diamonds|graphics|holdings|lighting|partners|plumbing|supplies|training|ventures|academy|careers|company|cruises|domains|exposed|flights|florist|gallery|guitars|holiday|kitchen|neustar|okinawa|recipes|rentals|reviews|shiksha|singles|support|systems|agency|berlin|camera|center|coffee|condos|dating|estate|events|expert|futbol|kaufen|luxury|maison|monash|museum|nagoya|photos|repair|report|social|supply|tattoo|tienda|travel|viajes|villas|vision|voting|voyage|actor|build|cards|cheap|codes|dance|email|glass|house|mango|ninja|parts|photo|shoes|solar|today|tokyo|tools|watch|works|aero|arpa|asia|best|bike|blue|buzz|camp|club|cool|coop|farm|fish|gift|guru|info|jobs|kiwi|kred|land|limo|link|menu|mobi|moda|name|pics|pink|post|qpon|rich|ruhr|sexy|tips|vote|voto|wang|wien|wiki|zone|bar|bid|biz|cab|cat|ceo|com|edu|gov|int|kim|mil|net|onl|org|pro|pub|red|tel|uno|wed|xxx|xyz|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cw|cx|cy|cz|de|dj|dk|dm|do|dz|ec|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|za|zm|zw)\b/,g=/[\-A-Za-z0-9+&@#\/%=~_()|'$*\[\]?!:,.;]*[\-A-Za-z0-9+&@#\/%=~_()|'$*\[\]]/;return new RegExp(["(",a.source,")","|","(",b.source,e.source,f.source,")","|","(","(?:","(",c.source,e.source,")","|","(?:","(.?//)?",d.source,e.source,")","|","(?:","(.?//)?",e.source,f.source,")",")","(?:"+g.source+")?",")"].join(""),"gi")}(),charBeforeProtocolRelMatchRegex:/^(.)?\/\//,link:function(b){var c=this,d=this.getHtmlParser(),e=this.htmlCharacterEntitiesRegex,f=0,g=[];return d.parse(b,{processHtmlNode:function(a,b,c){"a"===b&&(c?f=Math.max(f-1,0):f++),g.push(a)},processTextNode:function(b){if(0===f)for(var d=a.Util.splitAndCapture(b,e),h=0,i=d.length;i>h;h++){var j=d[h],k=c.processTextNode(j);g.push(k)}else g.push(b)}}),g.join("")},getHtmlParser:function(){var b=this.htmlParser;return b||(b=this.htmlParser=new a.HtmlParser),b},getTagBuilder:function(){var b=this.tagBuilder;return b||(b=this.tagBuilder=new a.AnchorTagBuilder({newWindow:this.newWindow,truncate:this.truncate,className:this.className})),b},processTextNode:function(a){var b=this;return a.replace(this.matcherRegex,function(a,c,d,e,f,g,h,i,j){var k=b.processCandidateMatch(a,c,d,e,f,g,h,i,j);if(k){var l=b.createMatchReturnVal(k.match,k.matchStr);return k.prefixStr+l+k.suffixStr}return a})},processCandidateMatch:function(b,c,d,e,f,g,h,i,j){var k,l=i||j,m="",n="";if(c&&!this.twitter||f&&!this.email||g&&!this.urls||!this.matchValidator.isValidMatch(g,h,l))return null;if(this.matchHasUnbalancedClosingParen(b)&&(b=b.substr(0,b.length-1),n=")"),f)k=new a.match.Email({matchedText:b,email:f});else if(c)d&&(m=d,b=b.slice(1)),k=new a.match.Twitter({matchedText:b,twitterHandle:e});else{if(l){var o=l.match(this.charBeforeProtocolRelMatchRegex)[1]||"";o&&(m=o,b=b.slice(1))}k=new a.match.Url({matchedText:b,url:b,protocolUrlMatch:!!h,protocolRelativeMatch:!!l,stripPrefix:this.stripPrefix})}return{prefixStr:m,suffixStr:n,matchStr:b,match:k}},matchHasUnbalancedClosingParen:function(a){var b=a.charAt(a.length-1);if(")"===b){var c=a.match(/\(/g),d=a.match(/\)/g),e=c&&c.length||0,f=d&&d.length||0;if(f>e)return!0}return!1},createMatchReturnVal:function(b,c){var d;if(this.replaceFn&&(d=this.replaceFn.call(this,this,b)),"string"==typeof d)return d;if(d===!1)return c;if(d instanceof a.HtmlTag)return d.toString();var e=this.getTagBuilder(),f=e.build(b);return f.toString()}},a.link=function(b,c){var d=new a(c);return d.link(b)},a.match={},a.Util={abstractMethod:function(){throw"abstract"},assign:function(a,b){for(var c in b)b.hasOwnProperty(c)&&(a[c]=b[c]);return a},extend:function(b,c){var d=b.prototype,e=function(){};e.prototype=d;var f;f=c.hasOwnProperty("constructor")?c.constructor:function(){d.constructor.apply(this,arguments)};var g=f.prototype=new e;return g.constructor=f,g.superclass=d,delete c.constructor,a.Util.assign(g,c),f},ellipsis:function(a,b,c){return a.length>b&&(c=null==c?"..":c,a=a.substring(0,b-c.length)+c),a},indexOf:function(a,b){if(Array.prototype.indexOf)return a.indexOf(b);for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return c;return-1},splitAndCapture:function(a,b){if(!b.global)throw new Error("`splitRegex` must have the 'g' flag set");for(var c,d=[],e=0;c=b.exec(a);)d.push(a.substring(e,c.index)),d.push(c[0]),e=c.index+c[0].length;return d.push(a.substring(e)),d}},a.HtmlParser=a.Util.extend(Object,{htmlRegex:function(){var a=/[0-9a-zA-Z][0-9a-zA-Z:]*/,b=/[^\s\0"'>\/=\x01-\x1F\x7F]+/,c=/(?:".*?"|'.*?'|[^'"=<>`\s]+)/,d=b.source+"(?:\\s*=\\s*"+c.source+")?";return new RegExp(["(?:","<(!DOCTYPE)","(?:","\\s+","(?:",d,"|",c.source+")",")*",">",")","|","(?:","<(/)?","("+a.source+")","(?:","\\s+",d,")*","\\s*/?",">",")"].join(""),"gi")}(),parse:function(a,b){b=b||{};for(var c,d=b.processHtmlNode||function(){},e=b.processTextNode||function(){},f=this.htmlRegex,g=0;null!==(c=f.exec(a));){var h=c[0],i=c[1]||c[3],j=!!c[2],k=a.substring(g,c.index);k&&e(k),d(h,i.toLowerCase(),j),g=c.index+h.length}if(g<a.length){var l=a.substring(g);l&&e(l)}}}),a.HtmlTag=a.Util.extend(Object,{whitespaceRegex:/\s+/,constructor:function(b){a.Util.assign(this,b),this.innerHtml=this.innerHtml||this.innerHTML},setTagName:function(a){return this.tagName=a,this},getTagName:function(){return this.tagName||""},setAttr:function(a,b){var c=this.getAttrs();return c[a]=b,this},getAttr:function(a){return this.getAttrs()[a]},setAttrs:function(b){var c=this.getAttrs();return a.Util.assign(c,b),this},getAttrs:function(){return this.attrs||(this.attrs={})},setClass:function(a){return this.setAttr("class",a)},addClass:function(b){for(var c,d=this.getClass(),e=this.whitespaceRegex,f=a.Util.indexOf,g=d?d.split(e):[],h=b.split(e);c=h.shift();)-1===f(g,c)&&g.push(c);return this.getAttrs()["class"]=g.join(" "),this},removeClass:function(b){for(var c,d=this.getClass(),e=this.whitespaceRegex,f=a.Util.indexOf,g=d?d.split(e):[],h=b.split(e);g.length&&(c=h.shift());){var i=f(g,c);-1!==i&&g.splice(i,1)}return this.getAttrs()["class"]=g.join(" "),this},getClass:function(){return this.getAttrs()["class"]||""},hasClass:function(a){return-1!==(" "+this.getClass()+" ").indexOf(" "+a+" ")},setInnerHtml:function(a){return this.innerHtml=a,this},getInnerHtml:function(){return this.innerHtml||""},toString:function(){var a=this.getTagName(),b=this.buildAttrsStr();return b=b?" "+b:"",["<",a,b,">",this.getInnerHtml(),"</",a,">"].join("")},buildAttrsStr:function(){if(!this.attrs)return"";var a=this.getAttrs(),b=[];for(var c in a)a.hasOwnProperty(c)&&b.push(c+'="'+a[c]+'"');return b.join(" ")}}),a.MatchValidator=a.Util.extend(Object,{invalidProtocolRelMatchRegex:/^[\w]\/\//,hasFullProtocolRegex:/^[A-Za-z][-.+A-Za-z0-9]+:\/\//,uriSchemeRegex:/^[A-Za-z][-.+A-Za-z0-9]+:/,hasWordCharAfterProtocolRegex:/:[^\s]*?[A-Za-z]/,isValidMatch:function(a,b,c){return b&&!this.isValidUriScheme(b)||this.urlMatchDoesNotHaveProtocolOrDot(a,b)||this.urlMatchDoesNotHaveAtLeastOneWordChar(a,b)||this.isInvalidProtocolRelativeMatch(c)?!1:!0},isValidUriScheme:function(a){var b=a.match(this.uriSchemeRegex)[0];return"javascript:"!==b&&"vbscript:"!==b},urlMatchDoesNotHaveProtocolOrDot:function(a,b){return!(!a||b&&this.hasFullProtocolRegex.test(b)||-1!==a.indexOf("."))},urlMatchDoesNotHaveAtLeastOneWordChar:function(a,b){return a&&b?!this.hasWordCharAfterProtocolRegex.test(a):!1},isInvalidProtocolRelativeMatch:function(a){return!!a&&this.invalidProtocolRelMatchRegex.test(a)}}),a.AnchorTagBuilder=a.Util.extend(Object,{constructor:function(b){a.Util.assign(this,b)},build:function(b){var c=new a.HtmlTag({tagName:"a",attrs:this.createAttrs(b.getType(),b.getAnchorHref()),innerHtml:this.processAnchorText(b.getAnchorText())});return c},createAttrs:function(a,b){var c={href:b},d=this.createCssClass(a);return d&&(c["class"]=d),this.newWindow&&(c.target="_blank"),c},createCssClass:function(a){var b=this.className;return b?b+" "+b+"-"+a:""},processAnchorText:function(a){return a=this.doTruncate(a)},doTruncate:function(b){return a.Util.ellipsis(b,this.truncate||Number.POSITIVE_INFINITY)}}),a.match.Match=a.Util.extend(Object,{constructor:function(b){a.Util.assign(this,b)},getType:a.Util.abstractMethod,getMatchedText:function(){return this.matchedText},getAnchorHref:a.Util.abstractMethod,getAnchorText:a.Util.abstractMethod}),a.match.Email=a.Util.extend(a.match.Match,{getType:function(){return"email"},getEmail:function(){return this.email},getAnchorHref:function(){return"mailto:"+this.email},getAnchorText:function(){return this.email}}),a.match.Twitter=a.Util.extend(a.match.Match,{getType:function(){return"twitter"},getTwitterHandle:function(){return this.twitterHandle},getAnchorHref:function(){return"https://twitter.com/"+this.twitterHandle},getAnchorText:function(){return"@"+this.twitterHandle}}),a.match.Url=a.Util.extend(a.match.Match,{urlPrefixRegex:/^(https?:\/\/)?(www\.)?/i,protocolRelativeRegex:/^\/\//,protocolPrepended:!1,getType:function(){return"url"},getUrl:function(){var a=this.url;return this.protocolRelativeMatch||this.protocolUrlMatch||this.protocolPrepended||(a=this.url="http://"+a,this.protocolPrepended=!0),a},getAnchorHref:function(){var a=this.getUrl();return a.replace(/&amp;/g,"&")},getAnchorText:function(){var a=this.getUrl();return this.protocolRelativeMatch&&(a=this.stripProtocolRelativePrefix(a)),this.stripPrefix&&(a=this.stripUrlPrefix(a)),a=this.removeTrailingSlash(a)},stripUrlPrefix:function(a){return a.replace(this.urlPrefixRegex,"")},stripProtocolRelativePrefix:function(a){return a.replace(this.protocolRelativeRegex,"")},removeTrailingSlash:function(a){return"/"===a.charAt(a.length-1)&&(a=a.slice(0,-1)),a}}),a});