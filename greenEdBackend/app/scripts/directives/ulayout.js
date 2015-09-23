'use strict';

/**
 * @ngdoc directive
 * @name greenEdApp.directive:ulayout
 * @description
 * # ulayout
 */
angular.module('greenEdApp')
  .directive('ulayout', function () {
    return {
      templateUrl: 'views/navbar.html',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
        //element.text('this is the ulayout directive');
      }
    };
  });
