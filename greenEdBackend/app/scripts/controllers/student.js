'use strict';

/**
 * @ngdoc function
 * @name greenEdApp.controller:StudentCtrl
 * @description
 * # StudentCtrl
 * Controller of the greenEdApp
 */
angular.module('greenEdApp')
  .controller('StudentCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
