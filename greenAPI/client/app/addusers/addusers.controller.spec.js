'use strict';

describe('Controller: AddusersCtrl', function () {

  // load the controller's module
  beforeEach(module('greenApiApp'));

  var AddusersCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AddusersCtrl = $controller('AddusersCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
