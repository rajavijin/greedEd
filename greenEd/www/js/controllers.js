angular.module('starter.controllers', ['starter.services', 'monospaced.elastic', 'angularMoment'])

.controller('AppCtrl', function($scope, $rootScope, Auth) {
  $scope.logout = Auth.logout;
  if(user && $rootScope.updateMenu) {
    console.log("updating menu");
    $scope.menuLinks = Auth.getMenus();
    console.log("menu items", $scope.menuLinks);
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
  });
  $scope.user = user;
})

.controller("HmDashboardCtrl", function($scope, $state, $rootScope, myCache, $ionicModal, Auth, $ionicLoading) {
  var key = '';
  $scope.getMarksData = function(cache) {
    $scope.empty = false;
    $scope.dashboard = false;
    console.log("Filters", $rootScope.filters);
    if($rootScope.filters.educationyear >= 0)
      key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
    else key = false;
    if(key) {
      var mcache = myCache.get(key) || {};
      console.log("marks cache", mcache);
      if(cache && mcache["hm"]) {
        $scope.dashboard = true;
        $scope.$broadcast('scroll.refreshComplete');
        applyMarks(mcache["hm"]);
      } else {
        if(!mcache["hm"]) $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
        $scope.hmmarks = Auth.getMarks(key+"/hm");
        $scope.$broadcast('scroll.refreshComplete');
        $scope.dashboard = true;
        $scope.hmmarks.$loaded().then(function(alldata) {
          $ionicLoading.hide();
          var hm = {hm:alldata};
          myCache.put(key, hm);
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
    console.log("Filters", $rootScope.filters);
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
    console.log("Filters", $rootScope.filters);
    if($rootScope.filters.educationyear >= 0) {
      key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
      title += " "+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam] +" "+ $rootScope.filters.educationyears[$rootScope.filters.educationyear];
    }
    else key = false;
    $scope.title = title;
    console.log("Key", key);
    if(key) {
      var mcache = myCache.get(key) || {};
      if(mcache[$stateParams.class]) var classCache = mcache[$stateParams.class]["class"];
      else var classCache = false;
      console.log("marks cache", mcache);
      if(cache && classCache) {
        console.log("From cache", classCache);
        $scope.dashboard = true;
        $scope.$broadcast('scroll.refreshComplete');
        applyMarks(classCache);
      } else {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
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
    console.log("Marks", marks);
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
    console.log("Filters", $rootScope.filters);
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
    console.log("Filters", $rootScope.filters);
    if($rootScope.filters.educationyear >= 0) {
      key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
      title += $rootScope.filters.educationyears[$rootScope.filters.educationyear] +' '+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
    }
    else { key = false;}
    console.log("Key:", key);
    $scope.title = title;
    if(key) {
      var mcache = myCache.get(key) || {};
      console.log("marks cache", mcache);
      if(cache && mcache[$stateParams.uid]) {
        $scope.dashboard = true;
        $scope.$broadcast('scroll.refreshComplete');
        applyMarks(mcache[$stateParams.uid]);
      } else {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
        $scope.marks = Auth.getMarks(key+"/"+$stateParams.uid);
        $scope.$broadcast('scroll.refreshComplete');
        $scope.dashboard = true;
        $scope.marks.$loaded().then(function(alldata) {
          $ionicLoading.hide();
          var dmark = {};
          dmark[$stateParams.uid] = alldata;
          myCache.put(key, dmark);
          applyMarks(alldata);
        })
      }
    } else {
      $scope.$broadcast('scroll.refreshComplete');
      $scope.empty = true;
    }
  }

  var applyMarks = function(marks) {
    console.log("Marks", marks);
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
    $scope.tgradeConfig = {
      chart: {renderTo: 'tgrades',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
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
    console.log("Filters", $rootScope.filters);
    key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
    $scope.getMarksData(true);
    $scope.closeModal();
  }
})

.controller("StudentDashboardCtrl", function($scope, $state, $rootScope, $stateParams, Auth, myCache, $ionicLoading, $ionicModal) {
  var key = '';
  $scope.getMarksData = function(cache) {
    var title = $stateParams.name + " Student";
    console.log("Student-Name", $stateParams);
    $scope.empty = false;
    $scope.dashboard = false;
    console.log("Filters", $rootScope.filters);
    if($rootScope.filters.educationyear >= 0) {
      key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
      title += $rootScope.filters.educationyears[$rootScope.filters.educationyear] +' '+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam]; 
    }
    else { key = false; }
    console.log("Key:", key);
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
        console.log("cache available", mcache[$stateParams.class]);
        $scope.dashboard = true;
        $scope.$broadcast('scroll.refreshComplete');
        applyMarks(mcache[$stateParams.class][$stateParams.uid]);
      } else {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
        $scope.marks = Auth.getMarks(key+"/"+$stateParams.class+"/"+$stateParams.uid);
        $scope.$broadcast('scroll.refreshComplete');
        $scope.dashboard = true;
        $scope.marks.$loaded().then(function(alldata) {
          $ionicLoading.hide();
          var dmark = {};
          dmark[$stateParams.class] = {};
          dmark[$stateParams.class][$stateParams.uid] = alldata;
          myCache.put(key, dmark);
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
    console.log("Mark", v);
    subjectLabels = [];
    subjectMarks = [];
    for (var i in v.marks) {
      subjectLabels.push(i);
      var smark = {name:i, y:v.marks[i].mark, tip:v.marks[i].mark}
      if(v.marks[i].status == "Fail") {
        smark.color = '#ff6c60';
      }
      if(v.marks[i].status == "absent") {smark.tip = "Ab"; smark.name += " Absent"}
      subjectMarks.push(smark);
    };
    console.log("Checked Marks",subjectMarks);
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
    console.log("Filters", $rootScope.filters);
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
    console.log("Filters", $rootScope.filters);
    if($rootScope.filters.educationyear >= 0)
      key = $rootScope.filters.educationyears[$rootScope.filters.educationyear];
    else key = false;
    console.log("Key:", key);
    $scope.title = key + " " + $stateParams.name;
    if(key) {
      var mcache = myCache.get(key) || {};
      console.log("marks cache", mcache);
      if(cache && mcache[$stateParams.uid]) {
        $scope.dashboard = true;
        $scope.$broadcast('scroll.refreshComplete');
        applyMarks(mcache[$stateParams.uid]);
      } else {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
        $scope.marks = Auth.getMarks(key+"/"+$stateParams.uid);
        $scope.$broadcast('scroll.refreshComplete');
        $scope.dashboard = true;
        $scope.marks.$loaded().then(function(alldata) {
          $ionicLoading.hide();
          var dmark = {};
          dmark[$stateParams.uid] = alldata;
          myCache.put(key, dmark);
          applyMarks(alldata);
        })
      }
    } else {
      $scope.$broadcast('scroll.refreshComplete');
      $scope.empty = true;
    }
  }

  var applyMarks = function(marks) {
    console.log("marks", marks);
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
    console.log("Filters", $rootScope.filters);
    key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
    $scope.getMarksData(true);
    $scope.closeModal();
  }
})

.controller("AllClassesCtrl", function($scope, myCache, Auth) {
  var allusers = myCache.get("allusers");
  $scope.changeStatus = function() {$scope.filterStatus = !$scope.filterStatus};
  if(allusers) {
    if(allusers["allclasses"]) {
      $scope.status = true;
      $scope.classes = allusers["allclasses"];    
    } else {
      $scope.status = false;      
    }
  } else {
    Auth.getUsers().then(function(allusersfb) {
      if(allusersfb["allclasses"]) {
        $scope.status = true;
        $scope.classes = allusersfb["allclasses"];
      } else {
        $scope.status = false;        
      }
    })
  }
})

.controller("AllStudentsCtrl", function($scope, Auth, myCache) {
  $scope.title = "All Students";
  $scope.changeStatus = function() {$scope.filterStatus = !$scope.filterStatus};
  var allusers = myCache.get("allusers");
  console.log("all users in students", allusers);
  if(allusers) {
    if(allusers["allstudents"]) {
      $scope.status = true;
      $scope.students = allusers["allstudents"];    
    } else {
      $scope.status = false;      
    }
  } else {
    Auth.getUsers().then(function(allusersfb) {
      console.log("allusersfb", allusersfb);
      if(allusersfb["allstudents"]) {
        $scope.status = true;
        $scope.students = allusersfb["allstudents"];
      } else {
        $scope.status = false;        
      }
    })
  }
})

.controller("AllTeachersCtrl", function($scope, myCache, Auth) {
  var allusers = myCache.get("allusers");
  $scope.changeStatus = function() {$scope.filterStatus = !$scope.filterStatus};
  if(allusers) {
    if(allusers["allteachers"]) {
      $scope.status = true;
      $scope.teachers = allusers["allteachers"];    
    } else {
      $scope.status = false;      
    }
  } else {
    Auth.getUsers().then(function(allusersfb) {
      if(allusersfb["allteachers"]) {
        $scope.status = true;
        $scope.teachers = allusersfb["allteachers"];
      } else {
        $scope.status = false;        
      }
    })
  }
})

.controller("MarkStudentsCtrl", function($scope, $stateParams, myCache) {
  var cache = myCache.get($stateParams.filter);
  console.log("Main cache", cache);
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
  console.log("Cache", cache);
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

.controller('WallCtrl', function($scope, $state, $ionicModal, Auth) {
  $scope.empty = false;
  $scope.walls = Auth.wall(user.schoolid+'/wall');
  $scope.walls.$loaded().then(function(wall) {
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
/*
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

  $scope.showImage = function(index) {
    $scope.imageSrc = index;
    $scope.openModal();
  }*/
  $scope.like = function(wallid, action) {
    console.log("index", wallid);
    console.log("action", action);
    console.log("wall", $scope.walls[wallid]);
    console.log("Auth user like", user);
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
    console.log("updated", updated);
    /*if(MyService.online()) {
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
    }*/
  }
})

.controller('AddPostCtrl', function($scope, Auth, $state, $cordovaCamera) {
  $scope.walls = Auth.wall(user.schoolid+'/wall');
  $scope.priority = 0;
  $scope.walls.$loaded().then(function(data) {
    console.log("data", data[0]);
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
    console.log("Auth user", user);
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

.controller('MessagesCtrl', function($scope, $rootScope, $ionicLoading, $state, myCache, Auth) {
  var allmessages = Auth.getUserChatRooms();
  $scope.changeStatus = function() {$scope.filterStatus = !$scope.filterStatus};
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
      console.log("contacts", user);
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
      console.log("all users in students", allusers);
      if(allusers) {
        if(allusers["chatcontacts"]) {
          $scope.allcontacts = allusers["chatcontacts"];
        }
      } else {
        Auth.getUsers().then(function(allusers) {
          console.log("allfbusers", allusers);
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
    allmessages.$loaded().then(function(frchatrooms) {
      $scope.chatrooms = frchatrooms;
      console.log("chatrooms", $scope.chatrooms);
    });
  }

  $scope.toMessageBox = function(contact) {
    var chatroom = {};
    console.log("contact", contact);
    var message = {
      'from': user.name,
      'fromUid': user.uid,
      'to': contact.name,
      'toUid': contact.uid,
      'created': Date.now(),
      'type': contact.type,
    }
    var NewChat = function(action) {
      $scope.messages.$add(message).then(function(msnap) {
        console.log("msnap", msnap.key());
        var chatid = msnap.key();
        var rooms = {};
        console.log("allusers", allusers);
        froom = {chatid:chatid, notify:0, name: message.to, uid:message.toUid, type:message.type};
        chatrooms.child(message.fromUid).child(chatid).set(froom);
        if(message.type == "group") {
          var allusers = myCache.get("allusers");
          console.log("allusers", allusers);
          console.log("Message", message);
          hm = {chatid:chatid, notify:0, name: message.to, uid:message.toUid, type:message.type};
          chatrooms.child($scope.hm.uid).child(chatid).set(hm);
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
      console.log("data", data.val());
      if(!data.val()) {
        NewChat("set");
      } else {
        data.forEach(function(chatval) {
          var chatid = chatval.key();
          console.log("Chat id", chatid);
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
.controller('MessageBoxCtrl', function($scope, $rootScope, $state, $stateParams, MockService, $ionicActionSheet, $ionicPopup, $ionicScrollDelegate, $timeout, $interval, Auth, myCache) {
  var chatrooms = Auth.chatrooms();

  console.log("state Params MB", $stateParams);
  // mock acquiring data via $stateParams
  var allchats = Auth.getAllMessages($stateParams.chatid);
  console.log("All messages", allchats);

  $scope.toUser = {uid:$stateParams.toUid, name:$stateParams.to};
  $scope.user = { uid: user.uid, name: user.name};
    $scope.input = {
      message: localStorage['userMessage-' + $scope.toUser._id] || ''
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

    var getMessages = function() {
      allchats.child("messages").limitToLast(50).on('value', function(frmessages) {
        $scope.messages = frmessages.val() || [];
        console.log("updating messages");
        console.log("user uid", user.uid);
        console.log("chat id", $stateParams.chatid);
        console.log("state", $rootScope.state);
        if($rootScope.state == 'app.messagebox') {
          var updatechatrooms = Auth.chatrooms();
          updatechatrooms.child(user.uid).child($stateParams.chatid).child("notify").set(0);
        }
        $timeout(function() {
          viewScroll.scrollBottom();
        }, 100);
      })
    }

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
        localStorage.removeItem('userMessage-' + $scope.toUser._id);
      }
    });


    $scope.$watch('input.message', function(newValue, oldValue) {
      console.log('input.message $watch, newValue ' + newValue);
      if (!newValue) newValue = '';
      localStorage['userMessage-' + $scope.toUser._id] = newValue;
    });

  $scope.sendMessage = function(sendMessageForm) {
    var message = {
      toUid: $scope.toUser.uid,
      to: $scope.toUser.name,
      text: $scope.input.message
    };

    // if you do a web service call this will be needed as well as before the viewScroll calls
    // you can't see the effect of this in the browser it needs to be used on a real device
    // for some reason the one time blur event is not firing in the browser but does on devices
    keepKeyboardOpen();
    
    //MockService.sendMessage(message).then(function(data) {
    $scope.input.message = '';

    message.date = Date.now();
    message.name = user.name;
    message.userId = user.uid;
    message.type = $stateParams.type;

    console.log("Message", message);
    allchats.child("messages").push(message);
    if(message.type == "group") {
      chatrooms.orderByChild($stateParams.chatid).once('value', function(chatdata) {
        chatdata.forEach(function(chatroomdata) {
          var ckey = chatroomdata.key();          
          if(user.uid != ckey) {
            var val = chatroomdata.val();
            val[$stateParams.chatid].notify++;
            console.log("val", val);
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

.controller('AuthCtrl', function ($scope, $state, $rootScope, Auth, $ionicLoading, $ionicPopup) {
  if(localStorage.getItem("user")) {
    $state.go('app.messages', {}, {reload:true});
  }
  $scope.user = {
      email: "8951572125",
      password: "lm3oko6r"
  };
  $scope.login = function () {
    $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner></br>Authenticating...'});
    Auth.login($scope.user).then(function (user) {
      $state.go('app.wall', {}, {reload: true});
      $ionicLoading.hide();
      var filters = Auth.filters(user.schoolid);
      filters.$bindTo($rootScope, 'filters');
    }, function (error) {
      $ionicLoading.hide();
      console.log("error", error);
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
