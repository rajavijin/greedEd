angular.module('firebase.config', [])
  .constant('FBURL', 'https://greenedtest.firebaseio.com')
  .constant('SIMPLE_LOGIN_PROVIDERS', ['password'])

  .constant('loginRedirectPath', '/login')
  .constant('loggedInPath', '/account');
