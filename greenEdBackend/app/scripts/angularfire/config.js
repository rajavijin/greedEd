angular.module('firebase.config', [])
  .constant('FBURL', 'https://greenedbackend.firebaseio.com')
  .constant('SIMPLE_LOGIN_PROVIDERS', ['password'])

  .constant('loginRedirectPath', '/login');
