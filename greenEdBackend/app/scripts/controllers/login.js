'use strict';
/**
 * @ngdoc function
 * @name greenEdApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Manages authentication to any active providers.
 */
angular.module('greenEdApp')
  .controller('LoginCtrl', function ($scope, Auth, $rootScope, $location, Data, $q, Ref, $timeout) {
    $scope.email ="8951572125@ge.com";
    $scope.pass = "101thuxr";
    $scope.passwordLogin = function(email, pass) {
      $scope.err = null;
      $scope.loading = true;
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
        $rootScope.menus = Data.getMenus(profile.role);
        $rootScope.user = profile;
        console.log("Profile", profile);
      });
      $location.path('/dashboard');
    }

    function showError(err) {
      $scope.err = err;
    }


  })
  .controller('NavbarCtrl', function ($scope, $rootScope, $location, Auth, Data, $firebaseObject, Ref) {
    var user = JSON.parse(localStorage.getItem("user"));
    if(user) {
      $rootScope.menus = Data.getMenus(user.role);
      $rootScope.user = user;
      console.log("menus", Data.getMenus(user.role));
    }
    console.log("Nav user", user);
    $scope.logout = function() {
      Auth.$unauth();
      $location.path('/');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });