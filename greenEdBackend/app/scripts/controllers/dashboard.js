'use strict';

/**
 * @ngdoc function
 * @name greenEdApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the greenEdApp
 */
angular.module('greenEdApp')
  .controller('DashboardCtrl', function ($scope, user, Auth, $firebaseObject, Ref) {
	$scope.user = user;
	console.log("dashboard user", user);
    var profile = $firebaseObject(Ref.child('users/'+user.uid));
    profile.$bindTo($scope, 'profile');
  });
