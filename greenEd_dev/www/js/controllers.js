angular.module('starter.controllers', ['starter.services', 'monospaced.elastic', 'angularMoment'])

.controller('AppCtrl', function($scope, $window, $rootScope, Auth, $state, $ionicLoading, $timeout) {
  $scope.logout = function() {
    Auth.logout();
    $state.go("login");
  }
  if(user) {
    $scope.menuLinks = Auth.getMenus();
  } else {
    $state.go("login");
  }
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, rejection){
    $rootScope.fromState = fromState.name;
    $rootScope.currentState = toState.name;
    if(toState.name == "login") {
      $timeout(function() { $ionicLoading.hide();$window.location.reload(true);}, 1500);
    }
  });
  $scope.user = user;
})

.controller("HmDashboardCtrl", function($scope, $state, $cordovaSQLite, $rootScope, myCache, $ionicModal, Auth, $ionicLoading, $timeout) {
  var key = '';
  var save = true;
  $scope.getMarksData = function() {
    $scope.empty = false;
    $scope.dashboard = false;
    if(filters) key = filters.educationyears[filters.educationyear] +'_'+ filters.typeofexams[filters.typeofexam];
    else key = false;
    if(key) {
      $scope.title = filters.typeofexams[filters.typeofexam] +' '+ filters.educationyears[filters.educationyear];
      if(online) {
        serverData(key);
      } else {
        if(db) localData(key);
        else empty();
      }
    } else { empty(); }
  }
  var localData = function(key) {
    $cordovaSQLite.execute(db, "SELECT value from mydata where key = ?", [key+"/hm"]).then(function(res) {
      if(res.rows.length > 0) {
        $scope.dashboard = true;
        applyMarks(angular.fromJson(res.rows.item(0).value));
      } else {
        if(online) serverData(key);
        else $scope.empty = true;
      }
      $scope.$broadcast('scroll.refreshComplete');
    });
  }
  var empty = function() {
    $scope.title = "Hm Dashboard";
    $scope.$broadcast('scroll.refreshComplete');
    $scope.empty = true;
  }
  var serverData = function(key) {
    $scope.dashboard = true;
    $scope.loading = true;
    Auth.getMarks(key+"/hm").$ref().on('value', function(fbdata) {
      $scope.loading = false;
      $scope.$broadcast('scroll.refreshComplete');
      var falldata = fbdata.val();
      if(falldata) {
        var fkey = fbdata.ref().parent().key() + "/" + fbdata.key();
        save = true;
        applyMarks(falldata, fkey);
      } else { empty(); }
    })
  }
  var applyMarks = function(marks, fkey) {
    $scope.toppers = marks.toppers;
    $scope.passfailConfig = {
      chart: {renderTo: 'passfailstatus',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      title: {text:"Pass/Fail"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.markstudents", {filter:key,type:"hm",key:"passfail",val:event.point.name,});}}},pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [{name:"Pass", y:marks.pass},{name:"Fail", y:marks.fail}]}]
    };
    $scope.subjectsConfig = {
      chart: {renderTo: 'subjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subjects Pass/Fail"},
      tooltip:{pointFormat:'<span style="color:{point.color}">\u25CF</span> {point.category}: <b>{point.y}</b>'},
      plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.markstudents", {filter:key,type:"hm",key:event.point.name,val:event.point.category});}}},
      column: {events:{legendItemClick: function () {if(isIOS) {var st = this.visible ? 'hide' : 'show';if (!confirm('Do you want to '+st+' '+this.name+' data?')) {return false;}}}}, depth: 25,dataLabels: {enabled: true,format: '{point.y}'}}},
      xAxis: {categories: marks.allSubjects},
      yAxis: {title: {text: null}},
      series: [{name: 'Pass',data: marks.subjectPass},{name: 'Fail',data: marks.subjectFail}]
    }; 
    $scope.gradeConfig = {
      chart: {renderTo: 'grades',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
      title: {text:"Grades"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.markstudents", {filter:key,type:"hm",key:"gradeUsers",val:event.point.name});}}},pie: {innerSize: 0,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: marks.gradeData}]
    };
    if(online && db && save) {save = false; Auth.saveLocal(fkey, marks);};
  }  
  $scope.getMarksData();
  $scope.filters = filters;
  $ionicModal.fromTemplateUrl('templates/dashboardFilters.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.openModal = function() {$scope.modal.show();};
  $scope.closeModal = function() {$scope.modal.hide();};
  $scope.filterData = function() {$scope.openModal();}
  $scope.dashboardFilters = function() {
    filters = $scope.filters;
    save = true;
    $scope.getMarksData();
    $scope.closeModal();
  }
})

.controller("ClassDashboardCtrl", function($scope, $state, $stateParams, $rootScope, $cordovaSQLite, $ionicModal, Auth, $ionicLoading) {
  var key = '';
  var save = true;
  $scope.getMarksData = function() {
    $scope.empty = false;
    $scope.dashboard = false;
    if(filters) key = filters.educationyears[filters.educationyear] +'_'+ filters.typeofexams[filters.typeofexam];
    else key = false;
    if(key) {
      $scope.title = $stateParams.class +" "+ filters.typeofexams[filters.typeofexam] +' '+ filters.educationyears[filters.educationyear];
      if(online) {
        serverData(key);
      } else {
        if(db) localData(key);
        else empty();
      }
    } else { empty(); }
  }
  var localData = function(key) {
    $cordovaSQLite.execute(db, "SELECT value from mydata where key = ?", [key+"/"+$stateParams.class+"/class"]).then(function(res) {
      if(res.rows.length > 0) {
        $scope.dashboard = true;
        applyMarks(angular.fromJson(res.rows.item(0).value));
      } else {
        if(online) serverData(key);
        else $scope.empty = true;
      }
      $scope.$broadcast('scroll.refreshComplete');
    });
  }
  var empty = function() {
    $scope.title = $stateParams.class + " Dashboard";
    $scope.$broadcast('scroll.refreshComplete');
    $scope.empty = true;
  }

  var serverData = function(key) {
    $scope.dashboard = true;
    $scope.loading = true;
    Auth.getMarks(key+"/"+$stateParams.class+"/class").$ref().on('value', function(fbdata) {
      $scope.$broadcast('scroll.refreshComplete');
      $scope.loading = false;
      var falldata = fbdata.val();
      if(falldata) {
        var fkey = fbdata.ref().parent().parent().key() + "/" + fbdata.ref().parent().key() + "/" + fbdata.key();
        applyMarks(falldata, fkey);       
      } else {empty();}
    })
  }
  var applyMarks = function(marks, fkey) {
    $scope.toppers = marks.toppers;
    $scope.cpassfailConfig = {
      chart: {renderTo: 'cpassfailstatus',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      title: {text:"Pass/Fail"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){if(user.role != "parent") $state.go("app.markstudents", {filter:key,type:$stateParams.class+"_class",key:"passfail",val:event.point.name});}}},pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [{name:"Pass", y:marks.pass},{name:"Fail", y:marks.fail}]}]
    };
    $scope.csubjectsConfig = {
      chart: {renderTo: 'csubjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subjects Pass/Fail"},tooltip:{pointFormat:'<span style="color:{point.color}">\u25CF</span> {point.category}: <b>{point.y}</b>'},plotOptions: {series:{cursor:'pointer',events:{click:function(event){if(user.role != "parent") $state.go("app.markstudents", {filter:key,type:$stateParams.class+"_class",key:event.point.name,val:event.point.category});}}},column: {events:{legendItemClick: function () {if(isIOS) {var st = this.visible ? 'hide' : 'show';if (!confirm('Do you want to '+st+' '+this.name+' data?')) {return false;}}}},depth: 25,dataLabels: {enabled: true,format: '{point.y}'}}},
      xAxis: {categories: marks.allSubjects},
      yAxis: {title: {text: null}},
      series: [{name: 'Pass',data: marks.subjectPass},{name: 'Fail',data: marks.subjectFail}]
    }; 
    $scope.cgradeConfig = {
      chart: {renderTo: 'cgrades',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
      title: {text:"Grades"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){if(user.role != "parent") $state.go("app.markstudents", {filter:key,type:$stateParams.class+"_class",key:"gradeUsers",val:event.point.name});}}},pie: {innerSize: 0,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: marks.gradeData}]
    };
    if(online && db && save) {save = false; Auth.saveLocal(fkey, marks);};
  }  
  $scope.getMarksData();
  $scope.filters = filters;
  $ionicModal.fromTemplateUrl('templates/dashboardFilters.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.openModal = function() {$scope.modal.show();};
  $scope.closeModal = function() {$scope.modal.hide();};
  $scope.filterData = function() {$scope.openModal();}
  $scope.dashboardFilters = function() {
    filters = $scope.filters;
    save = true;
    $scope.getMarksData();
    $scope.closeModal();
  }
})

.controller("TeacherDashboardCtrl", function($scope, $state, $rootScope, $stateParams, Auth, $cordovaSQLite, $ionicLoading, $ionicModal) {
  var key = '';
  var save = true;
  $scope.getMarksData = function() {
    $scope.empty = false;
    $scope.dashboard = false;
    if(filters) key = filters.educationyears[filters.educationyear] +'_'+ filters.typeofexams[filters.typeofexam];
    else key = false;
    if(key) {
      $scope.title = $stateParams.name +" "+ filters.typeofexams[filters.typeofexam] +' '+ filters.educationyears[filters.educationyear];
      if(online) {
        serverData(key);
      } else {
        if(db) localData(key);
        else empty();
      }
    } else { empty(); }
  }
  var localData = function(key) {
    $cordovaSQLite.execute(db, "SELECT value from mydata where key = ?", [key+"/"+$stateParams.uid]).then(function(res) {
      if(res.rows.length > 0) {
        $scope.dashboard = true;
        applyMarks(angular.fromJson(res.rows.item(0).value));
      } else {
        if(online) serverData(key);
        else $scope.empty = true;
      }
      $scope.$broadcast('scroll.refreshComplete');
    });
  }
  var empty = function() {
    $scope.title = $stateParams.name + " Dashboard";
    $scope.$broadcast('scroll.refreshComplete');
    $scope.empty = true;
  }
  var serverData = function(key) {
    $scope.dashboard = true;
    $scope.loading = true;
    Auth.getMarks(key+"/"+$stateParams.uid).$ref().on('value', function(fbdata) {
      $scope.$broadcast('scroll.refreshComplete');
      $scope.loading = false;
      var falldata = fbdata.val();
      if(falldata) {
        var fkey = fbdata.ref().parent().key() + "/" + fbdata.key();
        applyMarks(falldata, fkey);
      } else {empty();}
    })
  }
  var applyMarks = function(marks, fkey) {
    $scope.toppers = marks.toppers;
    $scope.tpassfailConfig = {
      chart: {renderTo: 'tpassfailstatus',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      title: {text:"Pass/Fail"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.markstudents", {filter:key,type:$stateParams.uid,key:"passfail",val:event.point.name,});}}},pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [{name:"Pass", y:marks.pass},{name:"Fail", y:marks.fail}]}]
    };
    $scope.tsubjectsConfig = {
      chart: {renderTo: 'tsubjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subjects Pass/Fail"},tooltip:{pointFormat:'<span style="color:{point.color}">\u25CF</span> {point.category}: <b>{point.y}</b>'},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.markstudents", {filter:key,type:$stateParams.uid,key:event.point.name,val:event.point.category});}}},column: {events:{legendItemClick: function () {if(isIOS) {var st = this.visible ? 'hide' : 'show';if (!confirm('Do you want to '+st+' '+this.name+' data?')) {return false;}}}},depth: 25,dataLabels: {enabled: true,format: '{point.y}'}}},
      xAxis: {categories: marks.allSubjects},
      yAxis: {title: {text: null}},
      series: [{name: 'Pass',data: marks.subjectPass},{name: 'Fail',data: marks.subjectFail}]
    };
    if(online && db && save) {save = false; Auth.saveLocal(fkey, marks);}
  }  
  $scope.getMarksData();
  $scope.filters = filters;
  $ionicModal.fromTemplateUrl('templates/dashboardFilters.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.openModal = function() {$scope.modal.show();};
  $scope.closeModal = function() {$scope.modal.hide();};
  $scope.filterData = function() {$scope.openModal();}
  $scope.dashboardFilters = function() {
    filters = $scope.filters;
    save = true;
    $scope.getMarksData();
    $scope.closeModal();
  }
})

.controller("StudentDashboardCtrl", function($scope, $state, $rootScope, $stateParams, Auth, $cordovaSQLite, $ionicLoading, $ionicModal) {
  var key = '';
  var save = true;
  $scope.getMarksData = function() {
    $scope.empty = false;
    $scope.dashboard = false;
    if(filters) key = filters.educationyears[filters.educationyear] +'_'+ filters.typeofexams[filters.typeofexam];
    else key = false;
    if(key) {
      console.log("StateParams", $stateParams);
      $scope.title = $stateParams.name +' '+ filters.typeofexams[filters.typeofexam] +' '+ filters.educationyears[filters.educationyear];
      if(online) {
        serverData(key);
      } else {
        if(db) localData(key);
        else empty();
      }
    } else { empty(); }
  }
  var localData = function(key) {
    $cordovaSQLite.execute(db, "SELECT value from mydata where key = ?", [key+"/"+$stateParams.class+"/"+$stateParams.uid]).then(function(res) {
      if(res.rows.length > 0) {
        $scope.dashboard = true;
        applyMarks(angular.fromJson(res.rows.item(0).value));
      } else {
        if(online) serverData(key);
        else $scope.empty = true;
      }
      $scope.$broadcast('scroll.refreshComplete');
    });
  }
  var empty = function() {
    $scope.title = $stateParams.name + " Dashboard";
    $scope.$broadcast('scroll.refreshComplete');
    $scope.empty = true;
  }
  var serverData = function(key) {
    $scope.dashboard = true;
    $scope.loading = true;
    Auth.getMarks(key+"/"+$stateParams.class+"/"+$stateParams.uid).$ref().on('value', function(fbdata) {
      $scope.$broadcast('scroll.refreshComplete');
      $scope.loading = false;
      var falldata = fbdata.val();
      if(falldata) {
        var fkey = fbdata.ref().parent().parent().key() + "/" + fbdata.ref().parent().key() + "/" + fbdata.key();
        applyMarks(falldata, fkey);
      } else {empty();}
    })
  }

  var applyMarks = function(v, fkey) {
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
    if(online && save) {save = false; Auth.saveLocal(fkey, v); }
  }  
  $scope.getMarksData();
  $scope.filters = filters;
  $ionicModal.fromTemplateUrl('templates/dashboardFilters.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.openModal = function() {$scope.modal.show();};
  $scope.closeModal = function() {$scope.modal.hide();};
  $scope.filterData = function() {$scope.openModal();}
  $scope.dashboardFilters = function() {
    filters = $scope.filters;
    save = true;
    $scope.getMarksData();
    $scope.closeModal();
  }
})

.controller("StudentOverallDashboardCtrl", function($scope, $stateParams, $rootScope, $cordovaSQLite, Auth, $ionicLoading, $ionicModal) {
  var key = '';
  var save = true;
  $scope.getMarksData = function() {
    $scope.empty = false;
    $scope.dashboard = false;
    if(filters) key = filters.educationyears[filters.educationyear];
    else key = false;
    if(key) {
      $scope.title = $stateParams.name +' '+ filters.educationyears[filters.educationyear];
      if(online) {
        serverData(key);
      } else {
        if(db) localData(key);
        else empty();
      }
    } else { empty(); }
  }
  var localData = function(key) {
    $cordovaSQLite.execute(db, "SELECT value from mydata where key = ?", [key+"/"+$stateParams.uid]).then(function(res) {
      if(res.rows.length > 0) {
        $scope.dashboard = true;
        applyMarks(angular.fromJson(res.rows.item(0).value));
      } else {
        if(online) serverData(key);
        else $scope.empty = true;
      }
      $scope.$broadcast('scroll.refreshComplete');
    });
  }
  var empty = function() {
    $scope.title = $stateParams.name + " Dashboard";
    $scope.$broadcast('scroll.refreshComplete');
    $scope.empty = true;
  }
  var serverData = function(key) {
    $scope.dashboard = true;
    $scope.loading = true;
    Auth.getMarks(key+"/"+$stateParams.uid).$ref().on('value', function(fbdata) {
      $scope.$broadcast('scroll.refreshComplete');
      $scope.loading = false;
      var falldata = fbdata.val();
      if(falldata) {
        var fkey = fbdata.ref().parent().key() + "/" + fbdata.key();
        applyMarks(falldata, fkey);
      } else {empty();}
    })
  }

  var applyMarks = function(marks, fkey) {
    var allsubjectData = [];
    for (var i = 0; i < marks.allSubjects.length; i++) {
      allsubjectData.push({name: marks.allSubjects[i], data: marks.subjectDataMarks[marks.allSubjects[i]]});
    };
    for (var i = 0; i < marks.examMarks.length; i++) {
      marks.examMarks[i].y = parseInt(marks.examMarks[i].y);
    };
    $scope.somarksConfig = {
      chart: {renderTo: 'somarks',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Percentage"},plotOptions: {column: {depth: 25,showInLegend: false, dataLabels: {enabled: true,format: '{point.y}%'},events: {legendItemClick: function () {return false;}}},allowPointSelect: false},
      xAxis: {categories: marks.examLabels},
      yAxis: {title: {text: null}},
      series: [{name: 'Percentage',data: marks.examMarks}]
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
      title: {text:"Subjects"},tooltip:{pointFormat:'{point.y}'},plotOptions: {spline: {events:{legendItemClick: function () {if(isIOS) {var st = this.visible ? 'hide' : 'show';if (!confirm('Do you want to '+st+' '+this.name+' data?')) {return false;}}}},depth: 25,dataLabels: {enabled: true,format: '{point.y}'}}},
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
    if(online && save) {save = false; Auth.saveLocal(fkey, marks);}
  }  
  $scope.getMarksData();
  $scope.filters = filters;
  $scope.noexams = true;
  $ionicModal.fromTemplateUrl('templates/dashboardFilters.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.openModal = function() {$scope.modal.show();};
  $scope.closeModal = function() {$scope.modal.hide();};
  $scope.filterData = function() {$scope.openModal();}
  $scope.dashboardFilters = function() {
    filters = $scope.filters;
    save = true;
    $scope.getMarksData();
    $scope.closeModal();
  }
})

.controller("AllClassesCtrl", function($scope, $stateParams, $state, $cordovaSQLite, Auth, $ionicFilterBar, $timeout) {
  var filterBarInstance;
  if($stateParams.type) $scope.title = $stateParams.type;
  else $scope.title = "Classes";
  var serverData = function() {
    Auth.getUsers().then(function(allusersfb) {
      if(allusersfb["allclasses"]) $scope.items = allusersfb["allclasses"];
      else $scope.items = [];
    })
  }
  var getItems = function() {
    if(online) {
      serverData();
    } else {
      if(db) {
        $cordovaSQLite.execute(db, "SELECT value FROM mydata WHERE key = ?", ["allusers"]).then(function(res) {
          if(res.rows.length) {
            $scope.items = angular.fromJson(res.rows.item(0).value)["allclasses"];
          }
        })
      } else {$scope.items = [];}
    }
  }
  getItems();
  $scope.showFilterBar = function () {
    filterBarInstance = $ionicFilterBar.show({
      items: $scope.items,
      update: function (filteredItems, filterText) {
        $scope.items = filteredItems;
      }
    });
  };

  $scope.refreshItems = function () {
    if (filterBarInstance) {
      filterBarInstance();
      filterBarInstance = null;
    }

    $timeout(function () {
      if(online) serverData();
      else getItems();
      $scope.$broadcast('scroll.refreshComplete');
    }, 1000);
  };
  $scope.redirect = function(standard, division) {
    if($stateParams.type == "exams") {
      var st = standard;
      if((division.length > 1) && (division != "all")) st = st+"-"+division;
      $state.go('app.daysexam', {type:"exams",class:st});
    } else {
      var cc = standard +'-'+division;
      $state.go('app.classdashboard', {class:cc});
    }
  }
})
.controller("TeacherClassesCtrl", function($scope, $state, $stateParams) {
  console.log("Teacher User", user);
  $scope.getItems = function(refresh) {
    $scope.items = user.subjects;
    if(refresh) $scope.$broadcast('scroll.refreshComplete');
  }
})
.controller("AddHomeWorkCtrl", function($scope, Auth, $stateParams, $state, $cordovaSQLite, $rootScope, S_ID) {
  $scope.defaultDueDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
  $scope.hdata = {class:$stateParams.class, ack:{}, status: false, done:0, subject:$stateParams.subject, tid:user.uid, date: moment().valueOf(), $priority: 0 - moment().valueOf()};
  var processUsers = function(allstudents) {
    classcount[$stateParams.class] = 0;
    for (var i = 0; i < allstudents.length; i++) {
      if(allstudents[i].standard+'-'+allstudents[i].division == $stateParams.class) {
        classcount[$stateParams.class]++;
      }
    }
    $scope.hdata.undone = classcount[$stateParams.class];
    console.log("hdata while add", $scope.hdata);
  }
  if(classcount[$stateParams.class]) {
    console.log("classcount", classcount[$stateParams.class]);
    $scope.hdata.undone = classcount[$stateParams.class];
  } else {
    if(online) {
      Auth.getUsers().then(function(allusersfb) {
        processUsers(allusersfb["allstudents"]);
      })
    } else {
      if(db) {
        $cordovaSQLite.execute(db, "SELECT value FROM mydata WHERE key = ?", ["allusers"]).then(function(res) {
          if(res.rows.length > 0) {
            processUsers(angular.fromJson(res.rows.item(0).value)["allstudents"]);
          }
        })
      }  
    }
  }
  $scope.save = function() {
    console.log("date", new Date($scope.defaultDueDate).getTime());
    $scope.hdata.duedate = new Date($scope.defaultDueDate).getTime();
    console.log("hdata", $scope.hdata);
    $rootScope.homeworks[user.uid].$add($scope.hdata);
    $state.go('app.homeworks', {uid: user.uid});
  }
})
.controller('HomeworksCtrl', function($scope, $rootScope, $state, $cordovaSQLite, Auth, $timeout, $stateParams) {
  $scope.role = user.role;
  var getLocalData = function() {
    if(db) {
      $cordovaSQLite.execute(db, "SELECT * from mydata where key = ?", ["wall"]).then(function(res) {
        $scope.loading = false;
        if(res.rows.length > 0) {
          $scope.empty = false;
          $rootScope.walls = angular.fromJson(res.rows.item(0).value);
        } else {
          $scope.empty = true;
        }
      });
    }
  }

  $scope.getHomeworks = function(refresh) {
    if(online) {
      $rootScope.homeworks[$stateParams.uid].$loaded().then(function(data) {
        if($rootScope.walls.length > 0) {
          $scope.items = $rootScope.homeworks[$stateParams.uid];
          $scope.empty = false;
          Auth.saveLocal("wall", $rootScope.walls);
        }
        else $scope.loading = false;
      });
    } else {
      if(db) getLocalData();
      else $timeout(function() {getLocalData()}, 1000);
    }
    if(refresh) $scope.$broadcast('scroll.refreshComplete');
  }
  $scope.getHomeworks(false);
  $scope.redirect = function(item, status) {
    console.log("item", item);
    console.log("id", item.$id);
    console.log("status", status);
    $state.go('app.allhwstudents', {uid:$stateParams.uid, class: item.class, id:item.$id, status:status})
  }
  $scope.ack = function(item) {
    if(!item.ack) item.ack = {};
    if(item.ack[$stateParams.uid]) {
      item.ack[$stateParams.uid] = false;
      item.done--;
      item.undone++;
      item.status = false;
    } else {
      item.ack[$stateParams.uid] = true;
      item.done++;
      item.undone--;
      item.status = true;
    }
    $rootScope.homeworks[$stateParams.uid].$save(item);
  }
})
.controller("AllStudentsCtrl", function($scope, $rootScope, $stateParams, $cordovaSQLite, Auth, $ionicFilterBar, $timeout) {
  var filterBarInstance;
  if($stateParams.id) {
    var hw = $rootScope.homeworks[$stateParams.uid].$getRecord($stateParams.id);
    console.log("hw", hw);
  }
  var processUsers = function(allstudents) {
    if($stateParams.id) {
      var students = [];
      for (var i = 0; i < allstudents.length; i++) {
        if(allstudents[i].standard+'-'+allstudents[i].division == $stateParams.class) {
          if(hw.ack) {
            if($stateParams.status == 'done') {
              if(hw.ack[allstudents[i].uid]) students.push(allstudents[i]);
            } else {
              if(!hw.ack[allstudents[i].uid]) students.push(allstudents[i]);
            }
          } else {
            console.log("not yet", $stateParams.status);
            if($stateParams.status == 'undone') students.push(allstudents[i]);
          }
        }
      };
      $scope.items = students;
    } else {
      $scope.items = allstudents;
    }
  }
  var serverData = function() {
    Auth.getUsers().then(function(allusersfb) {
      if(allusersfb["allstudents"]) processUsers(allusersfb["allstudents"]);
      else $scope.items = [];
    })
  }
  var getItems = function() {
    if(online) {
      serverData();
    } else {
      if(db) {
        $cordovaSQLite.execute(db, "SELECT value FROM mydata WHERE key = ?", ["allusers"]).then(function(res) {
          if(res.rows.length) {
            processUsers(angular.fromJson(res.rows.item(0).value)["allstudents"]);
          }
        })
      } else {$scope.items = [];}
    }
  }
  getItems();
  $scope.showFilterBar = function () {
    filterBarInstance = $ionicFilterBar.show({
      items: $scope.items,
      update: function (filteredItems, filterText) {
        $scope.items = filteredItems;
      }
    });
  };

  $scope.refreshItems = function () {
    if (filterBarInstance) {
      filterBarInstance();
      filterBarInstance = null;
    }

    $timeout(function () {
      if(online) serverData();
      else getItems();
      $scope.$broadcast('scroll.refreshComplete');
    }, 1000);
  };
})

.controller("AllTeachersCtrl", function($scope, $cordovaSQLite, Auth, $ionicFilterBar, $timeout) {
  var filterBarInstance;
  var serverData = function() {
    Auth.getUsers().then(function(allusersfb) {
      if(allusersfb["allstudents"]) $scope.items = allusersfb["allteachers"];
      else $scope.items = [];
    })
  }
  var getItems = function() {
    if(online) {
      serverData();
    } else {
      if(db) {
        $cordovaSQLite.execute(db, "SELECT value FROM mydata WHERE key = ?", ["allusers"]).then(function(res) {
          if(res.rows.length) {
            $scope.items = angular.fromJson(res.rows.item(0).value)["allteachers"];
          }
        })
      } else {$scope.items = [];}
    }
  }
  getItems();
  $scope.showFilterBar = function () {
    filterBarInstance = $ionicFilterBar.show({
      items: $scope.items,
      update: function (filteredItems, filterText) {
        $scope.items = filteredItems;
      }
    });
  };

  $scope.refreshItems = function () {
    if (filterBarInstance) {
      filterBarInstance();
      filterBarInstance = null;
    }

    $timeout(function () {
      if(online) serverData();
      else getItems();
      $scope.$broadcast('scroll.refreshComplete');
    }, 1000);
  };
})

.controller("MarkStudentsCtrl", function($scope, $stateParams, $cordovaSQLite, $ionicFilterBar, $timeout) {
  var filterBarInstance;
  var title = "";
  var getItems = function() {
    if($stateParams.type.indexOf("student") != -1) {
      var type = $stateParams.type.split("_");
      var key = $stateParams.filter +"/"+type[1]+"/"+type[2];
    }  else if ($stateParams.type.indexOf("class") != -1) {
      var type = $stateParams.type.split("_");
      var key = $stateParams.filter +"/"+type[0]+"/"+type[1];
    } else {
      var key = $stateParams.filter +"/"+$stateParams.type;
    }
    $cordovaSQLite.execute(db, "SELECT value from mydata where key = ?", [key]).then(function(res) {
      var users = [];
      if(res.rows.length > 0) {
        var ldata = angular.fromJson(res.rows.item(0).value);
        if($stateParams.key == "passfail") {
          users = ldata[$stateParams.val];
          title += $stateParams.val;
        } else if (($stateParams.key == "Pass") || ($stateParams.key == "Fail")) {
          users = ldata["subject"+$stateParams.key+"Users"][$stateParams.val];
          title += $stateParams.val + " " + $stateParams.key;
        } else {
          users = ldata[$stateParams.key][$stateParams.val];
          title += $stateParams.val;
        }
      }
      $scope.title = title +" "+ $stateParams.filter.replace("_", " ") + " ";
      $scope.items = users;
    })
  }
  getItems();
  $scope.showFilterBar = function () {
    filterBarInstance = $ionicFilterBar.show({
      items: $scope.items,
      update: function (filteredItems, filterText) {
        $scope.items = filteredItems;
      }
    });
  };

  $scope.refreshItems = function () {
    if (filterBarInstance) {
      filterBarInstance();
      filterBarInstance = null
    }

    $timeout(function () {
      getItems();
      $scope.$broadcast('scroll.refreshComplete');
    }, 1000);
  };
})

.controller('WallCtrl', function($scope, $rootScope, $firebaseArray, $cordovaSQLite, $state, FIREBASE_URL, $ionicModal, Auth, $ionicLoading, $timeout) {
  $scope.moredata = false;
  var getLocalData = function() {
    console.log("local wall");
    $cordovaSQLite.execute(db, "SELECT * from mydata where key = ?", ["wall"]).then(function(res) {
      $scope.loading = false;
      if(res.rows.length > 0) {
        $scope.empty = false;
        $scope.walls = angular.fromJson(res.rows.item(0).value);
      } else {
        $scope.empty = true;
      }
    });
  }
  $scope.getWall = function(refresh) {
    if(online) {
      if(!refresh) $scope.loading = true;
      $rootScope.walls.$loaded().then(function() {
        if(!refresh) $scope.loading = false;
        console.log("rootScope.walls", $rootScope.walls);
        Auth.saveLocal("wall", $rootScope.walls);
        $scope.$broadcast('scroll.refreshComplete');
      })
    } else {
      if(refresh) $scope.$broadcast('scroll.refreshComplete');
      if(db) getLocalData();
      else $timeout(function() {getLocalData()}, 1000);
    }
  }

  var last = 0;
  $scope.loadMoreData=function()
  {
    if(online) {
      $timeout(function() {
        if($rootScope.walls.length > last) {
          scrollRef.scroll.next(10);
          $scope.$broadcast('scroll.infiniteScrollComplete');
          last = $rootScope.walls.length;
          //if(last < 25) Auth.saveLocal("wall", $rootScope.walls);
        } else {
          $scope.moredata = true;
        }
      }, 1000)
    } else {
      $scope.moredata = true;
    }
  };
  $rootScope.$on('online', function (event, data) {
    if(data && $scope.empty) {
      $scope.getWall();
    }
  });


  $scope.uid = user.uid;
  $scope.addwall = true;

  if(user.role == 'parent') $scope.addwall = false;
  $scope.addpost = function() {
    $state.go('app.addpost', {});
  }

  $scope.like = function(wallid, action) {
    var update = {};
    update.like = $rootScope.walls[wallid].like;
    update.likeuids = ($rootScope.walls[wallid].likeuids) ? $rootScope.walls[wallid].likeuids : [];
    if(action == 'like') {
      update.like++;
      update.likeuids.push(user.uid);
    } else {
      update.like--;
      var uidindex = update.likeuids.indexOf(user.uid);
      update.likeuids.splice(uidindex);
    }
    var updated = Auth.updateWall(user.schoolid+'/wall/'+$rootScope.walls[wallid].$id, update);
  }

  $ionicModal.fromTemplateUrl('templates/image-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.openModal = function() {$scope.modal.show();};
  $scope.closeModal = function() {$scope.modal.hide();};
  $scope.showImage = function(index) {
    $scope.imageSrc = index;
    $scope.openModal();
  }
})

.controller('AddPostCtrl', function($scope, $rootScope, Auth, $state, $cordovaCamera) {
  //$rootScope.walls = Auth.wall(user.schoolid+'/wall');
  $scope.priority = -1;
  $rootScope.walls.$loaded().then(function(data) {
    if($rootScope.walls.length > 0) {
      $scope.priority = $rootScope.walls[0].$priority - 1;
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
    $rootScope.walls.$add({
      'name' : user.name,
      'uid' : uid,
      'date' : Date.now(),
      'text' : $scope.post.message,
      '$priority' : $scope.priority,
      'likeuids' : [],
      'pictures' : $scope.post.pictures,
      'like' : 0
    });
    $state.go('app.wall');
  }
})

.controller('MessagesCtrl', function($scope, $rootScope, $ionicLoading, $state, $cordovaSQLite, Auth, $ionicFilterBar, $timeout) {
  $scope.title = "chats";
  $scope.items = {chats:[],contacts:[]};
  var serverContacts = function() {
    Auth.getUsers().then(function(allusers) {
      if(allusers["chatcontacts"]) {
        if(user.role == "teacher") hmcontact();
        $scope.items.contacts = allusers["chatcontacts"];
      } else {$scope.items[$scope.title] = [];}
    })
  }
  var localContacts = function() {
    if(db) {
      $cordovaSQLite.execute(db, "SELECT value FROM mydata WHERE key = ?", ["allusers"]).then(function(res) {
        console.log("allusers", res.rows.length);
        if(res.rows.length > 0) {
          $scope.items.contacts = angular.fromJson(res.rows.item(0).value)["chatcontacts"];
          console.log("items", $scope.items);
        } else {
          if(online) serverContacts();
          else $scope.items.contacts = [];
        }
      })
    } else {
      if(online) serverContacts();
      else $scope.items.contacts = [];
    }
  }
  var hmcontact = function() {
    $rootScope.hm.$loaded().then(function(hsnap) {
      for(var hh in $rootScope.hm) {
        if(hh.indexOf("simplelogin") != -1) {
          $scope.items.contacts.push({uid:hh,role:"hm",name:"Head Master",type:"single"});
        }
      }
    })
  }
  var parentContacts = function() {
    contacts = [];
    hmcontact();
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
    $scope.items.contacts = contacts;
  }
  var serverChats = function() {
    $scope.chatLoading = true;
    Auth.getUserChatRooms().$ref().on('value', function(frchatrooms) {
      $scope.chatLoading = false;
      var allmess = frchatrooms.val();
      //if($scope.title = "chats") $scope.items = allmess;
      var allm = []; var ii = 0;
      angular.forEach(allmess, function(val, k) {ii++;allm.push(val);});
      if(ii > 0) $scope.chatEmpty = false;
      $scope.items.chats = allm;
      Auth.saveLocal(user.uid+"allmess", allm);
    });
  }
  var localChats = function() {
    if(db) {
      $cordovaSQLite.execute(db, "SELECT value FROM mydata WHERE key = ?", [user.uid+"allmess"]).then(function(mres) {
        if(mres.rows.length > 0) {
          $scope.items.chats = angular.fromJson(mres.rows.item(0).value);
        } else {
          $scope.items.chats = [];
        }
      });
    } else {$scope.items.chats = []};
  }
  var filterBarInstance;
  $scope.getItems = function(type) {
    console.log("type", type);
    $scope.title = type;
    if(type == "chats") {
      if(online) serverChats();
      else localChats();
    } else {
      if(user.role == "parent") {
        parentContacts();
      } else {
        if(online) serverContacts();    
        else localContacts();
      }
    }
  }
  $scope.showFilterBar = function () {
    filterBarInstance = $ionicFilterBar.show({
      items: $scope.items[$scope.title],
      update: function (filteredItems, filterText) {
        $scope.items[$scope.title] = filteredItems;
      }
    });
  };

  $scope.refreshItems = function (type) {
    if (filterBarInstance) {
      filterBarInstance();
      filterBarInstance = null;
    }

    $timeout(function () {
      if(type == "chats") {
        if(online) serverChats();
        else localChats();
      } else {
        if(user.role == "parent") {
          parentContacts();
        } else {      
          localContacts();
        }
      }
      $scope.$broadcast('scroll.refreshComplete');
    }, 0);
  };
  $scope.processing = {};
  $scope.$on('$ionicView.enter', function() {
    console.log("from", $rootScope.fromState);
    //if($rootScope.fromState == 'app.messagebox') $scope.getItems($scope.title);
  });
  $scope.toMessageBox = function(contact, action) {
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
      var NewChat = function() {
        if(!$scope.processing[contact.uid]) {
          $scope.processing[contact.uid] = true;
          Auth.chats().$add(message).then(function(msnap) {
            var chatid = msnap.key();
            var rooms = {};
            froom = {chatid:chatid, notify:0, name: message.to, uid:message.toUid, type:message.type};
            chatrooms.$ref().child(message.fromUid).child(chatid).set(froom);
            if(message.type == "group") {
              if(db) {
                $cordovaSQLite.execute(db, "SELECT value FROM mydata WHERE key = ?", ["allusers"]).then(function(res) {
                  if(res.rows.length > 0) {
                    if(user.role != "hm") {
                      hm = {chatid:chatid, notify:0, name: message.to, uid:message.toUid, type:message.type};
                      chatrooms.$ref().child($scope.hm.uid).child(chatid).set(hm);
                    }
                    var allusers = angular.fromJson(res.rows.item(0).value);
                    for (var i = 0; i < allusers["groups"][message.toUid].length; i++) {
                      var classStudent = allusers["groups"][message.toUid][i];
                      rooms = {chatid:chatid, notify:0, name: message.to, uid:message.toUid, type:message.type};
                      chatrooms.$ref().child(classStudent.uid).child(chatid).set(rooms);
                    };
                  }
                })
              }
            } else {
              rooms = {chatid:chatid, notify:0, name: message.from, uid: message.fromUid, type:message.type};
              chatrooms.$ref().child(message.toUid).child(chatid).set(rooms);
            }
            $scope.processing[contact.uid] = false;
            $state.go('app.messagebox', {chatid:chatid, to:contact.name, toUid:contact.uid,  type:message.type, notify:0});
          })
        }
      }

      chatrooms.$ref().child(message.fromUid).orderByChild("uid").equalTo(message.toUid).once('value', function(data) {
        if(!data.val()) {
          NewChat();
        } else {
          data.forEach(function(chatval) {
            var chatid = chatval.key();
            if(chatid) {
              $state.go('app.messagebox', {chatid:chatid, toUid:message.toUid, to:message.to, type:message.type, notify:0});
            } else {
              NewChat();
            }
          })
        }
      });
    //}
  }
})
.controller('MessageBoxCtrl', function($scope, $rootScope, $state, $stateParams, $cordovaSQLite, $ionicPopup, $ionicScrollDelegate, $timeout, Auth) {
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
  $scope.input = {message: ''};

  var processMessages = function(allmsg) {
    $scope.messages = allmsg;
    $timeout(function() {
      $ionicScrollDelegate.$getByHandle('userMessageScroll').scrollBottom();
      Auth.saveLocal("chats_"+$stateParams.chatid, allmsg);
    },500);
  }
  var getMessages = function() {
    if(online) {
      allchats.child("messages").limitToLast(50).on('value', function(frmessages) {
        if($rootScope.currentState == 'app.messagebox') {
          if($stateParams.notify > 0) {
            chatrooms.$ref().child(user.uid).child($stateParams.chatid).child("notify").set(0);
          }
          var allmm = frmessages.val() || [];
          processMessages(allmm);
        }
      })
    } else {
      if(db) {
        $cordovaSQLite.execute(db, "SELECT value from mydata WHERE key = ?", ["chats_"+$stateParams.chatid]).then(function(cres) {
          if(cres.rows.length > 0) {
            processMessages(angular.fromJson(cres.rows.item(0).value));
          }
        });
      }
    }
  }
  getMessages();
  $scope.sendMessage = function() {
    if($scope.input.message === '') return;
    var message = {
      toUid: $scope.toUser.uid,
      to: $scope.toUser.name,
      text: $scope.input.message
    };

    //keepKeyboardOpen();
    $scope.input.message = '';

    message.date = Date.now();
    message.name = fromName;
    message.userId = user.uid;
    message.type = $stateParams.type;

    allchats.child("messages").push(message);
    var roomupdate = {
      text:message.text,
      date:moment().valueOf()
    }
    if(message.type == "group") {
      var update = {};
      chatrooms.$ref().orderByChild($stateParams.chatid).once('value', function(chatdata) {
        chatdata.forEach(function(chatroomdata) {
          var ckey = chatroomdata.key();          
          var val = chatroomdata.val();
          if(user.uid != ckey) val[$stateParams.chatid].notify++;
          val[$stateParams.chatid].text = message.text;
          val[$stateParams.chatid].date = moment().valueOf();
          update[ckey] = val;
        })
        chatrooms.$ref().update(update);
      });
    } else {
      chatrooms.$ref().child(message.toUid).child($stateParams.chatid).once('value', function(data) {
        var roomdata = data.val();
        roomdata.notify++;
        roomdata.text = message.text;
        roomdata.date = moment().valueOf();
        chatrooms.$ref().child($scope.toUser.uid).child($stateParams.chatid).set(roomdata);
      })
      chatrooms.$ref().child(message.userId).child($stateParams.chatid).update(roomupdate);
    }

    $timeout(function() {
      keepKeyboardOpen();
      //$ionicScrollDelegate.$getByHandle('userMessageScroll').scrollBottom(true);
    }, 0);

  };
    
  function keepKeyboardOpen() {
    txtInput = angular.element(document.querySelector('#inputMessage'));  
    txtInput.one('blur', function() {
      txtInput[0].focus();
    });
  }
})
.controller('AccountCtrl', function($scope) {
  $scope.user = user;
})
.controller('TimetableCtrl', function($scope, $stateParams, Auth, $timeout, $cordovaSQLite, $ionicSlideBoxDelegate) {
  var days = ["monday","tuesday","wednesday","thursday","friday","saturday"];
  $scope.next = function() {$ionicSlideBoxDelegate.next();};
  $scope.previous = function() {$ionicSlideBoxDelegate.previous();};
  $scope.slideChanged = function(index, slides) {
    $scope.slideIndex = index;
    $scope.title = days[index] + " Timetable";
  };
  $scope.title = "Timetable";
  var processData = function(daysData) {
    console.log("daysData", daysData);
    if(daysData.length > 0){
        $timeout(function() {
          $scope.slides = daysData;
          for(var dd in daysData[0]) {
              $scope.title = daysData[0][dd].day + " Timetable";
              break;
          }
          if(online) Auth.saveLocal("tt_"+$stateParams.id, daysData);
        },0);
    } else {
      $scope.empty = true;
    }
  }
  var timetableFromServer = function() {
    if(timetableref[$stateParams.id]) {
      var tref = timetableref[$stateParams.id];
    } else {
      var tref = Auth.getTimetable($stateParams.id);
    }
    tref.on('value', function(tdata) {
      var timetable = tdata.val() || {};
      processData(timetable);
    })
  }
  if(online) {
    timetableFromServer();
  } else {
    if(db) {
      $cordovaSQLite.execute(db, "SELECT value from mydata WHERE key = ?", ["tt_"+$stateParams.id]).then(function(tres) {
        if(tres.rows.length > 0) {
          processData(angular.fromJson(tres.rows.item(0).value));
        }
      })
    }
  }
})
.controller('DaysCtrl', function($scope, $rootScope, $stateParams, Auth, $timeout, $cordovaSQLite, $ionicSlideBoxDelegate) {
  $scope.empty = false;
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  $scope.next = function() {$ionicSlideBoxDelegate.next();};
  $scope.previous = function() {$ionicSlideBoxDelegate.previous();};
  $scope.slideChanged = function(index, slides) {
    $scope.slideIndex = index;
    $scope.title = ($stateParams.class) ? slides[index].id.replace("_", " ") + " " + $stateParams.type : months[parseInt(slides[index].id.split("-")[1]) - 1] + " " + slides[index].id.split("-")[0] + " " + $stateParams.type;
  };
  $scope.title = $stateParams.type;
  var processData = function(daysData) {
    $timeout(function() {
      $scope.slides = daysData;
      var skey = daysData[0].id.split("-");
      $scope.title = ($stateParams.class) ? daysData[0].id.replace("_"," ") + " " + $stateParams.type : months[parseInt(skey[1]) - 1] + " " + skey[0] + " " + $stateParams.type;
      if(online) Auth.saveLocal(lkey, daysData);
    },0);
  }
  var timetableFromServer = function() {
    if($stateParams.class) {
      if(days[$stateParams.type][$stateParams.class]) {
        var dref = days[$stateParams.type][$stateParams.class];
      } else {
        var d = new Date();
        var start = parseInt(d.getFullYear() +''+ ("0" + (d.getMonth() + 1)).slice(-2));
        var dref = Auth.getExams($stateParams.class, start);
      }
    } else {
      var dref = days[$stateParams.type];
    }
    dref.on('value', function(tdata) {
      var timetable = tdata.val() || {};
      if(timetable.length > 0){
        processData(timetable);
      } else {
        $scope.empty = true;
      }
    })
  }
  var lkey = ($stateParams.class) ? user.uid + $stateParams.type + $stateParams.class : user.uid + $stateParams.type;
  if(online) {
    timetableFromServer();
  } else {
    if(db) {
      $cordovaSQLite.execute(db, "SELECT value from mydata WHERE key = ?", [lkey]).then(function(tres) {
        if(tres.rows.length > 0) {
          processData(angular.fromJson(tres.rows.item(0).value));
        }
      })
    } else {$scope.empty = true;}
  }
  $rootScope.$on('online', function (event, data) {
    if($scope.empty) {
      timetableFromServer();
    }
  });
})

.controller('BusTrackingCtrl', function($scope, $ionicLoading, S_ID) {
  console.log("tracking bus");
 // Set the center as Firebase HQ
  var locations = {
    "FirebaseHQ": [12.917147, 77.622798],
    "Caltrain": [37.7789, -122.3917]
  };
  var center = locations["FirebaseHQ"];

  // Query radius
  var radiusInKm = 5;

  // Get a reference to the Firebase public transit open data set
  var transitFirebaseRef = ref.child('tracking/'+S_ID);

  // Create a new GeoFire instance, pulling data from the public transit data
  var geoFire = new GeoFire(transitFirebaseRef.child("_geofire"));

  /*************/
  /*  GEOQUERY */
  /*************/
  // Keep track of all of the vehicles currently within the query
  var vehiclesInQuery = {};
  // Create a new GeoQuery instance
  var geoQuery = geoFire.query({
    center: center,
    radius: radiusInKm
  });

  $scope.mapCreated = function(map) {
    $scope.map = map;
    // Create a draggable circle centered on the map
    var circle = new google.maps.Circle({
      strokeColor: "#6D3099",
      strokeOpacity: 0.7,
      strokeWeight: 0,
      fillColor: "#B650FF",
      fillOpacity: 0,
      map: map,
      center: new google.maps.LatLng(user.students[0].lat, user.students[0].lng),
      radius: ((5) * 1000),
      draggable: true
    });
    //Update the query's criteria every time the circle is dragged
    var updateCriteria = _.debounce(function() {
      var latLng = circle.getCenter();
      geoQuery.updateCriteria({
        center: [latLng.lat(), latLng.lng()],
        radius: radiusInKm
      });
    }, 10);
    google.maps.event.addListener(circle, "drag", updateCriteria);
    var currentLocationMarker = createStudentMarker(user.students[0].lat, user.students[0].lng);
    /* Adds new vehicle markers to the map when they enter the query */
    geoQuery.on("key_entered", function(vehicleId, vehicleLocation) {
      console.log("key entered", vehicleId, vehicleLocation);
      // Specify that the vehicle has entered this query
      vehicleId = vehicleId.split(":")[1];
      vehiclesInQuery[vehicleId] = true;

      // Look up the vehicle's data in the Transit Open Data Set
      transitFirebaseRef.child("vehicles").child(vehicleId).once("value", function(dataSnapshot) {
        // Get the vehicle data from the Open Data Set
        vehicle = dataSnapshot.val();
        console.log("vehicle", vehicle);
        // If the vehicle has not already exited this query in the time it took to look up its data in the Open Data
        // Set, add it to the map
        if (vehicle !== null && vehiclesInQuery[vehicleId] === true) {
          // Add the vehicle to the list of vehicles in the query
          console.log("creating vehicle marker");
          vehiclesInQuery[vehicleId] = vehicle;
          console.log("vehicleLocation lat", vehicleLocation[0]);
          console.log("Long", vehicleLocation[1]);
          // Create a new marker for the vehicle
          vehicle.marker = createVehicleMarker(vehicleLocation[0], vehicleLocation[1], vehicle);
        }
      });
    });

    /* Moves vehicles markers on the map when their location within the query changes */
    geoQuery.on("key_moved", function(vehicleId, vehicleLocation) {
      console.log("key moved", vehicleId, vehicleLocation);
      // Get the vehicle from the list of vehicles in the query
      vehicleId = vehicleId.split(":")[1];
      var vehicle = vehiclesInQuery[vehicleId];

      // Animate the vehicle's marker
      if (typeof vehicle !== "undefined" && typeof vehicle.marker !== "undefined") {
        vehicle.marker.animatedMoveTo(vehicleLocation);
      }
    });

    /* Removes vehicle markers from the map when they exit the query */
    geoQuery.on("key_exited", function(vehicleId, vehicleLocation) {
      console.log("key exists", vehicleId, vehicleLocation);
      // Get the vehicle from the list of vehicles in the query
      vehicleId = vehicleId.split(":")[1];
      var vehicle = vehiclesInQuery[vehicleId];

      // If the vehicle's data has already been loaded from the Open Data Set, remove its marker from the map
      if (vehicle !== true) {
        vehicle.marker.setMap(null);
      }

      // Remove the vehicle from the list of vehicles in the query
      delete vehiclesInQuery[vehicleId];
    });

    /*****************/
    /*  GOOGLE MAPS  */
    /*****************/
    /* Initializes Google Maps */
    // function initializeMap() {

    // }
    // initializeMap();
    /**********************/
    /*  HELPER FUNCTIONS  */
    /**********************/
    /* Adds a marker for the inputted vehicle to the map */
    function createVehicleMarker(latitude, longitude, vehicle) {
      var marker = new google.maps.Marker({
        icon: "https://chart.googleapis.com/chart?chst=d_bubble_icon_text_small&chld=bus|bb|"+vehicle.routeTag+"|F75C50|FFFFFF",
        //icon: "https://lh4.googleusercontent.com/-UjKiveTyTUI/VKJ3RyUC0LI/AAAAAAAAAGc/zxBS9koEx6c/w800-h800/nnkjn.png&chld=" + vehicle.vtype + "|bbT|" + vehicle.routeTag + "|" + vehicleColor + "|eee",
        position: new google.maps.LatLng(latitude, longitude),
        optimized: true,
        map: map
      });

      return marker;
    }

    function createStudentMarker(latitude, longitude) {
      console.log("creating a parent",latitude, longitude);
      var marker = new google.maps.Marker({
        zIndex: 10,
        position: new google.maps.LatLng(latitude, longitude),
        optimized: true,
        map: map
      });

      return marker;
    }
    /* Returns a blue color code for outbound vehicles or a red color code for inbound vehicles */
    function getVehicleColor(vehicle) {
      return ((vehicle.dirTag && vehicle.dirTag.indexOf("OB") > -1) ? "50B1FF" : "FF6450");
    }

    /* Returns true if the two inputted coordinates are approximately equivalent */
    function coordinatesAreEquivalent(coord1, coord2) {
      return (Math.abs(coord1 - coord2) < 0.000001);
    }

    /* Animates the Marker class (based on https://stackoverflow.com/a/10906464) */
    google.maps.Marker.prototype.animatedMoveTo = function(newLocation) {
      var toLat = newLocation[0];
      var toLng = newLocation[1];

      var fromLat = this.getPosition().lat();
      var fromLng = this.getPosition().lng();

      if (!coordinatesAreEquivalent(fromLat, toLat) || !coordinatesAreEquivalent(fromLng, toLng)) {
        var percent = 0;
        var latDistance = toLat - fromLat;
        var lngDistance = toLng - fromLng;
        var interval = window.setInterval(function () {
          percent += 0.01;
          var curLat = fromLat + (percent * latDistance);
          var curLng = fromLng + (percent * lngDistance);
          var pos = new google.maps.LatLng(curLat, curLng);
          this.setPosition(pos);
          if (percent >= 1) {
            window.clearInterval(interval);
          }
        }.bind(this), 50);
      }
    };
  };

})
.controller('FavTeacherCtrl', function ($scope, $cordovaSQLite, $stateParams, Auth, $state, $timeout, $ionicLoading, $ionicSideMenuDelegate, TDCardDelegate) {
  console.log('CARDS CTRL', user);
  $scope.loadData = function() {
    $scope.selectedCard = false;
    $scope.indexItem = false;
    $ionicLoading.show();
    var cards = [];
    angular.forEach(user.students[$stateParams.id], function(teacher, tk) {
      if(tk.indexOf("simplelogin") != -1) {
        var tval = teacher.split("_");
        var card = {
          "uid":tk,
          "name":tval[0],
          "subject":tval[1],
          "img": "https://randomuser.me/api/portraits/med/women/"+(tk.split(':')[1] - 1) +".jpg"
        }
        cards.push(card);
      }
    });
    $timeout(function() {$ionicLoading.hide(); console.log("cards", cards); $scope.cards = cards;}, 100);
  }

  var selected = function(index) {
    if(index != -1) $scope.selectedCard = $scope.cards[index];
    else $scope.selectedCard = {};
    console.log("selected card", $scope.selectedCard);
    localStorage.setItem("selectedTeacher", angular.toJson($scope.selectedCard));
    $state.go('app.favteachercard', {student:$stateParams.id});
  }
  //$scope.cards = Array.prototype.slice.call(cardTypes, 0);

  $scope.cardDestroyed = function(index) {
    $scope.cards.splice(index, 1);
  };

  $scope.addCard = function() {
    var newCard = cardTypes[Math.floor(Math.random() * cardTypes.length)];
    newCard.id = Math.random();
    $scope.cards.push(angular.extend({}, newCard));
  }

  $scope.yesCard = function() {
    if(!$scope.indexItem) $scope.indexItem = $scope.cards.length - 1;
    else $scope.indexItem--;
    console.log('YES', $scope.indexItem);
    selected($scope.indexItem);
  };

  $scope.noCard = function() {   
    if(!$scope.indexItem) {
      $scope.indexItem = $scope.cards.length - 1;
      TDCardDelegate.$getByHandle('teachers').cardInstances[$scope.indexItem].swipe('left');
    } else {
      $scope.indexItem--;
      TDCardDelegate.$getByHandle('teachers').cardInstances[$scope.indexItem].swipe('left');
      console.log("index on No", $scope.indexItem); 
      if($scope.indexItem == 0) selected(-1);
    }
  };
  $scope.cardSwipedLeft = function(index) {
    console.log('LEFT SWIPE');
    console.log("index", index);
    $scope.indexItem = index;
    if(index == 0) selected(-1);
  };
  $scope.cardSwipedRight = function(index) {
    console.log('RIGHT SWIPE');
    console.log("index", index);
    selected(index);
  };
})
.controller('FavTeacherCardCtrl', function($scope, $state, $stateParams) {
  var d = new Date();
  $scope.year = d.getFullYear();
  $scope.month = months[d.getMonth()];
  var teacher = angular.fromJson(localStorage.getItem("selectedTeacher"));
  console.log("teacher", teacher);
  $scope.teacher = (Object.keys(teacher).length > 0) ? teacher : false;
  $scope.redirect = function() {
    $state.go('app.favteacher', {id:$stateParams.student});
  }
})
.controller('CalendarCtrl', function($scope, $state) {
  "use strict";
  // With "use strict", Dates can be passed ONLY as strings (ISO format: YYYY-MM-DD)
  $scope.options = {
    defaultDate: "2015-08-06",
    minDate: "2015-01-01",
    maxDate: "2016-12-31",
    disabledDates: [
        "2015-06-22",
        "2015-07-27",
        "2015-08-13",
        "2015-08-15"
    ],
    dayNamesLength: 1, // 1 for "M", 2 for "Mo", 3 for "Mon"; 9 will show full day names. Default is 1.
    mondayIsFirstDay: true,//set monday as first day of week. Default is false
    eventClick: function(date) {
      console.log(date);
      $state.go('app.days', {type:'events'});
    },

    dateClick: function(date) {
      console.log(date);
      $state.go('app.days', {type:'holidays'});
      
    },
    changeMonth: function(month, year) {
      console.log(month, year);
    },
  };

  $scope.events = [
    {foo: 'bar', date: "2015-10-24"},
    {foo: 'bar', date: "2015-10-30"},
    {foo: 'bar', date: "2015-11-12"},
    {foo: 'bar', date: "2015-11-13"},
    {foo: 'bar', date: "2015-12-25"},
    {foo: 'bar', date: "2015-08-20"}
  ];
})
.controller('AuthCtrl', function ($scope, $state, $rootScope, Auth, $ionicLoading, $ionicPopup, $ionicModal) {
  if(localStorage.getItem("user")) {
    //$state.go('app.wall', {}, {reload:true});
  }
  $scope.user = {
    username: '',
    password: '',
  }
  $scope.users = [
  {
    title: 'Head Master',
    username: "8951572125",
    password: '4spuv7vi'
  },
  {
    title: 'Teacher',
    username: "9496255108",
    password: "3wqoxbt9"
  },
  {
    title: "Parent",
    username: "9944711005",
    password: "4aacq5mi"
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
      $ionicLoading.hide();
      var filters = Auth.filters(user.schoolid);
      filters.$bindTo($rootScope, 'filters');
      filters.$loaded().then(function(fdata) {
        localStorage.setItem("filters", angular.toJson(fdata));
      });
      $state.go('app.wall', {}, {reload: true});
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