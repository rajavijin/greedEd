// Ionic Starter App
var user = {};
var allusers = {allclasses:[],classes:{},allstudents:[],students:{},allteachers:[], teachers:{}};
var allmarks = {};
var lastmark = {};
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'firebase', 'starter.controllers'])

.run(function($ionicPlatform, $rootScope, $firebaseAuth, $firebase, $firebaseObject, $state, $ionicLoading) {
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


    $rootScope.userEmail = null;
    $rootScope.baseUrl = 'https://vivid-inferno-3813.firebaseio.com';
    var authRef = new Firebase($rootScope.baseUrl);
    $rootScope.auth = $firebaseAuth(authRef);

    $rootScope.checkSession = function() {
      var authData = authRef.getAuth();
      if (authData) {
        $rootScope.login(authData);
      } else {
        localStorage.removeItem("uid");
        $state.go('home', {}, {reload:true});
      }
    } 
    authRef.onAuth(authDataCallback);

    $rootScope.show = function(text) {
        $rootScope.loading = $ionicLoading.show({
            content: text ? text : 'Loading..',
            animation: 'fade-in',
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0
        });
    };

    $rootScope.hide = function() {
        $ionicLoading.hide();
    };
    $rootScope.notify = function(text) {
        $rootScope.show(text);
        $window.setTimeout(function() {
            $rootScope.hide();
        }, 1999);
    };
    
    $rootScope.login = function(userdetails) {
      $rootScope.updateMenu = true;
      localStorage.setItem("uid", userdetails.uid);
      authRef.child('users/'+userdetails.uid).once("value", function(snapshot) {
        user = snapshot.val();
        user.uid = userdetails.uid;
        loginSuccess(user);
      }, function(error) {
        console.log("Profile loading error", error);
      })       
    }
    
    function loginSuccess(user) {
      authRef.child('users').orderByChild("schoolid").equalTo(user.schoolid)
        .once('value', function(snap) { 
            console.log("total users", Object.keys(snap.val()).length);
            snap.forEach(function(fbusers) {
              var fbuser = fbusers.key();
              var fbusers = fbusers.val();
              if(user.role == "hm") {
                if(fbusers.role == "student") {
                  allusers["students"][fbuser] = fbusers;
                  allusers["allstudents"].push({name:fbusers.name, standard:fbusers.standard, division:fbusers.division, uid:fbuser});
                  if(!allusers["classes"][fbusers.standard+'-'+fbusers.division]) {
                    allusers["classes"][fbusers.standard+'-'+fbusers.division] = {standard:fbusers.standard, division:fbusers.division};
                    allusers["allclasses"].push({standard:fbusers.standard, division:fbusers.division});
                  }
                  if(fbusers.division != "all") {
                    if(!allusers["classes"][fbusers.standard]) {
                      allusers["classes"][fbusers.standard] = {standard:fbusers.standard, division:fbusers.division};
                      allusers["allclasses"].push({standard:fbusers.standard, division:"all"});
                    }
                  }
                } else if (fbusers.role == "teacher") {
                  allusers["allteachers"].push(fbusers);
                }
              } else if (user.role == "parent") {
                if(fbusers.role == "student") {
                  if(fbusers.parentid == user.uid) {
                    allusers["students"][fbuser] = fbusers;
                  }
                }
              } else {
                if(fbusers.role == "student") {
                  for (var si = 0; si < user.subjects.length; si++) {
                    var tkey = user.uid +'_'+user.name;
                    console.log("subject", fbusers[user.subjects[si].subject]);
                    console.log("tkey", user.uid +'_'+user.name);
                    if(fbusers[user.subjects[si].subject] == tkey) {
                      if(!allusers["students"][fbuser]) {
                        allusers["students"][fbuser] = fbusers;
                        allusers["allstudents"].push({name:fbusers.name, standard:fbusers.standard, division:fbusers.division, uid:fbuser});
                      }
                    }
                  };
                }
              }
            });
        });
        authRef.child(user.schoolid+'/lastmark').on('value', function(lsnap) {
          console.log("ALL USERS", allusers); 
          lastmark = lsnap.val();
          $ionicLoading.hide();
          if(user.role == "hm") {
            $state.go("app.hmdashboard", {}, {'reload': true});
          } else if (user.role == "parent") {
            if(user.students.length == 1) {
              $state.go("app.studentDashboard", {}, {'reload': true});
            } else {
              $state.go("app.wall", {}, {'reload': true});            
            }
          } else {
            if(user.standard) {
              $state.go("app.dashboard", {}, {'reload': true});
            } else {
              $state.go("app.teacherdashboard", {}, {'reload': true});              
            }
          }
        });      
    }
    // Create a callback which logs the current auth state
    function authDataCallback(authData) {
      if (authData) {
        console.log("Auth Data callback User " + authData.uid + " is logged in with " + authData.provider);
      } else {
        console.log("User is logged out");
        localStorage.removeItem("uid");
        $state.go('home', {}, {reload:true});
      }
    }


    $rootScope.logout = function() {
        authRef.unauth();
        $rootScope.checkSession();
    };

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
  .state('home', {
    url: '/home',
    templateUrl: 'templates/home.html',
    controller: 'SignInCtrl'
  })
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
 .state('app.teacherdashboard', {
    url: "/teacherdashboard",
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
  .state('app.studentOverallDashboard', {
    url: "/studentoveralldashboard",
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
  .state('app.markstudents', {
    url: "/markstudents/:key",
    views: {
      'menuContent' :{
        templateUrl: "templates/markstudents.html",
        controller: 'MarkStudentsCtrl'
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
  $urlRouterProvider.otherwise('/home');
});
