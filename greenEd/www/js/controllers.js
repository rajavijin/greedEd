angular.module('starter.controllers', ['starter.services', 'monospaced.elastic', 'angularMoment'])

.controller('AppCtrl', function($scope, $window, $rootScope, Auth) {
  $scope.logout = Auth.logout;
  if(user && $rootScope.updateMenu) {
    $scope.menuLinks = Auth.getMenus();
    $rootScope.updateMenu = false;
  }
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});
/*  if($rootScope.user.name = "Head Master a") {
    console.log("New Head master");
  }*/
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){ 
    $rootScope.state = toState.name;
    if(toState.name == "login") {
      $window.location.reload(true);
    }
  });
  $scope.user = user;
})

.controller("HmDashboardCtrl", function($scope, $state, $rootScope, myCache, $ionicModal, Auth, $ionicLoading) {
  var key = '';
  $scope.getMarksData = function(cache) {
    $scope.empty = false;
    $scope.dashboard = false;
    if($rootScope.filters.educationyear >= 0)
      key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
    else key = false;
    if(key) {
      var mcache = myCache.get(key) || {};
      if(cache && mcache["hm"]) {
        $scope.dashboard = true;
        $scope.$broadcast('scroll.refreshComplete');
        applyMarks(mcache["hm"]);
      } else {
        if(!mcache["hm"]) $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner></br>Fetching Marks...'});
        $scope.hmmarks = Auth.getMarks(key+"/hm");
        $scope.$broadcast('scroll.refreshComplete');
        $scope.dashboard = true;
        $scope.hmmarks.$loaded().then(function(alldata) {
          $ionicLoading.hide();
          mcache["hm"] = alldata;
          myCache.put(key, mcache);
          applyMarks(alldata);
        })
      }
    } else {
      $scope.$broadcast('scroll.refreshComplete');
      $scope.empty = true;
    }
  }

  var applyMarks = function(marks) {
    $scope.toppers = marks.toppers;
    $scope.passfailConfig = {
      chart: {renderTo: 'passfailstatus',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      title: {text:"Pass/Fail"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.markstudents", {filter:key,type:"hm",key:"passfail",val:event.point.name,});}}},pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [{name:"Pass", y:marks.pass},{name:"Fail", y:marks.fail}]}]
    };
    $scope.subjectsConfig = {
      chart: {renderTo: 'subjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subjects Pass/Fail"},tooltip:{pointFormat:'<span style="color:{point.color}">\u25CF</span> {point.category}: <b>{point.y}</b>'},plotOptions: {series:{cursor:'pointer',events:{click:function(event){console.log("Event", event); $state.go("app.markstudents", {filter:key,type:"hm",key:event.point.name,val:event.point.category});}}},column: {depth: 25,dataLabels: {enabled: true,format: '{point.y}'}}},
      xAxis: {categories: marks.allSubjects},
      yAxis: {title: {text: null}},
      series: [{name: 'Pass',data: marks.subjectPass},{name: 'Fail',data: marks.subjectFail}]
    }; 
    $scope.gradeConfig = {
      chart: {renderTo: 'grades',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
      title: {text:"Grades"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.markstudents", {filter:key,type:"hm",key:"gradeUsers",val:event.point.name});}}},pie: {innerSize: 0,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: marks.gradeData}]
    };
  }  
  $scope.getMarksData(true);
  $ionicModal.fromTemplateUrl('templates/dashboardFilters.html', {
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

  $scope.filterData = function() {
    $scope.openModal();
  }
  $scope.dashboardFilters = function() {
    key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
    $scope.getMarksData(true);
    $scope.closeModal();
  }
})

.controller("ClassDashboardCtrl", function($scope, $state, $stateParams, $rootScope, myCache, $ionicModal, Auth, $ionicLoading) {
  var key = '';
  $scope.getMarksData = function(cache) {
    var title = $stateParams.class;
    $scope.empty = false;
    $scope.dashboard = false;
    if($rootScope.filters.educationyear >= 0) {
      key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
      title += " "+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam] +" "+ $rootScope.filters.educationyears[$rootScope.filters.educationyear];
    }
    else key = false;
    $scope.title = title;
    if(key) {
      var mcache = myCache.get(key) || {};
      if(mcache[$stateParams.class]) var classCache = mcache[$stateParams.class]["class"];
      else var classCache = false;
      if(cache && classCache) {
        $scope.dashboard = true;
        $scope.$broadcast('scroll.refreshComplete');
        applyMarks(classCache);
      } else {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner></br>Fetching Marks...'});
        $scope.marks = Auth.getMarks(key+"/"+$stateParams.class+"/class");
        $scope.$broadcast('scroll.refreshComplete');
        $scope.dashboard = true;
        $scope.marks.$loaded().then(function(alldata) {
          $ionicLoading.hide();
          mcache[$stateParams.class] = {class:alldata};
          myCache.put(key, mcache);
          applyMarks(alldata);
        })
      }
    } else {
      $scope.$broadcast('scroll.refreshComplete');
      $scope.empty = true;
    }
  }
  var applyMarks = function(marks) {
    $scope.toppers = marks.toppers;
    $scope.cpassfailConfig = {
      chart: {renderTo: 'cpassfailstatus',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      title: {text:"Pass/Fail"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.markstudents", {filter:key,type:$stateParams.class+"_class",key:"passfail",val:event.point.name,});}}},pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [{name:"Pass", y:marks.pass},{name:"Fail", y:marks.fail}]}]
    };
    $scope.csubjectsConfig = {
      chart: {renderTo: 'csubjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subjects Pass/Fail"},tooltip:{pointFormat:'<span style="color:{point.color}">\u25CF</span> {point.category}: <b>{point.y}</b>'},plotOptions: {series:{cursor:'pointer',events:{click:function(event){console.log("Event", event); $state.go("app.markstudents", {filter:key,type:$stateParams.class+"_class",key:event.point.name,val:event.point.category});}}},column: {depth: 25,dataLabels: {enabled: true,format: '{point.y}'}}},
      xAxis: {categories: marks.allSubjects},
      yAxis: {title: {text: null}},
      series: [{name: 'Pass',data: marks.subjectPass},{name: 'Fail',data: marks.subjectFail}]
    }; 
    $scope.cgradeConfig = {
      chart: {renderTo: 'cgrades',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
      title: {text:"Grades"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.markstudents", {filter:key,type:$stateParams.class+"_class",key:"gradeUsers",val:event.point.name});}}},pie: {innerSize: 0,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: marks.gradeData}]
    };
  }  
  $scope.getMarksData(true);
  $ionicModal.fromTemplateUrl('templates/dashboardFilters.html', {
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

  $scope.filterData = function() {
    $scope.openModal();
  }
  $scope.dashboardFilters = function() {
    key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
    $scope.getMarksData(true);
    $scope.closeModal();
  }
})

.controller("TeacherDashboardCtrl", function($scope, $state, $rootScope, $stateParams, Auth, myCache, $ionicLoading, $ionicModal) {
  var key = '';
  $scope.getMarksData = function(cache) {
    var title = $stateParams.name + " Teacher"; 
    $scope.empty = false;
    $scope.dashboard = false;
    if($rootScope.filters.educationyear >= 0) {
      key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
      title += $rootScope.filters.educationyears[$rootScope.filters.educationyear] +' '+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
    }
    else { key = false;}
    $scope.title = title;
    if(key) {
      var mcache = myCache.get(key) || {};
      if(cache && mcache[$stateParams.uid]) {
        $scope.dashboard = true;
        $scope.$broadcast('scroll.refreshComplete');
        applyMarks(mcache[$stateParams.uid]);
      } else {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner></br>Fetching Marks...'});
        $scope.marks = Auth.getMarks(key+"/"+$stateParams.uid);
        $scope.$broadcast('scroll.refreshComplete');
        $scope.dashboard = true;
        $scope.marks.$loaded().then(function(alldata) {
          $ionicLoading.hide();
          mcache[$stateParams.uid] = alldata;
          myCache.put(key, mcache);
          applyMarks(alldata);
        })
      }
    } else {
      $scope.$broadcast('scroll.refreshComplete');
      $scope.empty = true;
    }
  }

  var applyMarks = function(marks) {
    $scope.toppers = marks.toppers;
    $scope.tpassfailConfig = {
      chart: {renderTo: 'tpassfailstatus',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      title: {text:"Pass/Fail"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.markstudents", {filter:key,type:$stateParams.uid,key:"passfail",val:event.point.name,});}}},pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [{name:"Pass", y:marks.pass},{name:"Fail", y:marks.fail}]}]
    };
    $scope.tsubjectsConfig = {
      chart: {renderTo: 'tsubjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subjects Pass/Fail"},tooltip:{pointFormat:'<span style="color:{point.color}">\u25CF</span> {point.category}: <b>{point.y}</b>'},plotOptions: {series:{cursor:'pointer',events:{click:function(event){console.log("Event", event); $state.go("app.markstudents", {filter:key,type:$stateParams.uid,key:event.point.name,val:event.point.category});}}},column: {depth: 25,dataLabels: {enabled: true,format: '{point.y}'}}},
      xAxis: {categories: marks.allSubjects},
      yAxis: {title: {text: null}},
      series: [{name: 'Pass',data: marks.subjectPass},{name: 'Fail',data: marks.subjectFail}]
    }; 
/*    $scope.tgradeConfig = {
      chart: {renderTo: 'tgrades',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
      title: {text:"Grades"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.markstudents", {filter:key,type:"hm",key:"gradeUsers",val:event.point.name});}}},pie: {innerSize: 0,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: marks.gradeData}]
    };*/
  }  
  $scope.getMarksData(true);
  $ionicModal.fromTemplateUrl('templates/dashboardFilters.html', {
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

  $scope.filterData = function() {
    $scope.openModal();
  }
  $scope.dashboardFilters = function() {
    key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
    $scope.getMarksData(true);
    $scope.closeModal();
  }
})

.controller("StudentDashboardCtrl", function($scope, $state, $rootScope, $stateParams, Auth, myCache, $ionicLoading, $ionicModal) {
  var key = '';
  $scope.getMarksData = function(cache) {
    var title = $stateParams.name + " Student";
    $scope.empty = false;
    $scope.dashboard = false;
    if($rootScope.filters.educationyear >= 0) {
      key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
      title += $rootScope.filters.educationyears[$rootScope.filters.educationyear] +' '+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam]; 
    }
    else { key = false; }
    $scope.title = title;
    if(key) {
      var mcache = myCache.get(key) || {};
      var mcacheStudent = false
      if(mcache[$stateParams.class]) {
        if(mcache[$stateParams.class][$stateParams.class]) {
          mcacheStudent = true;
        }
      }
      if(cache && mcacheStudent) {
        $scope.dashboard = true;
        $scope.$broadcast('scroll.refreshComplete');
        applyMarks(mcache[$stateParams.class][$stateParams.uid]);
      } else {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner></br>Fetching Marks...'});
        $scope.marks = Auth.getMarks(key+"/"+$stateParams.class+"/"+$stateParams.uid);
        $scope.$broadcast('scroll.refreshComplete');
        $scope.dashboard = true;
        $scope.marks.$loaded().then(function(alldata) {
          $ionicLoading.hide();
          if(!mcache[$stateParams.class]) mcache[$stateParams.class] = {};
          mcache[$stateParams.class][$stateParams.uid] = alldata;
          myCache.put(key, mcache);
          applyMarks(alldata);
        })
      }
    } else {
      $scope.$broadcast('scroll.refreshComplete');
      $scope.dashboard = false;
      $scope.empty = true;
    }
  }

  var applyMarks = function(v) {
    console.log("v", v);
    subjectLabels = [];
    subjectMarks = [];
    for (var i in v.marks) {
      subjectLabels.push(i);
      var smark = {name:i, y:v.marks[i].mark, tip:v.marks[i].mark}
      if(v.marks[i].status == "Fail") {
        smark.color = '#ff6c60';
      }
      if(v.marks[i].mark == 0) {smark.tip = "Ab"; smark.name += " Absent"}
      subjectMarks.push(smark);
    };
    $scope.ssubjectsConfig = {
      chart: {renderTo: 'ssubjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subject Marks"},plotOptions: {column: {depth: 25,showInLegend: false, dataLabels: {enabled: true,format: '{point.tip}'}, events: {legendItemClick: function () {return false;}}}},
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
    $scope.title = key.replace("_", " ") + " " + v.student;
  }
  $scope.getMarksData(true);
  $ionicModal.fromTemplateUrl('templates/dashboardFilters.html', {
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

  $scope.filterData = function() {
    $scope.openModal();
  }
  $scope.dashboardFilters = function() {
    key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
    $scope.getMarksData(true);
    $scope.closeModal();
  }
})

.controller("StudentOverallDashboardCtrl", function($scope, $stateParams, $rootScope, myCache, Auth, $ionicLoading, $ionicModal) {
  var key = '';
  $scope.getMarksData = function(cache) {
    $scope.empty = false;
    $scope.dashboard = false;
    if($rootScope.filters.educationyear >= 0)
      key = $rootScope.filters.educationyears[$rootScope.filters.educationyear];
    else key = false;
    $scope.title = key + " " + $stateParams.name;
    if(key) {
      var mcache = myCache.get(key) || {};
      if(cache && mcache[$stateParams.uid]) {
        $scope.dashboard = true;
        $scope.$broadcast('scroll.refreshComplete');
        applyMarks(mcache[$stateParams.uid]);
      } else {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner></br>Fetching Marks...'});
        $scope.marks = Auth.getMarks(key+"/"+$stateParams.uid);
        $scope.$broadcast('scroll.refreshComplete');
        $scope.dashboard = true;
        $scope.marks.$loaded().then(function(alldata) {
          $ionicLoading.hide();
          mcache[$stateParams.uid] = alldata;
          myCache.put(key, mcache);
          applyMarks(alldata);
        })
      }
    } else {
      $scope.$broadcast('scroll.refreshComplete');
      $scope.empty = true;
    }
  }

  var applyMarks = function(marks) {
    var allsubjectData = [];
    for (var i = 0; i < marks.allSubjects.length; i++) {
      allsubjectData.push({name: marks.allSubjects[i], data: marks.subjectDataMarks[marks.allSubjects[i]]});
    };
    $scope.somarksConfig = {
      chart: {renderTo: 'somarks',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Percentage"},plotOptions: {column: {depth: 25,showInLegend: false, dataLabels: {enabled: true,format: '{point.y}%'},events: {legendItemClick: function () {return false;}}},allowPointSelect: false},
      xAxis: {categories: marks.examLabels},
      yAxis: {title: {text: null}},
      series: [{name: 'Percentage',data: marks.allMarks}]
    };
    $scope.allmarksConfig = {
      chart: {renderTo: 'allmarks',type: 'line', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Total Mark"},plotOptions: {line: {dataLabels: {enabled: true},showInLegend: false,enableMouseTracking: false,events: {legendItemClick: function () {return false;}}}},
      xAxis: {categories: marks.examLabels},
      yAxis: {title: {text: null}},
      series: [{name: 'Total',data: marks.allMarks}]
    };    
    $scope.sosubjectsConfig = {
      chart: {renderTo: 'sosubjects',type: 'spline', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subjects"},tooltip:{pointFormat:'{point.y}'},plotOptions: {spline: {depth: 25,dataLabels: {enabled: true,format: '{point.y}'}}},
      xAxis: {categories: marks.examLabels},
      yAxis: {title: {text: null}},
      series: allsubjectData
    };
    $scope.ranksConfig = {
      chart: {renderTo: 'ranks',type: 'line', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Rank"},plotOptions: {line: {dataLabels: {enabled: true},showInLegend: false,enableMouseTracking: false,events: {legendItemClick: function () {return false;}}}},
      xAxis: {categories: marks.examLabels},
      yAxis: {title: {text: null},tickInterval: 1, min: 0,},
      series: [{name: 'Rank',data: marks.ranks}]
    }; 
/*    $scope.opassfailConfig = {
      chart: {renderTo: 'opassfail',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      title: {text:"Total Pass/Fail"},plotOptions: {pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [["Pass", marks.pass],["Fail", marks.fail]]}]
    };   */     
    var attendance = [];
    for (var i = 0; i < marks.attendance.length; i++) {
      attendance.push(parseInt(marks.attendance[i]));
    };
    $scope.soattendanceConfig = {
      chart: {renderTo: 'soattendance',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Attendance"},plotOptions: {column: {depth: 25,showInLegend: false, dataLabels: {enabled: true,format: '{point.y}%'},events: {legendItemClick: function () {return false;}}},allowPointSelect: false},
      xAxis: {categories: marks.examLabels},
      yAxis: {title: {text: null}, max:100},
      series: [{name: 'Attendance',data: attendance}]
    };
  }
  $scope.getMarksData(true);
  $scope.noexams = true;
  $ionicModal.fromTemplateUrl('templates/dashboardFilters.html', {
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

  $scope.filterData = function() {
    $scope.openModal();
  }
  $scope.dashboardFilters = function() {
    key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
    $scope.getMarksData(true);
    $scope.closeModal();
  }
})

.controller("AllClassesCtrl", function($scope, myCache, Auth, $ionicLoading, $timeout) {
  var allusers = myCache.get("allusers");
  $scope.changeStatus = function() {$scope.filterStatus = !$scope.filterStatus;$timeout(function() {document.body.querySelector(".search").focus();}, 100);};
  $scope.fetchData = function(refresh) {
    Auth.getUsers().then(function(allusersfb) {
      $ionicLoading.hide();
      if(refresh) $scope.$broadcast('scroll.refreshComplete');
      if(allusersfb["allclasses"]) {
        $scope.status = true;
        $scope.classes = allusersfb["allclasses"];
      } else {
        $scope.status = false;        
      }
    })
  }
  if(allusers) {
    if(allusers["allclasses"]) {
      $scope.status = true;
      $scope.classes = allusers["allclasses"];    
    } else {
      $scope.status = false;      
    }
  } else {
    $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner></br>Fetching Classes...'});
    $scope.fetchData(false);
  }
})

.controller("AllStudentsCtrl", function($scope, Auth, myCache, $ionicLoading, $timeout) {
  $scope.title = "All Students";
  $scope.changeStatus = function() {$scope.filterStatus = !$scope.filterStatus;$timeout(function() {document.body.querySelector(".search").focus();}, 100);};
  $scope.fetchData = function(refresh) {
    Auth.getUsers().then(function(allusersfb) {
      $ionicLoading.hide();
      if(refresh) $scope.$broadcast('scroll.refreshComplete');
      if(allusersfb["allstudents"]) {
        $scope.status = true;
        $scope.students = allusersfb["allstudents"];
      } else {
        $scope.status = false;        
      }
    })
  }
  var allusers = myCache.get("allusers");
  if(allusers) {
    if(allusers["allstudents"]) {
      $scope.status = true;
      $scope.students = allusers["allstudents"];    
    } else {
      $scope.status = false;      
    }
  } else {
    $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner></br>Fetching Students...'});
    $scope.fetchData(false);
  }
})

.controller("AllTeachersCtrl", function($scope, myCache, Auth, $ionicLoading, $timeout) {
  var allusers = myCache.get("allusers");
  $scope.changeStatus = function() {$scope.filterStatus = !$scope.filterStatus;$timeout(function() {document.body.querySelector(".search").focus();}, 100);};
  $scope.fetchData = function(refresh) {
    Auth.getUsers().then(function(allusersfb) {
      $ionicLoading.hide();
      if(refresh) $scope.$broadcast('scroll.refreshComplete');
      if(allusersfb["allteachers"]) {
        $scope.status = true;
        $scope.teachers = allusersfb["allteachers"];
      } else {
        $scope.status = false;        
      }
    })
  } 
  if(allusers) {
    if(allusers["allteachers"]) {
      $scope.status = true;
      $scope.teachers = allusers["allteachers"];    
    } else {
      $scope.status = false;      
    }
  } else {
    $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner></br>Fetching Teachers...'});
    $scope.fetchData(true);
  }
})

.controller("MarkStudentsCtrl", function($scope, $stateParams, myCache, $timeout) {
  $scope.changeStatus = function() {$scope.filterStatus = !$scope.filterStatus;$timeout(function() {document.body.querySelector(".search").focus();}, 100);};
  var cache = myCache.get($stateParams.filter);
  var title = $stateParams.filter.replace("_", " ") + " ";
  if($stateParams.type.indexOf("student") != -1) {
    var type = $stateParams.type.split("_");
    var cache = cache[type[1]][type[2]];
  }  else if ($stateParams.type.indexOf("class") != -1) {
    var type = $stateParams.type.split("_");
    var cache = cache[type[0]][type[1]];
  } else {
    var cache = cache[$stateParams.type];
  }
  var users = [];
  if($stateParams.key == "passfail") {
    users = cache[$stateParams.val];
    title += $stateParams.val;
  } else if (($stateParams.key == "Pass") || ($stateParams.key == "Fail")) {
    users = cache["subject"+$stateParams.key+"Users"][$stateParams.val];
    title += $stateParams.val + " " + $stateParams.key;
  } else {
    users = cache[$stateParams.key][$stateParams.val];
    title += $stateParams.val;
  }
  $scope.title = title;
  if(users) {
    $scope.allStudentsStatus = true;
    $scope.users = users;
  } else {
    $scope.allStudentsStatus = false;
  }
})

.controller('WallCtrl', function($scope, $state, $ionicModal, Auth, $ionicLoading) {
  $scope.empty = false;
  $scope.walls = Auth.wall(user.schoolid+'/wall');
  $ionicLoading.show({template:"<ion-spinner icon='lines' class='spinner-calm'></ion-spinner></br>Fetching Wall..."})
  $scope.walls.$loaded().then(function(wall) {
    $ionicLoading.hide();
    if(wall.length == 0) $scope.empty = true;
  });
  $scope.uid = user.uid;
  $scope.addwall = true;
  if(user.role == 'parent') $scope.addwall = false;
  $scope.addpost = function() {
    $state.go('app.addpost', {});
  }
  $scope.getWall = function() {
    $scope.walls = Auth.wall(user.schoolid+'/wall');
    $scope.$broadcast('scroll.refreshComplete');
  }

  $scope.like = function(wallid, action) {
    var update = {};
    update.like = $scope.walls[wallid].like;
    update.likeuids = ($scope.walls[wallid].likeuids) ? $scope.walls[wallid].likeuids : [];
    if(action == 'like') {
      update.like++;
      update.likeuids.push(user.uid);
    } else {
      update.like--;
      var uidindex = update.likeuids.indexOf(user.uid);
      update.likeuids.splice(uidindex);
    }
    var updated = Auth.updateWall(user.schoolid+'/wall/'+$scope.walls[wallid].$id, update);
  }
})

.controller('AddPostCtrl', function($scope, Auth, $state, $cordovaCamera) {
  $scope.walls = Auth.wall(user.schoolid+'/wall');
  $scope.priority = -1;
  $scope.walls.$loaded().then(function(data) {
    if(data.length > 0) {
      $scope.priority = data[0].$priority - 1;
    }
  })  
  $scope.post = {};
  $scope.post.pictures = [];
  $scope.takePicture = function(type) {
    var options = {
        quality : 75,
        destinationType : Camera.DestinationType.DATA_URL,
        sourceType : Camera.PictureSourceType.CAMERA,
        encodingType: Camera.EncodingType.JPEG,
        popoverOptions: CameraPopoverOptions,
        targetWidth: 500,
        targetHeight: 500,
        saveToPhotoAlbum: false
    };
    if(type == "browse") options.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
    $cordovaCamera.getPicture(options).then(function(imageData) {
        $scope.post.pictures.push(imageData);
    }, function(error) {
        console.error(error);
    });    
  }
  $scope.viewWall = function() {
    $state.go('app.wall', {});
  }
  $scope.submit = function() {
    var uid = user.uid;
    $scope.walls.$add({
      'name' : user.name,
      'uid' : uid,
      'date' : Date.now(),
      'text' : $scope.post.message,
      '$priority' : $scope.priority,
      'likeuids' : [],
      'pictures' : $scope.post.pictures,
      'like' : 0
    });
    $state.go('app.wall', {}, {reload:true});
  }
})

.controller('MessagesCtrl', function($scope, $rootScope, $ionicLoading, $state, myCache, Auth, $timeout) {
  $scope.title = "Chats";
  var allmessages = Auth.getUserChatRooms();
  $scope.changeStatus = function() {$scope.filterStatus = !$scope.filterStatus;$timeout(function() {document.body.querySelector(".search").focus();}, 200);};
  $scope.messages = Auth.chats();
  var chatrooms = Auth.chatrooms();
  var contacts = [];
  if(user.role != "hm") {
    var hm = Auth.getHm();
    hm.once('value', function(hmsnap) {
      hmsnap.forEach(function(hmdata) {
        var hmval = hmdata.val();
        var hmcontact = {uid:hmdata.key()};
        hmcontact.role = "hm";
        hmcontact.name = hmval.name;
        hmcontact.type = "single";
        contacts.push(hmcontact);
        $scope.hm = hmcontact;
      })
    })
  }
  $scope.getUsers = function() {
    $scope.title = "Contacts";
    contacts = [];
    if(user.role == "parent") {
      for (var i = 0; i < user.students.length; i++) {
        for(var ss in user.students[i]) {
          if(ss.indexOf("simplelogin") != -1) {
            var contact = {};
            contact.uid = ss;
            var teacher = user.students[i][ss].split("_");
            contact.name = teacher[0] + " " + teacher[1] +" "+user.students[i].standard+"-"+user.students[i].division;
            contact.role = "teacher";
            contact.type = "single";
            contacts.push(contact);
          }
        }
      };
      if($scope.hm) contacts.push($scope.hm);
      $scope.allcontacts = contacts;
    } else {
      var allusers = myCache.get("allusers");
      if(allusers) {
        if(allusers["chatcontacts"]) {
          $scope.allcontacts = allusers["chatcontacts"];
        }
      } else {
        Auth.getUsers().then(function(allusers) {
          if(allusers["chatcontacts"]) {
            if(user.role == "teacher") allusers["chatcontacts"].push($scope.hm);
            $scope.allcontacts = allusers["chatcontacts"];
          }
        })
      }
    }
    $scope.$broadcast('scroll.refreshComplete');
  }

  $scope.getMessages = function() {
    $scope.title = "Chats";
    allmessages.on('value', function(frchatrooms) {
      console.log("chatrooms", frchatrooms.val());
      var allmess = [];
      frchatrooms.forEach(function(mess) {
        allmess.push(mess.val());
      })
      $scope.chatrooms = allmess;
    });
  }

  $scope.toMessageBox = function(contact) {
    var chatroom = {};
    var fromName = user.name;
    if(user.role == "parent") {
      fromName = "Parent of ";
      for (var si = 0; si < user.students.length; si++) {
        fromName += (si == 0) ? user.students[si].name : ","+user.students[si].name;
      };
    }
    var message = {
      'from': fromName,
      'fromUid': user.uid,
      'to': contact.name,
      'toUid': contact.uid,
      'created': Date.now(),
      'type': contact.type,
    }
    var NewChat = function(action) {
      $scope.messages.$add(message).then(function(msnap) {
        var chatid = msnap.key();
        var rooms = {};
        froom = {chatid:chatid, notify:0, name: message.to, uid:message.toUid, type:message.type};
        chatrooms.child(message.fromUid).child(chatid).set(froom);
        if(message.type == "group") {
          var allusers = myCache.get("allusers");
          if(user.role != "hm") {
            hm = {chatid:chatid, notify:0, name: message.to, uid:message.toUid, type:message.type};
            chatrooms.child($scope.hm.uid).child(chatid).set(hm);
          }
          for (var i = 0; i < allusers["groups"][message.toUid].length; i++) {
            var classStudent = allusers["groups"][message.toUid][i];
            rooms = {chatid:chatid, notify:0, name: message.to, uid:message.toUid, type:message.type};
            chatrooms.child(classStudent.uid).child(chatid).set(rooms);
          };
        } else {
          rooms = {chatid:chatid, notify:0, name: message.from, uid: message.fromUid, type:message.type};
          chatrooms.child(message.toUid).child(chatid).set(rooms);
        }
        $state.go('app.messagebox', {chatid:chatid, to:contact.name, toUid:contact.uid,  type:message.type});
      })
    }
    chatrooms.child(message.fromUid).orderByChild("uid").equalTo(message.toUid).once('value', function(data) {
      if(!data.val()) {
        NewChat("set");
      } else {
        data.forEach(function(chatval) {
          var chatid = chatval.key();
          if(chatid) {
            $state.go('app.messagebox', {chatid:chatid, toUid:message.toUid, to:message.to, type:message.type});
          } else {
            NewChat("update");
          }
        })
      }
    });
  }
})
.controller('MessageBoxCtrl', function($scope, $rootScope, $state, $stateParams, $ionicActionSheet, $ionicPopup, $ionicScrollDelegate, $timeout, $interval, Auth, myCache) {
  var chatrooms = Auth.chatrooms();
  var allchats = Auth.getAllMessages($stateParams.chatid);

  $scope.toUser = {uid:$stateParams.toUid, name:$stateParams.to};
  var fromName = user.name;
  if(user.role == "parent") {
    fromName = "Parent of ";
    for (var si = 0; si < user.students.length; si++) {
      fromName += (si == 0) ? user.students[si].name : ","+user.students[si].name;
    };
  }
  $scope.user = { uid: user.uid, name: fromName};
    $scope.input = {
      message: localStorage['userMessage-' + $scope.toUser._id] || ''
    };

    var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    var footerBar; // gets set in $ionicView.enter
    var scroller;
    var txtInput; // ^^^

    $scope.$on('$ionicView.enter', function() {
      getMessages();
      $timeout(function() {
        footerBar = document.body.querySelector('#userMessagesView .bar-footer');
        scroller = document.body.querySelector('#userMessagesView .scroll-content');
        txtInput = angular.element(footerBar.querySelector('textarea'));
      }, 0);

    });

    var getMessages = function() {
      allchats.child("messages").limitToLast(50).on('value', function(frmessages) {
        $scope.messages = frmessages.val() || [];
        if($rootScope.state == 'app.messagebox') {
          var updatechatrooms = Auth.chatrooms();
          updatechatrooms.child(user.uid).child($stateParams.chatid).child("notify").set(0);
        }
        $timeout(function() {
          viewScroll.scrollBottom();
        }, 100);
      })
    }

  $scope.sendMessage = function(sendMessageForm) {
    var message = {
      toUid: $scope.toUser.uid,
      to: $scope.toUser.name,
      text: $scope.input.message
    };

    keepKeyboardOpen();
    $scope.input.message = '';

    message.date = Date.now();
    message.name = fromName;
    message.userId = user.uid;
    message.type = $stateParams.type;

    allchats.child("messages").push(message);
    if(message.type == "group") {
      chatrooms.orderByChild($stateParams.chatid).once('value', function(chatdata) {
        chatdata.forEach(function(chatroomdata) {
          var ckey = chatroomdata.key();          
          if(user.uid != ckey) {
            var val = chatroomdata.val();
            val[$stateParams.chatid].notify++;
            chatrooms.child(ckey).update(val);
          }
        })
      });
    } else {
      chatrooms.child(message.toUid).child($stateParams.chatid).once('value', function(data) {
        var roomdata = data.val();
        roomdata.notify++;
        chatrooms.child($scope.toUser.uid).child($stateParams.chatid).set(roomdata);
      })
    }

      $timeout(function() {
        keepKeyboardOpen();
        viewScroll.scrollBottom(true);
      }, 0);
    };
    
    function keepKeyboardOpen() {
      txtInput.one('blur', function() {
        txtInput[0].focus();
      });
    }
 
    $scope.$on('taResize', function(e, ta) {
      if (!ta) return;
      
      var taHeight = ta[0].offsetHeight;
      
      if (!footerBar) return;
      
      var newFooterHeight = taHeight + 10;
      newFooterHeight = (newFooterHeight > 44) ? newFooterHeight : 44;
      
      footerBar.style.height = newFooterHeight + 'px';
      scroller.style.bottom = newFooterHeight + 'px'; 
    });
})
.controller('AccountCtrl', function($scope) {
  console.log("User", user);
  $scope.user = user;
})
.controller('TimetableCtrl', function($scope, $ionicSideMenuDelegate, $stateParams, Auth, $ionicSlideBoxDelegate ) {
  $scope.getTimetable = function() {
    var tref = Auth.getTimetable($stateParams.id);
    tref.on('value', function(tdata) {
      var timetable = tdata.val() || {};
      $scope.data = {
        numViewableSlides : Object.keys(timetable).length,
        slideIndex : 0,
        initialInstruction : true,
        secondInstruction : false,
        slides: timetable,
      };
      var defaultVal = timetable[Object.keys(timetable)[0]];
      var first = true;
      for(var dd in defaultVal) {
        if(first) {
          $scope.title = defaultVal[dd].day;
          first = false;
        }
      }
      $scope.$apply();
    })
  }
  $scope.getTimetable();
  if($stateParams.id.indexOf("simplelogin") == -1) {
    $scope.classStatus = false;
  } else {
    $scope.classStatus = true;
  }
  $ionicSideMenuDelegate.$getByHandle('right-menu').canDragContent(false);
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
  var daysIndex = function(index) {
    var days = ["monday","tuesday","wednesday","thursday","friday","saturday"];
    return days[index];
  }
  // Called each time the slide changes
  $scope.slideChanged = function(index) {
    $scope.data.slideIndex = index;
    $scope.title = daysIndex(index);
  };

})
.controller('AuthCtrl', function ($scope, $state, $rootScope, Auth, $ionicLoading, $ionicPopup, $ionicModal) {
  if(localStorage.getItem("user")) {
    $state.go('app.wall', {}, {reload:true});
  }
  $scope.user = {
    username: '',
    password: '',
  }
  $scope.users = [
  {
    title: 'Head Master',
    username: "8951572125",
    password: '03jfko6r'
  },
  {
    title: 'Class Teacher',
    username: "9496255106",
    password: "bwlba9k9"
  },
  {
    title: 'Subject Teacher',
    username: "9496255108",
    password: "byrmgqfr"
  },
  {
    title: "Parent",
    username: "9944711022",
    password: "7p6wdn29"
  }];
  $scope.fillUser = function(modal, username, password) {
    modal.hide();
    $scope.user = {
      username: username,
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
  $scope.login = function () {
    $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner></br>Authenticating...'});
    $scope.user.email = $scope.user.username + "@ge.com";
    Auth.login($scope.user).then(function (user) {
      $state.go('app.wall', {}, {reload: true});
      $ionicLoading.hide();
      var filters = Auth.filters(user.schoolid);
      filters.$bindTo($rootScope, 'filters');
    }, function (error) {
      $ionicLoading.hide();
      var msg = error;
      switch (error.code) {
        case "INVALID_EMAIL":
          msg = "The specified user account email is invalid.";
          break;
        case "INVALID_PASSWORD":
          msg = "The specified user account password is incorrect.";
          break;
        case "INVALID_USER":
          msg = "The specified user account does not exist.";
          break;
        default:
          msg = "Error logging user in:";
      }
      $ionicPopup.alert({title: 'Login Failed',template: msg});
    })
  };
})

// fitlers
.filter('nl2br', ['$filter',
  function($filter) {
    return function(data) {
      if (!data) return data;
      return data.replace(/\n\r?/g, '<br />');
    };
  }
])
// configure moment relative time
moment.locale('en', {
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "%d sec",
    m: "a min",
    mm: "%d min",
    h: "hr",
    hh: "%d hrs",
    d: "day",
    dd: "%d days",
    M: "mon",
    MM: "%d months",
    y: "a year",
    yy: "%d years"
  }
});

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