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
  })
  .controller('NavbarCtrl', function ($scope, $location, Auth) {
    $scope.menu = [{
      'title': 'adddata',
      'link': '/addData'
    },
    {
      'title': 'addusers',
      'link': '/adduser'
    },
    {
      'title': 'Add Marks',
      'link': '/addmarks'
    },
    {
      'title': 'Add Timetable',
      'link': '/addtimetable'
    }];

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;

    $scope.logout = function() {
      Auth.logout();
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });