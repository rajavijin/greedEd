'use strict';

angular.module('greenApiApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/addData', {
        templateUrl: 'app/addData/addData.html',
        controller: 'AddDataCtrl'
      });
  });
