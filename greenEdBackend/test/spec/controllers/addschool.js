'use strict';

describe('Controller: AddschoolCtrl', function () {

  // load the controller's module
  beforeEach(module('greenEdApp'));

  var AddschoolCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AddschoolCtrl = $controller('AddschoolCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
