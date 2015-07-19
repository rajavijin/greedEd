'use strict';

describe('Controller: AdduserCtrl', function () {

  // load the controller's module
  beforeEach(module('angularfireappApp'));

  var AdduserCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AdduserCtrl = $controller('AdduserCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
