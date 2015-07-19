// Ionic Starter App
var user = {};
var allusers = {classes:{},students:{},teachers:{}};
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
    // Create a callback which logs the current auth state
    function authDataCallback(authData) {
      if (authData) {
        console.log("User " + authData.uid + " is logged in with " + authData.provider);
      } else {
        console.log("User is logged out on auth");
      }
    }

    $rootScope.userEmail = null;
    $rootScope.baseUrl = 'https://vivid-inferno-3813.firebaseio.com';
    var authRef = new Firebase($rootScope.baseUrl);
    $rootScope.auth = $firebaseAuth(authRef);

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

    $rootScope.logout = function() {
        authRef.unauth();
        $rootScope.checkSession();
    };

    $rootScope.checkSession = function() {
      console.log("checking session");
      console.log("user", user);
      var authData = authRef.getAuth();
      if (authData) {
        console.log("User " + authData.uid + " is logged in with " + authData.provider);
        $rootScope.login(authData);
      } else {
        console.log("User is logged out");
        $state.go('home', {}, {reload:true});
      }
/*      var auth = new FirebaseSimpleLogin(authRef, function(error, user) {
          if (error) {
              // no action yet.. redirect to default route
              $rootScope.userEmail = null;
              $window.location.href = '#/home';
          } else if (user) {
              // user authenticated with Firebase
              $rootScope.userEmail = user.email;
          } else {
              // user is logged out
              $rootScope.userEmail = null;
          }
      });
*/    } 
      $rootScope.login = function(userdetails) {
        $rootScope.updateMenu = true;
        authRef.child('users/'+userdetails.uid).once("value", function(snapshot) {
          user = snapshot.val();

          console.log("CURRENT USER:", user);
          authRef.child('users').orderByChild("schoolid").equalTo(user.schoolid)
          .once('value', function(snap) { 
              var fbusers = snap.val();
              for(var fbuser in fbusers) {
                if(fbusers[fbuser].role == "student") {
                  allusers["students"][fbuser] = fbusers[fbuser];
                  allusers["classes"][fbusers[fbuser].standard+'-'+fbusers[fbuser].division] = {standard:fbusers[fbuser].standard, division:fbusers[fbuser].division};
                  if(fbusers[fbuser].division != "all") {
                    allusers["classes"][fbusers[fbuser].standard] = {standard:fbusers[fbuser].standard, division:fbusers[fbuser].division};
                  }
                } else if (fbusers[fbuser].role == "teacher") {
                  allusers["teachers"][fbuser] = fbusers[fbuser];
                }
              }
          });
              console.log("ALL USERS", allusers); 
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
        }, function(error) {
          console.log("Profile loading error", error);
        })       
      }
  });
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
