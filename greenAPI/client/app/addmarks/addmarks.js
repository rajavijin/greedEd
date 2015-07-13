'use strict';

angular.module('greenApiApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/addmarks', {
        templateUrl: 'app/addmarks/addmarks.html',
        controller: 'AddmarksCtrl'
      });
  });
