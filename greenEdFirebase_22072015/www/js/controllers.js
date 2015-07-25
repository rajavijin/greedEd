angular.module('starter.controllers', ['starter.services'])

.controller('AppCtrl', function($scope, $rootScope, MyService) {
  if(!user && localStorage.getItem("uid")) {
    $rootScope.login({uid:localStorage.getItem("uid")});
  }
  if(user && $rootScope.updateMenu) {
    console.log("updating menu");
    $scope.menuLinks = MyService.getMenus();
    console.log("menu items", $scope.menuLinks);
    $rootScope.updateMenu = false;
  }

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});
})

.controller("HmDashboardCtrl", function($scope, $firebaseArray, $rootScope, myCache, $ionicModal) {
  $scope.dashboardFilters = function() {
    console.log("Filters", $rootScope.filters);
    key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
    $scope.getMarksData(true);
    $scope.closeModal();
  }

  $ionicModal.fromTemplateUrl('templates/dashboardFilters.html', {
    scope: $rootScope,
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

/*  //Cleanup the modal when we're done with it!
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
  });  */

  $scope.filterData = function() {
    $scope.openModal();
  }

  $scope.getMarksData = function(cache) {

    if($rootScope.filters)
      var key = $rootScope.filters.educationyears[$rootScope.filters.educationyear] +'_'+ $rootScope.filters.typeofexams[$rootScope.filters.typeofexam];
    else var key = false;
    
    if(key) {
      $scope.dashboardStatus = true;
      var dcache = myCache.get(key);
      console.log("dcache", dcache);
      console.log("key", key);
      if(cache && dcache) {
        applyMarks(dcache);
      } else {
        console.log("fetching from firebase", $rootScope.baseUrl+'/'+user.schoolid+'/marks/'+key);
        var ref = new Firebase($rootScope.baseUrl+'/'+user.schoolid+'/marks/'+key);
        ref.on("value", function(snapshot) {
          console.log("Marks updating....");
          var alldata = snapshot.val();
          var count = 0;
          if(!alldata) return;
          var dmarks = {pass:0,fail:0,allSubjects:[],subjectPass:[], subjectFail:[], gradeData:[], toppers:[], filters:{educationyears:[],typeofexams:[]}};
          var grades = [];
          var totalrecords = Object.keys(alldata).length;
          console.log("total records", totalrecords);
          for(var snapmark in alldata) {
            count++;
            var mark = alldata[snapmark];
            if(mark.status == "Pass") dmarks.pass++;
            if(mark.status == "Fail") dmarks.fail++;
            for(var mm in mark.marks) {
              if(dmarks.allSubjects.indexOf(mm) == -1) {
                dmarks.allSubjects.push(mm);
                if(mark.marks[mm].status == "Pass") {
                  dmarks.subjectPass.push({name:mm, y:1});
                  dmarks.subjectFail.push({name:mm, y:0});
                } else {
                  dmarks.subjectPass.push({name:mm, y:0});
                  dmarks.subjectFail.push({name:mm, y:1});
                }
              } else {
                if(mark.marks[mm].status == "Pass") {
                  dmarks.subjectPass[dmarks.allSubjects.indexOf(mm)].y++;
                } else {
                  dmarks.subjectFail[dmarks.allSubjects.indexOf(mm)].y++;
                }
              }
            }
            if(grades.indexOf(mark.grade) == -1) {
              grades.push(mark.grade);
              dmarks.gradeData.push({name: mark.grade, y:1});
            } else {
              dmarks.gradeData[grades.indexOf(mark.grade)].y++;
            }
            if(mark.rank == 1) {
              dmarks.toppers.push({student: mark.student, standard: mark.standard, class: mark.class, total: mark.total, studentid: mark.studentid});
            }
            if(dmarks.filters.educationyears.indexOf(mark.educationyear) == -1)
              dmarks.filters.educationyears.push(mark.educationyear);
            if(dmarks.filters.typeofexams.indexOf(mark.typeofexam) == -1)
              dmarks.filters.typeofexams.push(mark.typeofexam);
            console.log("each record");
            if(count == totalrecords) {
              if(!$scope.filters.educationyear) dmarks.filters.educationyear = dmarks.filters.educationyears.length - 1;
              if(!$scope.filters.typeofexam) dmarks.filters.typeofexam = dmarks.filters.typeofexams.length - 1;
              console.log("Final");
              myCache.put(key, dmarks);
              if(cache)
                $scope.$broadcast('scroll.refreshComplete');
              console.log("applying marks");
              applyMarks(dmarks);
            }
          };
        });      
      }
    } else {
      $scope.dashboardStatus = false;
    }
  }

  var applyMarks = function(marks) {
    console.log("Marks", marks);
    $scope.toppers = marks.toppers;
    $scope.passfailConfig = {
      chart: {renderTo: 'passfailstatus',type: 'pie',height:200,options3d:{enabled: true,alpha: 45,beta: 0},},
      title: {text:"Pass/Fail"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.studentsfiltered", {year:params.year,typeofexam:params.typeofexam,standard:"all",division:"all",status:event.point.name,subject:"all"});}}},pie: {innerSize: 50,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: [{name:"Pass", y:marks.pass},{name:"Fail", y:marks.fail}]}]
    };
    $scope.subjectsConfig = {
      chart: {renderTo: 'subjects',type: 'column', options3d: {enabled: true,alpha: 10,beta: 20,depth: 50}},
      title: {text:"Subjects Pass/Fail"},tooltip:{pointFormat:'<span style="color:{point.color}">\u25CF</span> {point.category}: <b>{point.y}</b>'},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.studentsfiltered", {year:params.year,typeofexam:params.typeofexam,standard:"all",division:"all",status:event.point.name,subject:event.point.category});}}},column: {depth: 25,dataLabels: {enabled: true,format: '{point.y}'}}},
      xAxis: {categories: marks.allSubjects},
      yAxis: {title: {text: null}},
      series: [{name: 'Pass',data: marks.subjectPass},{name: 'Fail',data: marks.subjectFail}]
    }; 
    $scope.gradeConfig = {
      chart: {renderTo: 'grades',type: 'pie',height: 200,options3d:{enabled: true,alpha: 45,beta: 0}},
      title: {text:"Grades"},plotOptions: {series:{cursor:'pointer',events:{click:function(event){$state.go("app.studentsfiltered", {year:params.year,typeofexam:params.typeofexam,standard:"all",division:"all",status:"all",subject:"all",grade:event.point.name});}}},pie: {innerSize: 0,depth: 35,dataLabels:{enabled: true,format: '{point.name}: <b>{point.y}</b>'}}},
      series: [{type: 'pie',name: 'Total',data: marks.gradeData}]
    };
    $scope.$apply();
  }
})

.controller("DashboardCtrl", function($scope) {

})

.controller("TeacherDashboardCtrl", function($scope) {

})

.controller("StudentDashboardCtrl", function($scope) {

})

.controller("StudentOverallDashboardCtrl", function($scope) {

})

.controller("AllClassesCtrl", function($scope) {
  console.log("Classes", allusers["allclasses"]);
  $scope.filterToggle = function() {$scope.filterStatus = !$scope.filterStatus;}
  if(allusers["allclasses"]) {
    $scope.allClasses = true;
    $scope.classes = allusers["allclasses"];
  } else {
    $scope.allClasses = false;
  }
})

.controller("AllStudentsCtrl", function($scope) {
  $scope.title = "All Students";
  console.log("Students", allusers["allstudents"].length);
  $scope.filterToggle = function() {$scope.filterStatus = !$scope.filterStatus;}
  if(allusers["allstudents"]) {
    $scope.allStudentsStatus = true;
    $scope.users = allusers["allstudents"];
  } else {
    $scope.allStudentsStatus = false;
  }
})

.controller("AllTeachersCtrl", function($scope) {
  console.log("Teachers", allusers["allteachers"])
  $scope.filterToggle = function() {$scope.filterStatus = !$scope.filterStatus;}
  if(allusers["allteachers"]) {
    $scope.allStudentsStatus = true;
    $scope.users = allusers["allteachers"];
  } else {
    $scope.allStudentsStatus = false;
  }
})

.controller("MarkStudentsCtrl", function($scope, $stateParams) {
  if(allmarks[$stateParams.key]) {
    $scope.allStudentsStatus = true;
    $scope.users = allmarks[$stateParams.key];
  } else {
    $scope.allStudentsStatus = false;
  }
})

.controller('SignInCtrl', function($scope, $rootScope, $firebaseAuth, $firebaseObject, $state, $ionicLoading, $ionicPopup) {
  
  // check session
  $rootScope.checkSession();

  $scope.user = {
      email: "8951572125@ge.com",
      password: "lm3oko6r"
  };
  $scope.validateUser = function() {
    $ionicLoading.show({template:'Please wait.. Authenticating'});
    var email = this.user.email;
    var password = this.user.password;
    if (!email || !password) {
        $ionicPopup.alert({template:"Please enter valid credentials"});
        return false;
    }

    $rootScope.auth.$authWithPassword({
        email: email,
        password: password
    }).then(function(userdetails) {
        $rootScope.login(userdetails);
    }, function(error) {
        $ionicLoading.hide();
        console.log("error code", error);
        if (error.code == 'INVALID_EMAIL') {
            $ionicPopup.alert({template:'Invalid Email Address'});
        } else if (error.code == 'INVALID_PASSWORD') {
            $ionicPopup.alert({template:'Invalid Password'});
        } else if (error.code == 'INVALID_USER') {
            $ionicPopup.alert({template:'Invalid User'});
        } else {
            $ionicPopup.alert({template:'Oops something went wrong. Please try again later'});
        }
    });
  }
});