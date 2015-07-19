// Ionic Starter App
var user = {};
var db = null;
var filtersData = {};
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'ngCordova', 'ionic.service.core', 'ionic.service.push','ionic.service.analytics','starter.controllers'])
.config(function($ionicAppProvider) {
  // Identify app
  $ionicAppProvider.identify({
    // The App ID (from apps.ionic.io) for the server
    app_id: 'e6a31325',
    // The public API key all services will use for this app
    api_key: '1ae10240baf86725717f8d4117a1e7a1d28444a36dac62f5',
    // Set the app to use development pushes
    dev_push: true,
    gcm_id:'15680569383'
  });  
})
.run(function($ionicPlatform, $cordovaSQLite) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.sqlitePlugin) {
      db = $cordovaSQLite.openDB({ name: "mytest.db" });
    } else {
      db = window.openDatabase("mytest.db", "1.0", "my test data", 200000);
    }
//    $cordovaSQLite.execute(db, "DROP TABLE marks");
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS marks (key text, value blob, created)");
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS users (key text, value blob, created)");

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
/*  $ionicPlatform.registerBackButtonAction(function (event) {
    if($state.current.name=="home"){
      navigator.app.exitApp();
    }
    else {
      navigator.app.backHistory();
    }
  }, 100);*/
})

.directive('ionSearch', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            getData: '&source',
            model: '=?',
            search: '=?filter'
        },
        link: function(scope, element, attrs) {
            attrs.minLength = attrs.minLength || 0;
            scope.placeholder = attrs.placeholder || '';
            scope.search = {value: ''};
            if (attrs.class)
              element.addClass(attrs.class);

            if (attrs.source) {
              scope.$watch('search.value', function (newValue, oldValue) {
                console.log('newValue', newValue);
                console.log('oldValue', oldValue);
                  if (newValue.length > attrs.minLength) {
                    scope.getData({str: newValue}).then(function (results) {
                      scope.model = results;
                    });
                  } else {
                    scope.model = [];
                  }
              });
            }

            scope.clearSearch = function() {
                scope.search.value = '';
            };
        },
        template: '<div class="item-input-wrapper">' +
                    '<i class="icon ion-android-search"></i>' +
                    '<input type="search" placeholder="{{placeholder}}" ng-model="search.value">' +
                    '<i ng-if="search.value.length > 0" ng-click="clearSearch()" class="icon ion-close"></i>' +
                  '</div>'
    };
})
.directive('chart', function() {
    return {
        restrict: 'E',
        template: '<div></div>',
        replace: true,
        scope: {
            config: '='
        },
        link: function (scope, element, attrs) {
            var chart; 
            var process = function () {
                var defaultOptions = {
                    chart: {renderTo: element[0], animation:true},
                    colors: ['#23b7e5', '#ff6c60', '#90ed7d', '#f7a35c', '#8085e9', 
   '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1']
                };
                var config = angular.extend(defaultOptions, scope.config);
                chart = new Highcharts.Chart(config);
            };
            process();
            scope.$watch("config.series", function (loading) {
                process();
            });
            scope.$watch("config.loading", function (loading) {
                if (!chart) {
                    return;
                } 
                if (loading) {
                    chart.showLoading();
                } else {
                    chart.hideLoading();
                }
            });
        },
    };
})

