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
    console.log("Key:", key);
    if(key) {
      var mcache = myCache.get(key) || {};
      console.log("marks cache", mcache);
      if(cache && mcache["pass"]) {
        $scope.dashboard = true;
        $scope.$broadcast('scroll.refreshComplete');
        applyMarks(mcache);
      } else {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
        console.log("fetch from fb");
        var ref = Auth.getMarks(key);
        ref.on("value", function(snapshot) {
          var alldata = snapshot.val();
          var count = 0;
          if(!alldata) { $scope.empty = true; return;}
          var dmarks = {pass:0,fail:0,Pass:[],Fail:[],allSubjects:[],subjectPass:[], subjectFail:[],subjectPassUsers:{}, subjectFailUsers:{}, gradeData:[], gradeUsers:{}, toppers:[]};
          var grades = [];
          var totalrecords = Object.keys(alldata).length;
          console.log("total records", totalrecords);
          for(var snapmark in alldata) {
            count++;
            var mark = alldata[snapmark];
            if(mark.status == "Pass") {dmarks.pass++; dmarks.Pass.push({class:mark.class,uid:mark.studentid,name:mark.student}); }
            if(mark.status == "Fail") {dmarks.fail++; dmarks.Fail.push({class:mark.class,uid:mark.studentid,name:mark.student}); }
            for(var mm in mark.marks) {
              if(dmarks.allSubjects.indexOf(mm) == -1) {
                dmarks.allSubjects.push(mm);
                dmarks.subjectPassUsers[mm] = []; dmarks.subjectFailUsers[mm] = [];
                if(mark.marks[mm].status == "Pass") {
                  dmarks.subjectPass.push({name:"Pass", y:1});
                  dmarks.subjectFail.push({name:"Fail", y:0});
                  dmarks.subjectPassUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
                } else {
                  dmarks.subjectPass.push({name:"Pass", y:0});
                  dmarks.subjectFail.push({name:"Fail", y:1});
                  dmarks.subjectFailUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
                }
              } else {
                if(mark.marks[mm].status == "Pass") {
                  dmarks.subjectPass[dmarks.allSubjects.indexOf(mm)].y++;
                  dmarks.subjectPassUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
                } else {
                  dmarks.subjectFail[dmarks.allSubjects.indexOf(mm)].y++;
                  dmarks.subjectFailUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
                }
              }
            }
            if(grades.indexOf(mark.grade) == -1) {
              grades.push(mark.grade);
              dmarks.gradeData.push({name: mark.grade, y:1});
              dmarks.gradeUsers[mark.grade] = [{class:mark.class,uid:mark.studentid, name:mark.student}];
            } else {
              dmarks.gradeData[grades.indexOf(mark.grade)].y++;
              dmarks.gradeUsers[mark.grade].push({class:mark.class,uid:mark.studentid, name:mark.student});
            }
            if(mark.rank == 1) {
              dmarks.toppers.push({student: mark.student, standard: mark.standard, class: mark.class, total: mark.total, studentid: mark.studentid});
            }
            dmarks[mark.studentid] = mark;
            if(count == totalrecords) {
              $scope.dashboard = true;
              myCache.put(key, dmarks);
              $scope.$broadcast('scroll.refreshComplete');
              console.log("applying marks");
              $ionicLoading.hide();
              applyMarks(dmarks);
            }
          };
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
    console.log("Key:", key);
    if(key) {
      var mcache = myCache.get(key);
      console.log("marks cache", mcache);
      if(cache && mcache[$stateParams.class]) {
        $scope.dashboard = true;
        $scope.$broadcast('scroll.refreshComplete');
        applyMarks(mcache[$stateParams.class]);
      } else {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
        console.log("fetch from fb");
        var ref = Auth.getFilteredMarks(key, "class", $stateParams.class);
        ref.on("value", function(snapshot) {
          var alldata = snapshot.val();
          var count = 0;
          if(!alldata) { $scope.empty = true; return;}
          var dmarks = {pass:0,fail:0,Pass:[],Fail:[],allSubjects:[],subjectPass:[], subjectFail:[],subjectPassUsers:{}, subjectFailUsers:{}, gradeData:[], gradeUsers:{}, toppers:[]};
          var grades = [];
          var totalrecords = Object.keys(alldata).length;
          console.log("total records", totalrecords);
          for(var snapmark in alldata) {
            count++;
            var mark = alldata[snapmark];
            if(!dmarks[mark.class]) dmarks[mark.class] = {pass:0,fail:0, Pass:[], Fail:[], allSubjects:[],subjectPass:[], subjectFail:[], subjectPassUsers:{}, subjectFailUsers:{}, gradeData:[], gradeUsers:{}, toppers:[]};
            if(mark.status == "Pass") {dmarks.pass++; dmarks.Pass.push({class:mark.class,uid:mark.studentid,name:mark.student}); dmarks[mark.class].pass++; dmarks[mark.class].Pass.push({class:mark.class,uid:mark.studentid,name:mark.student});}
            if(mark.status == "Fail") {dmarks.fail++; dmarks.Fail.push({class:mark.class,uid:mark.studentid,name:mark.student}); dmarks[mark.class].fail++; dmarks[mark.class].Fail.push({class:mark.class,uid:mark.studentid,name:mark.student});}
            for(var mm in mark.marks) {
              if(dmarks.allSubjects.indexOf(mm) == -1) {
                dmarks.allSubjects.push(mm);
                dmarks.subjectPassUsers[mm] = []; dmarks.subjectFailUsers[mm] = [];
                if(mark.marks[mm].status == "Pass") {
                  dmarks.subjectPass.push({name:"Pass", y:1});
                  dmarks.subjectFail.push({name:"Fail", y:0});
                  dmarks.subjectPassUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
                } else {
                  dmarks.subjectPass.push({name:"Pass", y:0});
                  dmarks.subjectFail.push({name:"Fail", y:1});
                  dmarks.subjectFailUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
                }
              } else {
                if(mark.marks[mm].status == "Pass") {
                  dmarks.subjectPass[dmarks.allSubjects.indexOf(mm)].y++;
                  dmarks.subjectPassUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
                } else {
                  dmarks.subjectFail[dmarks.allSubjects.indexOf(mm)].y++;
                  dmarks.subjectFailUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
                }
              }
              if(dmarks[mark.class].allSubjects.indexOf(mm) == -1) {
                dmarks[mark.class].allSubjects.push(mm);
                dmarks[mark.class].subjectPassUsers[mm] = []; dmarks[mark.class].subjectFailUsers[mm] = [];
                if(mark.marks[mm].status == "Pass") {
                  dmarks[mark.class].subjectPass.push({name:mm, y:1});
                  dmarks[mark.class].subjectPassUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
                  dmarks[mark.class].subjectFail.push({name:mm, y:0});
                } else {
                  dmarks[mark.class].subjectPass.push({name:mm, y:0});
                  dmarks[mark.class].subjectFail.push({name:mm, y:1});
                  dmarks[mark.class].subjectFailUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
                }
              } else {
                if(mark.marks[mm].status == "Pass") {
                  dmarks[mark.class].subjectPass[dmarks[mark.class].allSubjects.indexOf(mm)].y++;
                  dmarks[mark.class].subjectPassUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
                } else {
                  dmarks[mark.class].subjectFail[dmarks[mark.class].allSubjects.indexOf(mm)].y++;
                  dmarks[mark.class].subjectFailUsers[mm].push({class:mark.class,uid:mark.studentid, name:mark.student});
                }
              }              
            }
            if(grades.indexOf(mark.grade) == -1) {
              grades.push(mark.grade);
              dmarks.gradeData.push({name: mark.grade, y:1});
              dmarks[mark.class].gradeData.push({name: mark.grade, y:1});
              dmarks.gradeUsers[mark.grade] = [{class:mark.class,uid:mark.studentid, name:mark.student}];
            } else {
              dmarks.gradeData[grades.indexOf(mark.grade)].y++;
              dmarks[mark.class].gradeData[grades.indexOf(mark.grade)].y++;
              dmarks.gradeUsers[mark.grade].push({class:mark.class,uid:mark.studentid, name:mark.student});
            }
            if(mark.rank == 1) {
              dmarks.toppers.push({student: mark.student, standard: mark.standard, class: mark.class, total: mark.total, studentid: mark.studentid});
              dmarks[mark.class].toppers.push({student: mark.student, standard: mark.standard, class: mark.class, total: mark.total, studentid: mark.studentid});
            }
            if(count == totalrecords) {
              $scope.dashboard = true;
              mcache[$stateParams.class] = dmarks;
              myCache.put(key, mcache);
              $scope.$broadcast('scroll.refreshComplete');
              console.log("applying marks");
              $ionicLoading.hide();
              applyMarks(dmarks);
            }
          };
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
        console.log("fetch from fb");
        var ref = Auth.getMarks(key);
        ref.on("value", function(snapshot) {
          var alldata = snapshot.val();
          var totalrecords = Object.keys(alldata).length;
          console.log("total records", totalrecords);
          if(!alldata) { $scope.empty = true; return;}
          var dmarks = {pass:0,fail:0,Pass:[],Fail:[],allSubjects:[],subjectPass:[], subjectFail:[],subjectPassUsers:{}, subjectFailUsers:{}, gradeData:[], gradeUsers:{}, toppers:{}};
          var grades = [];
          var topmark = {};
          var count = 0;
          for(var snapmark in alldata) {
            count++;
            var mark = alldata[snapmark];
            for(var smark in mark.marks) {
              if(mark.marks[smark].teacherid == $stateParams.uid) {
                if(mark.marks[smark].status == "Pass") {}
                if(mark.marks[smark].status == "Fail") {}
                if(dmarks.allSubjects.indexOf(smark) == -1) {
                  dmarks.allSubjects.push(smark);
                  dmarks.subjectPassUsers[smark] = []; dmarks.subjectFailUsers[smark] = [];
                  if(mark.marks[smark].status == "Pass") {
                    dmarks.subjectPass.push({name:"Pass", y:1});
                    dmarks.subjectFail.push({name:"Fail", y:0});
                    dmarks.subjectPassUsers[smark].push({class:mark.class,uid:mark.studentid, name:mark.student});
                    dmarks.pass++; dmarks.Pass.push({class:mark.class,uid:mark.studentid,name:mark.student});
                  } else {
                    dmarks.subjectPass.push({name:"Pass", y:0});
                    dmarks.subjectFail.push({name:"Fail", y:1});
                    dmarks.subjectFailUsers[smark].push({class:mark.class,uid:mark.studentid, name:mark.student});
                    dmarks.fail++; dmarks.Fail.push({class:mark.class,uid:mark.studentid,name:mark.student});
                  }
                } else {
                  if(mark.marks[smark].status == "Pass") {
                    dmarks.subjectPass[dmarks.allSubjects.indexOf(smark)].y++;
                    dmarks.subjectPassUsers[smark].push({class:mark.class,uid:mark.studentid, name:mark.student});
                    dmarks.pass++; dmarks.Pass.push({class:mark.class,uid:mark.studentid,name:mark.student});
                  } else {
                    dmarks.subjectFail[dmarks.allSubjects.indexOf(smark)].y++;
                    dmarks.subjectFailUsers[smark].push({class:mark.class,uid:mark.studentid, name:mark.student});
                    dmarks.fail++; dmarks.Fail.push({class:mark.class,uid:mark.studentid,name:mark.student});
                  }
                }
/*                if(grades.indexOf(mark.marks[smark].grade) == -1) {
                  grades.push(mark.marks[smark].grade);
                  dmarks.gradeData.push({name: mark.marks[smark].grade, y:1});
                  dmarks[mark.class].gradeData.push({name: mark.marks[smark].grade, y:1});
                  dmarks.gradeUsers[mark.marks[smark].grade] = [{class:mark.class,uid:mark.studentid, name:mark.student}];
                } else {
                  dmarks.gradeData[grades.indexOf(mark.marks[smark].grade)].y++;
                  dmarks[mark.class].gradeData[grades.indexOf(mark.marks[smark].grade)].y++;
                  dmarks.gradeUsers[mark.marks[smark].grade].push({class:mark.class,uid:mark.studentid, name:mark.student});
                }*/
                if(!topmark[mark.class+'_'+smark]) {
                  topmark[mark.class+'_'+smark] = mark.marks[smark].mark;
                  dmarks.toppers[mark.class+'_'+smark] = {student: mark.student, standard: mark.standard, class: mark.class, total: mark.total, studentid: mark.studentid};
                } else if (topmark[mark.class+'_'+smark] < mark.marks) {
                  dmarks.toppers[mark.class+'_'+smark] = {student: mark.student, standard: mark.standard, class: mark.class, total: mark.total, studentid: mark.studentid};
                }
              }
            }
            if(count == totalrecords) {
              $scope.dashboard = true;
              mcache[$stateParams.uid] = dmarks;
              myCache.put(key, mcache);
              $scope.$broadcast('scroll.refreshComplete');
              console.log("applying marks");
              $ionicLoading.hide();
              applyMarks(dmarks);
            }
          };
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
      console.log("marks cache", mcache);
      if(cache && mcache[$stateParams.uid]) {
        $scope.dashboard = true;
        $scope.$broadcast('scroll.refreshComplete');
        applyMarks(mcache[$stateParams.uid]);
      } else {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner>'});
        console.log("fetch from fb");
        var ref = Auth.getFilteredMarks(key, "studentid", $stateParams.uid);
        ref.on("value", function(snapshot) {
          snapshot.forEach(function(markdata) {
            $ionicLoading.hide();
            var mark = markdata.val();
            console.log("mark data", mark);
            if(!mark) { $scope.empty = true; return;}
            mcache[$stateParams.uid] = mark;
            applyMarks(mark);
          })
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

.controller("StudentOverallDashboardCtrl", function($scope) {

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
  var title = $stateParams.filter.replace("_", " ") + " ";
  var cache = myCache.get($stateParams.filter);
  console.log("Params", $stateParams);
  if($stateParams.type != "hm") {
    cache = cache[$stateParams.type];
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
