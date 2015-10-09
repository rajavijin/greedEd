'use strict';

describe('Controller: AddmarksCtrl', function () {

  // load the controller's module
  beforeEach(module('greenEdBackendApp'));

  var AddmarksCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AddmarksCtrl = $controller('AddmarksCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
