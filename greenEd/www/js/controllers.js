angular.module('starter.controllers', ['starter.services'])

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
})

.controller("HmDashboardCtrl", function($scope, $state, $rootScope, myCache, $ionicModal, Auth, $ionicLoading) {
  var key = '';
  $scope.getMarksData = function(cache) {
    $scope.empty = false;
    $scope.dashboard = false;
    console.log("Filters", $rootScope.filters);
    if($rootScope.filters)
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
    $scope.empty = false;
    $scope.dashboard = false;
    console.log("Filters", $rootScope.filters);
    if($rootScope.filters)
      key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
    else key = false;
    if(key) {
      var mcache = myCache.get(key) || {};
      console.log("marks cache", mcache);
      if(cache && mcache[$stateParams.class]) {
        $scope.dashboard = true;
        $scope.$broadcast('scroll.refreshComplete');
        applyMarks(mcache[$stateParams.class]);
      } else {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
        $scope.marks = Auth.getMarks(key+"/"+$stateParams.class);
        $scope.$broadcast('scroll.refreshComplete');
        $scope.dashboard = true;
        $scope.marks.$loaded().then(function(alldata) {
          $ionicLoading.hide();
          var dmark = {}
          dmark[$stateParams.class] = alldata;
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
    $scope.cpassfailConfig = {
      chart: {renderTo: 'cpassfailstatus',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      title: {text:"Pass/Fail"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.markstudents", {filter:key,type:$stateParams.class,key:"passfail",val:event.point.name,});}}},pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [{name:"Pass", y:marks.pass},{name:"Fail", y:marks.fail}]}]
    };
    $scope.csubjectsConfig = {
      chart: {renderTo: 'csubjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subjects Pass/Fail"},tooltip:{pointFormat:'<span style="color:{point.color}">\u25CF</span> {point.category}: <b>{point.y}</b>'},plotOptions: {series:{cursor:'pointer',events:{click:function(event){console.log("Event", event); $state.go("app.markstudents", {filter:key,type:$stateParams.class,key:event.point.name,val:event.point.category});}}},column: {depth: 25,dataLabels: {enabled: true,format: '{point.y}'}}},
      xAxis: {categories: marks.allSubjects},
      yAxis: {title: {text: null}},
      series: [{name: 'Pass',data: marks.subjectPass},{name: 'Fail',data: marks.subjectFail}]
    }; 
    $scope.cgradeConfig = {
      chart: {renderTo: 'cgrades',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
      title: {text:"Grades"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.markstudents", {filter:key,type:$stateParams.class,key:"gradeUsers",val:event.point.name});}}},pie: {innerSize: 0,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
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
    $scope.empty = false;
    $scope.dashboard = false;
    console.log("Filters", $rootScope.filters);
    if($rootScope.filters)
      key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
    else key = false;
    console.log("Key:", key);
    $scope.title = $stateParams.name + " Teacher "+ key.replace("_", " "); 
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
    $scope.empty = false;
    $scope.dashboard = false;
    console.log("Filters", $rootScope.filters);
    if($rootScope.filters)
      key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
    else key = false;
    console.log("Key:", key);
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
      if(v.marks[i].level == "Fail") {
        smark.color = '#ff6c60';
      }
      if(v.marks[i].status == "absent") {smark.tip = "Ab"; smark.name += " Absent"}
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
    if($rootScope.filters)
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
  $scope.walls = Auth.wall(user.schoolid+'/wall');
  $scope.uid = user.uid;
  $scope.addwall = true;
  if(user.role == 'teacher') $scope.addwall = false;
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

.controller('AddPostCtrl', function($scope, Auth, $state) {
  $scope.walls = Auth.wall(user.schoolid+'/wall');
  $scope.priority = 0;
  $scope.walls.$loaded().then(function(data) {
    console.log("data", data[0]);
    if(data.length > 0) {
      $scope.priority = data[0].$priority - 1;
    }
  })  
  $scope.post = {};
  $scope.takePicture = function(type) {

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
      'pictures' : [],
      'like' : 0
    });
    $state.go('app.wall', {}, {reload:true});
  }
})

.controller('AuthCtrl', function ($scope, $state, $rootScope, Auth, $ionicLoading) {
  if(localStorage.getItem("user")) {
    $state.go('app.wall', {}, {reload:true});
  }
  $scope.user = {
      email: "8951572125@ge.com",
      password: "lm3oko6r"
  };
  $scope.login = function () {
    $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'})
    Auth.login($scope.user).then(function (user) {
      $state.go('app.wall', {}, {reload: true});
      $ionicLoading.hide();
      var filters = Auth.filters(user.schoolid);
      filters.$bindTo($rootScope, 'filters');
    }, function (error) {
      console.log("error", error);
      switch (error.code) {
        case "INVALID_EMAIL":
          console.log("The specified user account email is invalid.");
          break;
        case "INVALID_PASSWORD":
          console.log("The specified user account password is incorrect.");
          break;
        case "INVALID_USER":
          console.log("The specified user account does not exist.");
          break;
        default:
          console.log("Error logging user in:", error);
      }
    })
  };
});
