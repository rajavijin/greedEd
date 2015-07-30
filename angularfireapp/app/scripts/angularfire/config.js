angular.module('firebase.config', [])
  .constant('FBURL', 'https://sweltering-torch-4786.firebaseio.com')
  .constant('SIMPLE_LOGIN_PROVIDERS', ['password'])

  .constant('loginRedirectPath', '/login');
