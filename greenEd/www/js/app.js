'use strict';

/**
 * @ngdoc overview
 * @name Demo
 * @description
 * # Initializes main application and routing
 *
 * Main module of the application.
 */

var isIOS = ionic.Platform.isIOS();
angular.module('starter', ['ionic', 'jett.ionic.filter.bar', 'starter.controllers','firebase','ngCordova'])
.constant('FIREBASE_URL', 'https://sizzling-fire-6207.firebaseio.com/')

.run(function($ionicPlatform, $http, $rootScope, Auth, FIREBASE_URL, $firebaseObject, $cordovaSQLite, $firebaseArray) {
  $ionicPlatform.ready(function() {
    //$rootScope.walls = $firebaseArray(ref.child("-JwVp4kJ36Uv06GOEvlk/wall").limitToLast(25));
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }
    if (window.cordova) {
      db = $cordovaSQLite.openDB({ name: "my.db", bgType: 1 });
      if(window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }
    } else {
      db = openDatabase('mydb', '1.0', 'my first database', 2 * 1024 * 1024);
    }
    //$cordovaSQLite.execute(db, "DROP TABLE mydata");
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS mydata (key text, value blob, unique (key))");

    scrollRef = new Firebase.util.Scroll(ref.child("-JwVp4kJ36Uv06GOEvlk/wall"), '$priority');
    $rootScope.walls = $firebaseArray(scrollRef);
    scrollRef.scroll.next(20);
    $rootScope.walls.scroll = scrollRef.scroll;

    ref.child("-JwVp4kJ36Uv06GOEvlk/filters").on('value', function(fsnap) {
      filters = fsnap.val();
      console.log("filters", filters);
      localStorage.setItem("filters", angular.toJson(filters));
    })
    var d = new Date();
    var start = parseInt(d.getFullYear() +''+ ("0" + (d.getMonth() + 1)).slice(-2));
    days.holidays = $firebaseArray(ref.child("-JwVp4kJ36Uv06GOEvlk/holidays").orderByChild("id").startAt(start));
    days.events = $firebaseArray(ref.child("-JwVp4kJ36Uv06GOEvlk/events").orderByChild("id").startAt(start));
    if(Object.keys(user).length > 0) {
      console.log("updating all refs");
      $rootScope.updateMenu = true;
      userchatroomsref = $firebaseObject(ref.child(user.schoolid+"/chatrooms/"+user.uid));
      console.log('userchatroomsref', userchatroomsref);
      console.log('userchatroomsref', days.events);
      if(user.role == 'parent') {
        for (var i = 0; i < user.students.length; i++) {
          var st = user.students[i].standard;
          if((user.students[i].division.length > 1) && (user.students[i].division != "all")) st = st+"-"+user.students[i].division;
          days.exams[st] = $firebaseObject(ref.child(user.schoolid+"/exams/"+st).startAt(start));
          timetableref[user.students[i].uid] = ref.child(user.schoolid+'/timetable/'+user.students[i].uid);
        };
      } else if (user.role == 'teacher') {
        usersref = $firebaseObject(ref.child('users').orderByChild(user.alluserskey).equalTo(user.allusersval));
        timetableref[user.uid] = ref.child(user.schoolid+'/timetable/'+user.uid);
      } else {
        usersref = $firebaseObject(ref.child('users').orderByChild(user.alluserskey).equalTo(user.allusersval));
      }
    }

  });
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
                    colors: (attrs.id.indexOf("grades") == -1) ? ['#23b7e5', '#ff6c60', '#90ed7d', '#f7a35c', '#8085e9', 
   '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1'] : ['#90ed7d', '#f7a35c', '#8085e9', 
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
                    '<input type="search" placeholder="{{placeholder}}" ng-model="search.value" class="search">' +
                    '<i ng-if="search.value.length > 0" ng-click="clearSearch()" class="icon ion-close"></i>' +
                  '</div>'
    };
})
.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  $ionicConfigProvider.views.forwardCache(true);
  $stateProvider
    .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'AuthCtrl',
    resolve: {
      user: function(Auth, $location) {
        var uu = Auth.resolveUser();
        if(uu) $location.path('/app/wall');
        else return uu;
      }
    }
  })
  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html",
    controller: 'AppCtrl'
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
  .state('app.hmdashboard', {
    url: "/hmdashboard",
    views: {
      'menuContent' :{
        templateUrl: "templates/hmdashboard.html",
        controller: 'HmDashboardCtrl'
      }
    }
  })
 .state('app.classdashboard', {
    url: "/classdashboard/:class",
    cache: false,
    views: {
      'menuContent' :{
        templateUrl: "templates/classdashboard.html",
        controller: 'ClassDashboardCtrl'
      }
    }
  })
 .state('app.studentDashboard', {
    url: "/studentdashboard/:class/:uid/:name",
    cache: false,
    views: {
      'menuContent' :{
        templateUrl: "templates/studentdashboard.html",
        controller: 'StudentDashboardCtrl'
      }
    }
  })
 .state('app.teacherdashboard', {
    url: "/teacherdashboard/:uid/:name",
    cache: false,
    views: {
      'menuContent' :{
        templateUrl: "templates/teacherdashboard.html",
        controller: 'TeacherDashboardCtrl'
      }
    }
  })
  .state('app.studentOverallDashboard', {
    url: "/studentoveralldashboard/:uid/:name",
    cache: false,
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
  .state('app.allteachers', {
    url: "/allteachers",
    views: {
      'menuContent' :{
        templateUrl: "templates/allteachers.html",
        controller: 'AllTeachersCtrl'
      }
    }
  })
  .state('app.markstudents', {
    url: "/markstudents/:filter/:type/:key/:val",
    views: {
      'menuContent' :{
        templateUrl: "templates/markstudents.html",
        controller: 'MarkStudentsCtrl'
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
  .state('app.messagebox', {
    url: "/messages/:chatid/:toUid/:to/:type/:notify",
    views: {
      'menuContent' :{
        templateUrl: "templates/messagebox.html",
        controller: 'MessageBoxCtrl'
      }
    }
  })
  .state('app.timetable', {
    url: "/timetable/:id",
    views: {
      'menuContent' :{
        templateUrl: "templates/timetable.html",
        controller: 'TimetableCtrl'
      }
    }
  })
  .state('app.days', {
    url: "/days/:type",
    views: {
      'menuContent' :{
        templateUrl: "templates/days.html",
        controller: 'DaysCtrl'
      }
    }
  })
  .state('app.daysexam', {
    url: "/days/:type/:class",
    views: {
      'menuContent' :{
        templateUrl: "templates/days.html",
        controller: 'DaysCtrl'
      }
    }
  })
  .state('app.allexams', {
    url: "/allclasses/:type",
    views: {
      'menuContent' :{
        templateUrl: "templates/allclasses.html",
        controller: 'AllClassesCtrl'
      }
    }
  })
  .state('app.account', {
    url: "/account",
    views: {
      'menuContent' :{
        templateUrl: "templates/account.html",
        controller: 'AccountCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
});
