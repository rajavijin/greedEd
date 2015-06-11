'use strict';

angular.module('schoolServerApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/timetable', {
        templateUrl: 'app/timetable/timetable.html',
        controller: 'TimetableCtrl'
      });
  });
