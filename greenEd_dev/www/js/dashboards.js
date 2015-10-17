angular.module('dashboards', [])
.controller("HmDashboardCtrl", function($scope, $state, $cordovaSQLite, $rootScope, myCache, $ionicModal, Auth, $ionicLoading, $timeout) {
  var key = '';
  var save = true;
  $scope.getMarksData = function() {
    $scope.empty = false;
    $scope.dashboard = false;
    if(filters) key = filters.years[filters.year] +'_'+ filters.exams[filters.exam];
    else key = false;
    if(key) {
      $scope.title = filters.exams[filters.exam] +' '+ filters.years[filters.year];
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
    if(filters) key = filters.years[filters.year] +'_'+ filters.exams[filters.exam];
    else key = false;
    if(key) {
      $scope.title = $stateParams.class +" "+ filters.exams[filters.exam] +' '+ filters.years[filters.year];
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
    if(filters) key = filters.years[filters.year] +'_'+ filters.exams[filters.exam];
    else key = false;
    if(key) {
      $scope.title = $stateParams.name +" "+ filters.exams[filters.exam] +' '+ filters.years[filters.year];
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
    if(filters) key = filters.years[filters.year] +'_'+ filters.exams[filters.exam];
    else key = false;
    if(key) {
      $scope.title = $stateParams.name +' '+ filters.exams[filters.exam] +' '+ filters.years[filters.year];
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
    if(filters) key = filters.years[filters.year];
    else key = false;
    if(key) {
      $scope.title = $stateParams.name +' '+ filters.years[filters.year];
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
  $scope.getItems = function(refresh) {
    $scope.items = user.subjects;
    if(refresh) $scope.$broadcast('scroll.refreshComplete');
  }
})

.controller("AllStudentsCtrl", function($scope, $rootScope, $stateParams, $cordovaSQLite, Auth, $ionicFilterBar, $timeout) {
  var filterBarInstance;
  if($stateParams.id) {
    var hw = $rootScope.homeworks[$stateParams.uid].$getRecord($stateParams.id);
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