.config(function($stateProvider, $urlRouterProvider, $compileProvider) {
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|file|blob|cdvfile|content):|data:image\//);
  $stateProvider
  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html",
    controller: 'AppCtrl'
  })
  .state('app.hmdashboard', {
    url: "/hmdashboard",
    views: {
      'menuContent' :{
        templateUrl: "templates/hmdashboard.html",
        controller: 'HmDashboardCtrl'
      }
    }
  })
 .state('app.dashboard', {
    url: "/dashboard",
    views: {
      'menuContent' :{
        templateUrl: "templates/dashboard.html",
        controller: 'DashboardCtrl'
      }
    }
  })
  .state('app.dashboardId', {
    url: "/dashboard/:standard/:division",
    views: {
      'menuContent' :{
        templateUrl: "templates/dashboard.html",
        controller: 'DashboardCtrl'
      }
    }
  })
 .state('app.teacherdashboard', {
    url: "/teacherdashboard",
    views: {
      'menuContent' :{
        templateUrl: "templates/teacherdashboard.html",
        controller: 'TeacherDashboardCtrl'
      }
    }
  })
 .state('app.teacherdashboardId', {
    url: "/teacherdashboard/:teacher/:teacherid",
    views: {
      'menuContent' :{
        templateUrl: "templates/teacherdashboard.html",
        controller: 'TeacherDashboardCtrl'
      }
    }
  })
 .state('app.studentDashboard', {
    url: "/studentdashboard",
    views: {
      'menuContent' :{
        templateUrl: "templates/studentdashboard.html",
        controller: 'StudentDashboardCtrl'
      }
    }
  })
 .state('app.studentDashboardId', {
    url: "/studentdashboard/:studentid/:studentname",
    views: {
      'menuContent' :{
        templateUrl: "templates/studentdashboard.html",
        controller: 'StudentDashboardCtrl'
      }
    }
  })
  .state('app.studentOverallDashboard', {
    url: "/studentoveralldashboard",
    views: {
      'menuContent' :{
        templateUrl: "templates/studentoverall.html",
        controller: 'StudentOverallDashboardCtrl'
      }
    }
  })
  .state('app.studentOverallDashboardId', {
    url: "/studentoveralldashboard/:studentid/:studentname",
    views: {
      'menuContent' :{
        templateUrl: "templates/studentoverall.html",
        controller: 'StudentOverallDashboardCtrl'
      }
    }
  })  
  .state('app.allclasses', {
    url: "/allclasses",
    views: {
      'menuContent' :{
        templateUrl: "templates/allclasses.html",
        controller: 'AllClassesCtrl'
      }
    }
  })
  .state('app.allstudents', {
    url: "/allstudents",
    views: {
      'menuContent' :{
        templateUrl: "templates/allstudents.html",
        controller: 'AllStudentsCtrl'
      }
    }
  })
  .state('app.studentsfiltered', {
    url: "/studentsfiltered/:year/:typeofexam/:standard/:division/:status/:subject/:grade",
    views: {
      'menuContent' :{
        templateUrl: "templates/studentsfiltered.html",
        controller: 'StudentsFilteredCtrl'
      }
    }
  })
  .state('app.allteachers', {
    url: "/allteachers",
    views: {
      'menuContent' :{
        templateUrl: "templates/allteachers.html",
        controller: 'AllTeachersCtrl'
      }
    }
  })  
 .state('app.allstudentsFilters', {
    url: "/allstudents/:standard/:division/:sex/:status",
    views: {
      'menuContent' :{
        templateUrl: "templates/allstudents.html",
        controller: 'AllStudentsCtrl'
      }
    }
  })           
  .state('app.classProf', {
    url: "/classprofile",
    views: {
      'menuContent' :{
        templateUrl: "templates/classprofile.html",
        controller: 'ClassProfileCtrl'
      }
    }
  })              
  .state('app.studentProf', {
    url: "/studentprofile",
    views: {
      'menuContent' :{
        templateUrl: "templates/studentprofile.html",
        controller: 'StudentProfileCtrl'
      }
    }
  })   
  .state('app.teacherProf', {
    url: "/teacherprofile",
    views: {
      'menuContent' :{
        templateUrl: "templates/teacherprofile.html",
        controller: 'TeacherProfileCtrl'
      }
    }
  })
  .state('app.classProfile', {
    url: "/classprofile/:standard/:division",
    views: {
      'menuContent' :{
        templateUrl: "templates/classprofile.html",
        controller: 'ClassProfileCtrl'
      }
    }
  })            
  .state('app.studentProfile', {
    url: "/studentprofile/:studentid",
    views: {
      'menuContent' :{
        templateUrl: "templates/studentprofile.html",
        controller: 'StudentProfileCtrl'
      }
    }
  })
  .state('app.teacherProfile', {
    url: "/teacherprofile/:teacher",
    views: {
      'menuContent' :{
        templateUrl: "templates/teacherprofile.html",
        controller: 'TeacherProfileCtrl'
      }
    }
  })
  .state('app.wall', {
    url: "/wall",
    views: {
      'menuContent' :{
        templateUrl: "templates/wall.html",
        controller: 'WallCtrl'
      }
    }
  })     
  .state('app.addpost', {
    url: "/addpost",
    views: {
      'menuContent' :{
        templateUrl: "templates/addpost.html",
        controller: 'AddPostCtrl'
      }
    }
  })
  .state('app.messages', {
    url: "/messages",
    views: {
      'menuContent' :{
        templateUrl: "templates/messages.html",
        controller: 'MessagesCtrl'
      }
    }
  })  
  .state('app.messagesId', {
    url: "/messages/:userId",
    views: {
      'menuContent' :{
        templateUrl: "templates/messages.html",
        controller: 'MessagesCtrl'
      }
    }
  })    
  .state('app.messagebox', {
    url: "/messages/:chatname/:toId/:toName/:userId/:name/:type",
    views: {
      'menuContent' :{
        templateUrl: "templates/messagebox.html",
        controller: 'MessageBoxCtrl'
      }
    }
  })
  .state('app.timetable', {
    url: "/timetable",
    views: {
      'menuContent' :{
        templateUrl: "templates/timetable.html",
        controller: 'TimeTableCtrl'
      }
    }
  })
  .state('app.ttable', {
    url: "/timetable/:class/:subject",
    views: {
      'menuContent' :{
        templateUrl: "templates/timetable.html",
        controller: 'TimeTableCtrl'
      }
    }
  }) 
  .state('home', {
    url: '/home',
    templateUrl: 'templates/home.html',
    controller: 'LoginCtrl'
  })
  .state('logout', {
      url: '/logout',
      templateUrl: 'templates/home.html',
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/home');
})