// Ionic Starter App
var luser = localStorage.getItem('user');
if(luser) {
  var user = JSON.parse(luser);
} else {
  var user = {};
}
console.log("User on start", user);
// angular.module is a global placef for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers','firebase','ngCordova'])

.run(function($ionicPlatform, $rootScope, Auth) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
    if(user && !$rootScope.filters) {
      var filters = Auth.filters(user.schoolid);
      filters.$bindTo($rootScope, 'filters').then(function() {
        console.log("Filters", $rootScope.filters);
      });
    }
    console.log("On Ready Filters", $rootScope.filters);
  });
})

.constant('FIREBASE_URL', 'https://vivid-inferno-3813.firebaseio.com/')


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
   '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1'] : ['#23b7e5', '#90ed7d', '#f7a35c', '#8085e9', 
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

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'AuthCtrl',
    resolve: {
      user: function(Auth) {
        return Auth.resolveUser();
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
    views: {
      'menuContent' :{
        templateUrl: "templates/classdashboard.html",
        controller: 'ClassDashboardCtrl'
      }
    }
  })
 .state('app.studentDashboard', {
    url: "/studentdashboard/:class/:uid/:name",
    views: {
      'menuContent' :{
        templateUrl: "templates/studentdashboard.html",
        controller: 'StudentDashboardCtrl'
      }
    }
  })
 .state('app.teacherdashboard', {
    url: "/teacherdashboard/:uid/:name",
    views: {
      'menuContent' :{
        templateUrl: "templates/teacherdashboard.html",
        controller: 'TeacherDashboardCtrl'
      }
    }
  })
  .state('app.studentOverallDashboard', {
    url: "/studentoveralldashboard/:uid/:name",
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
    url: "/messages/:chatid/:toUid/:to/:type",
    views: {
      'menuContent' :{
        templateUrl: "templates/messagebox.html",
        controller: 'MessageBoxCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
});
