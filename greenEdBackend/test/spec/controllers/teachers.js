'use strict';

describe('Controller: TeachersCtrl', function () {

  // load the controller's module
  beforeEach(module('greenEdApp'));

  var TeachersCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    TeachersCtrl = $controller('TeachersCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
