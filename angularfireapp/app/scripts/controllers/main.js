'use strict';

/**
 * @ngdoc function
 * @name angularfireappApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the angularfireappApp
 */
angular.module('angularfireappApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
