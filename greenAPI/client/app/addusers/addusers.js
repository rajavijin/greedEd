'use strict';

angular.module('greenApiApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/addusers', {
        templateUrl: 'app/addusers/addusers.html',
        controller: 'AddusersCtrl'
      });
  });
