'use strict';

/**
 * @ngdoc function
 * @name greenEdBackendApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the greenEdBackendApp
 */
angular.module('greenEdBackendApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    console.log("Main Ctrl");
  })
  .controller('WallCtrl', function ($rootScope, $scope) {
  	console.log("Wall Ctrl user", $rootScope.user);
  });
