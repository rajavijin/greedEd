'use strict';

/**
 * @ngdoc function
 * @name greenEdBackendApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the greenEdBackendApp
 */
angular.module('greenEdBackendApp')
  .controller('DashboardCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
