'use strict';

describe('Controller: AddteacherCtrl', function () {

  // load the controller's module
  beforeEach(module('greenEdApp'));

  var AddteacherCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AddteacherCtrl = $controller('AddteacherCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});