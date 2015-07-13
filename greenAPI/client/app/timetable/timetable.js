'use strict';

angular.module('greenApiApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/timetable', {
        templateUrl: 'app/timetable/timetable.html',
        controller: 'TimetableCtrl'
      });
  });
