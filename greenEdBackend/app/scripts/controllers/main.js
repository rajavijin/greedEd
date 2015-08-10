'use strict';

/**
 * @ngdoc function
 * @name greenEdApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the greenEdApp
 */
angular.module('greenEdApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
