angular.module('starter.controllers', ['starter.services', 'monospaced.elastic', 'angularMoment'])

.controller('AppCtrl', function($scope, $window, $rootScope, Auth, $state, $ionicLoading, $timeout) {
  $scope.logout = function() {
    Auth.logout();
    $state.go("login");
  }
  if(Object.keys(user).length > 0) {
    if($rootScope.updateMenu) {
      $scope.menuLinks = Auth.getMenus();
      $rootScope.updateMenu = false;
    }
  } else {
    $state.go("login");
  }
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, rejection){
    $rootScope.state = toState.name;
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
      $scope.title = filters.educationyears[filters.educationyear];
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
  var getItems = function() {
    if(db) {
      $cordovaSQLite.execute(db, "SELECT value FROM mydata WHERE key = ?", ["allusers"]).then(function(res) {
        if(res.rows.length) {
          $scope.items = angular.fromJson(res.rows.item(0).value)["allclasses"];
        } else {
          if(online) serverData();
          else $scope.items = [];
        }
      })
    } else {$scope.items = [];}
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
  var serverData = function() {
    Auth.getUsers().then(function(allusersfb) {
      if(allusersfb["allclasses"]) $scope.items = allusersfb["allclasses"];
      else $scope.items = [];
    })
  }
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

.controller("AllStudentsCtrl", function($scope, $cordovaSQLite, Auth, $ionicFilterBar, $timeout) {
  var filterBarInstance;
  var getItems = function() {
    if(db) {
      $cordovaSQLite.execute(db, "SELECT value FROM mydata WHERE key = ?", ["allusers"]).then(function(res) {
        if(res.rows.length) {
          $scope.items = angular.fromJson(res.rows.item(0).value)["allstudents"];
        } else {
          if(online) serverData();
          else $scope.items = [];
        }
      })
    } else {$scope.items = [];}
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
  var serverData = function() {
    Auth.getUsers().then(function(allusersfb) {
      if(allusersfb["allstudents"]) $scope.items = allusersfb["allstudents"];
      else $scope.items = [];
    })
  }
})

.controller("AllTeachersCtrl", function($scope, $cordovaSQLite, Auth, $ionicFilterBar, $timeout) {
  var filterBarInstance;
  var getItems = function() {
    if(db) {
      $cordovaSQLite.execute(db, "SELECT value FROM mydata WHERE key = ?", ["allusers"]).then(function(res) {
        if(res.rows.length) {
          $scope.items = angular.fromJson(res.rows.item(0).value)["allteachers"];
        } else {
          if(online) serverData();
          else $scope.items = [];
        }
      })
    } else {$scope.items = [];}
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
  var serverData = function() {
    Auth.getUsers().then(function(allusersfb) {
      if(allusersfb["allstudents"]) $scope.items = allusersfb["allteachers"];
      else $scope.items = [];
    })
  }
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
    $cordovaSQLite.execute(db, "SELECT * from mydata where key = ?", ["wall"]).then(function(res) {
      $scope.loading = false;
      if(res.rows.length > 0) {
        $scope.empty = false;
        $rootScope.walls = angular.fromJson(res.rows.item(0).value);
      } else {
        $scope.empty = true;
      }
    }, function(err) {
      console.log("error", err);
    });
  }
  $scope.getWall = function(refresh) {
    if(!refresh) $scope.loading = true;
    if(online) {
      $rootScope.walls.$loaded().then(function(data) {
        if($rootScope.walls.length > 0) {
          $scope.empty = false;
          Auth.saveLocal("wall", $rootScope.walls);
        }
        if(refresh) $scope.$broadcast('scroll.refreshComplete');
        else $scope.loading = false;
      });
    } else {
      if(refresh) $scope.$broadcast('scroll.refreshComplete');
      if(db) getLocalData();
      else $timeout(function() {getLocalData()}, 1000);
    }
  }
  $scope.getWall(false);
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
  $scope.title = "Chats";
  $scope.messages = Auth.chats();
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
  var serverContacts = function() {
    Auth.getUsers().then(function(allusers) {
      if(allusers["chatcontacts"]) {
        if(user.role == "teacher") allusers["chatcontacts"].push($scope.hm);
        $scope.items = allusers["chatcontacts"];
      } else {$scope.items = [];}
    })
  }
  var localContacts = function() {
    if(db) {
      $cordovaSQLite.execute(db, "SELECT value FROM mydata WHERE key = ?", ["allusers"]).then(function(res) {
        if(res.rows.length > 0) {
          $scope.items = angular.fromJson(res.rows.item(0).value)["chatcontacts"];
        } else {
          if(online) serverContacts();
          else $scope.items = [];
        }
      })
    } else {
      if(online) serverContacts();
      else $scope.items = [];
    }
  }

  var parentContacts = function() {
    contacts = [];
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
    $scope.items = contacts;   
  }
  var serverChats = function() {
    $scope.chatLoading = true;
    Auth.getUserChatRooms().$ref().on('value', function(frchatrooms) {
      $scope.chatLoading = false;
      var allmess = frchatrooms.val();
      $scope.items = allmess;
      var allm = []; var ii = 0;
      angular.forEach(allmess, function(val, k) {ii++;allm.push(val);});
      if(ii > 0) $scope.chatEmpty = false;
      $scope.items = allm;
      Auth.saveLocal(user.uid+"allmess", allm);
    });
  }
  var localChats = function() {
    if(db) {
      $cordovaSQLite.execute(db, "SELECT value FROM mydata WHERE key = ?", [user.uid+"allmess"]).then(function(mres) {
        if(mres.rows.length > 0) {
          $scope.items = angular.fromJson(mres.rows.item(0).value);
        } else {
          $scope.items = [];
        }
      });
    } else {$scope.items = []};
  }
  var filterBarInstance;
  $scope.getItems = function(type) {
    $scope.title = type;
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
  }
  $scope.showFilterBar = function () {
    filterBarInstance = $ionicFilterBar.show({
      items: $scope.items,
      update: function (filteredItems, filterText) {
        $scope.items = filteredItems;
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
        if(online) serverContacts();
        else localContacts();
      }
      $scope.$broadcast('scroll.refreshComplete');
    }, 1000);
  };


  $scope.toMessageBox = function(contact) {
    var chatrooms = Auth.chatrooms();
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
      $scope.messages.$add(message).then(function(msnap) {
        var chatid = msnap.key();
        var rooms = {};
        froom = {chatid:chatid, notify:0, name: message.to, uid:message.toUid, type:message.type};
        chatrooms.child(message.fromUid).child(chatid).set(froom);
        if(message.type == "group") {
          if(db) {
            $cordovaSQLite.execute(db, "SELECT value FROM mydata WHERE key = ?", ["allusers"]).then(function(res) {
              if(res.rows.length > 0) {
                if(user.role != "hm") {
                  hm = {chatid:chatid, notify:0, name: message.to, uid:message.toUid, type:message.type};
                  chatrooms.child($scope.hm.uid).child(chatid).set(hm);
                }
                var allusers = angular.fromJson(res.rows.item(0).value);
                for (var i = 0; i < allusers["groups"][message.toUid].length; i++) {
                  var classStudent = allusers["groups"][message.toUid][i];
                  rooms = {chatid:chatid, notify:0, name: message.to, uid:message.toUid, type:message.type};
                  chatrooms.child(classStudent.uid).child(chatid).set(rooms);
                };
              }
            })
          }
        } else {
          rooms = {chatid:chatid, notify:0, name: message.from, uid: message.fromUid, type:message.type};
          chatrooms.child(message.toUid).child(chatid).set(rooms);
        }
        $state.go('app.messagebox', {chatid:chatid, to:contact.name, toUid:contact.uid,  type:message.type, notify:0});
      })
    }

    chatrooms.child(message.fromUid).orderByChild("uid").equalTo(message.toUid).once('value', function(data) {
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
  }
})
.controller('MessageBoxCtrl', function($scope, $rootScope, $state, $stateParams, $cordovaSQLite, $ionicPopup, $ionicScrollDelegate, $timeout, Auth) {
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
  $scope.input = {message: ''};

    var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    var footerBar; // gets set in $ionicView.enter
    var scroller;
    var txtInput; // ^^^

    var processMessages = function(allmsg) {
      $timeout(function() {
        $scope.messages = allmsg;
        viewScroll.scrollBottom();
        Auth.saveLocal("chats_"+$stateParams.chatid, allmsg);
      }, 0);
    }
    var getMessages = function() {
      if(online) {
        allchats.child("messages").limitToLast(50).on('value', function(frmessages) {
          if($stateParams.notify > 0) {
            Auth.chatrooms().child(user.uid).child($stateParams.chatid).child("notify").set(0);
          }
          var allmm = frmessages.val() || [];
          processMessages(allmm);
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
    $scope.$on('$ionicView.enter', function() {
      getMessages();
      $timeout(function() {
        footerBar = document.body.querySelector('#userMessagesView .bar-footer');
        scroller = document.body.querySelector('#userMessagesView .scroll-content');
        txtInput = angular.element(footerBar.querySelector('textarea'));
      }, 0);

    });

  $scope.sendMessage = function() {
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
 
  //   $scope.$on('taResize', function(e, ta) {
  //     if (!ta) return;
      
  //     var taHeight = ta[0].offsetHeight;
      
  //     if (!footerBar) return;
      
  //     var newFooterHeight = taHeight + 10;
  //     newFooterHeight = (newFooterHeight > 44) ? newFooterHeight : 44;
      
  //     footerBar.style.height = newFooterHeight + 'px';
  //     scroller.style.bottom = newFooterHeight + 'px'; 
  //   });
})
.controller('AccountCtrl', function($scope) {
  $scope.user = user;
})
.controller('TimetableCtrl', function($scope, $ionicSideMenuDelegate, $stateParams, Auth, $cordovaSQLite, $ionicSlideBoxDelegate) {
  $scope.loading = true;
  $scope.title = "Timetable";
  if(db) {
    $cordovaSQLite.execute(db, "SELECT value from mydata WHERE key = ?", ["tt_"+$stateParams.id]).then(function(tres) {
      if(tres.rows.length > 0) {
        processData(angular.fromJson(tres.rows.item(0).value));
      } else {
        if(online) timetableFromServer();
        else $scope.empty = true;
      }
    })
  }
  var processData = function(timetable) {
    $scope.loading = false;
    if(timetable){
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
      if(online) Auth.saveLocal("tt_"+$stateParams.id, timetable);
    } else {
      $scope.empty = true;
    }
  }
  var timetableFromServer = function() {
    if(timetableref[$stateParams.id]) {
      var ref = timetableref[$stateParams.id];
    } else {
      var ref = Auth.getTimetable($stateParams.id);
    }
    ref.on('value', function(tdata) {
      var timetable = tdata.val() || {};
      processData(timetable);
    })
  }
  if($stateParams.id.indexOf("simplelogin") == -1) {
    $scope.classStatus = false;
  } else {
    $scope.classStatus = true;
  }
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
  //$ionicSideMenuDelegate.$getByHandle('my-handle').canDragContent(false);
})
.controller('DaysCtrl', function($scope, $ionicSideMenuDelegate, $stateParams, Auth, $cordovaSQLite, $ionicSlideBoxDelegate) {
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var keys = [];
  $scope.loading = true;
  $scope.title = $stateParams.type;
  var d = new Date();
  var year = d.getFullYear();
  var month = d.getMonth();
  var lkey = ($stateParams.class) ? user.uid + $stateParams.type + $stateParams.class : user.uid + $stateParams.type;
  if(db) {
    $cordovaSQLite.execute(db, "SELECT value from mydata WHERE key = ?", [lkey]).then(function(tres) {
      if(tres.rows.length > 0) {
        processData(angular.fromJson(tres.rows.item(0).value));
      } else {
        if(online) timetableFromServer();
        else $scope.empty = true;
      }
    })
  }
  var processData = function(daysData) {
    $scope.loading = false;
    keys = Object.keys(daysData);
    if(keys.length > 0){
      $scope.data = {
        numViewableSlides : keys.length,
        slideIndex : 0,
        initialInstruction : true,
        secondInstruction : false,
        slides: daysData,
      };
      var skey = keys[0].split("-");
      $scope.title = months[parseInt(skey[1]) - 1] + " " + skey[0];
      if(online) Auth.saveLocal(lkey, daysData);
    } else {
      $scope.empty = true;
    }
  }
  var timetableFromServer = function() {
    if($stateParams.class) {
      if(days[$stateParams.type][$stateParams.class]) {
        var dref = days[$stateParams.type][$stateParams.class];
      } else {
        var start = parseInt(year +''+ ("0" + (month + 1)).slice(-2));
        var dref = Auth.getExams($stateParams.class, start);
      }
    } else {
      var dref = days[$stateParams.type];
    }
    dref.on('value', function(tdata) {
      var timetable = tdata.val() || {};
      processData(timetable);
    })
  }

  $scope.classStatus = true;
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
    $scope.title = months[parseInt(keys[index].split("-")[1]) - 1] + " " + keys[index].split("-")[0];
  };
  //$ionicSideMenuDelegate.$getByHandle('my-handle').canDragContent(false);
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