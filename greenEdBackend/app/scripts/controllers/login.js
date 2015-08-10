'use strict';
/**
 * @ngdoc function
 * @name greenEdApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Manages authentication to any active providers.
 */
angular.module('greenEdApp')
  .controller('LoginCtrl', function ($scope, Auth, $location, $q, Ref, $timeout) {
    $scope.email ="8951572125@ge.com";
    $scope.pass = "101thuxr";
    $scope.passwordLogin = function(email, pass) {
      $scope.err = null;
      Auth.$authWithPassword({email: email, password: pass}, {rememberMe: true}).then(
        redirect, showError
      );
    };

    $scope.createAccount = function(email, pass, confirm) {
      $scope.err = null;
      if( !pass ) {
        $scope.err = 'Please enter a password';
      }
      else if( pass !== confirm ) {
        $scope.err = 'Passwords do not match';
      }
      else {
        Auth.$createUser({email: email, password: pass})
          .then(function () {
            // authenticate so we have permission to write to Firebase
            return Auth.$authWithPassword({email: email, password: pass}, {rememberMe: true});
          })
          .then(createProfile)
          .then(redirect, showError);
      }

      function createProfile(user) {
        var ref = Ref.child('users', user.uid), def = $q.defer();
        ref.set({email: email, name: firstPartOfEmail(email)}, function(err) {
          $timeout(function() {
            if( err ) {
              def.reject(err);
            }
            else {
              def.resolve(ref);
            }
          });
        });
        return def.promise;
      }
    };

    function firstPartOfEmail(email) {
      return ucfirst(email.substr(0, email.indexOf('@'))||'');
    }

    function ucfirst (str) {
      // inspired by: http://kevin.vanzonneveld.net
      str += '';
      var f = str.charAt(0).toUpperCase();
      return f + str.substr(1);
    }

  

    function redirect(userdata) {
      console.log("user while redirect", userdata);
      Ref.child('users/'+userdata.uid).once('value', function(pdata) {
        var profile = pdata.val();
        profile.uid = userdata.uid;
        localStorage.setItem("user", JSON.stringify(profile));
        console.log("Profile", profile);
      });
      $location.path('/dashboard');
    }

    function showError(err) {
      $scope.err = err;
    }


  })
  .controller('NavbarCtrl', function ($scope, $location, Auth, $firebaseObject, Ref) {
    var user = Auth.$getAuth();
    if(user) {
      var profile = $firebaseObject(Ref.child('users/'+user.uid));
      profile.$bindTo($scope, 'profile');
      profile.$loaded().then(function(userdata) {
        if(userdata.role == "admin") {
          $scope.menu = [{
            'title': 'Dashboard',
            'link': '/dashboard',
            'class': 'fa fa-dashboard',
          },{
            'title': 'Add school',
            'link': '/addschool',
            'class': 'fa fa-home'
          }];
        } else if (userdata.role == "hm") {
          $scope.menu = [{
            'title': 'Dashboard',
            'link': '/dashboard',
            'class': 'fa fa-dashboard',
          },
          {
            'title': 'Add Teacher',
            'link': '/addteacher',
            'class': 'fa fa-user-md'
          },
          {
            'title': 'Add Class',
            'link': '/addclass',
            'class': 'fa fa-home'
          },
          {
            'title': 'Add Students',
            'link': '/addstudents',
            'class': 'fa fa-user'
          }];
        } else {

        }
      })
    }
    $scope.user = user;
    $scope.logout = function() {
      Auth.$unauth();
      $location.path('/');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });