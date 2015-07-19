angular.module('starter.controllers', ['starter.services'])

.controller('AppCtrl', function($scope, $rootScope, MyService) {
  console.log("user", user);
  if(user && $rootScope.updateMenu) {
    console.log("updating menu");
    $scope.menuLinks = MyService.getMenus();
    console.log("menu items", $scope.menuLinks);
    $rootScope.updateMenu = false;
  }
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});
})

.controller("HmDashboardCtrl", function($scope) {

})

.controller("DashboardCtrl", function($scope) {

})

.controller("TeacherDashboardCtrl", function($scope) {

})

.controller("StudentDashboardCtrl", function($scope) {

})

.controller("StudentOverallDashboardCtrl", function($scope) {

})

.controller("AllClassesCtrl", function($scope) {

})

.controller("AllStudentsCtrl", function($scope) {

})

.controller("AllTeachersCtrl", function($scope) {

})

.controller('SignInCtrl', function($scope, $rootScope, $firebaseAuth, $firebaseObject, $state, $ionicLoading, $ionicPopup) {
  // check session
  $rootScope.checkSession();

  $scope.user = {
      email: "8951572125@ge.com",
      password: "lm3oko6r"
  };
  $scope.validateUser = function() {
    $ionicLoading.show({template:'Please wait.. Authenticating'});
    var email = this.user.email;
    var password = this.user.password;
    if (!email || !password) {
        $ionicPopup.alert({template:"Please enter valid credentials"});
        return false;
    }

    $rootScope.auth.$authWithPassword({
        email: email,
        password: password
    }).then(function(userdetails) {
        $rootScope.login(userdetails);
    }, function(error) {
        $ionicLoading.hide();
        console.log("error code", error);
        if (error.code == 'INVALID_EMAIL') {
            $ionicPopup.alert({template:'Invalid Email Address'});
        } else if (error.code == 'INVALID_PASSWORD') {
            $ionicPopup.alert({template:'Invalid Password'});
        } else if (error.code == 'INVALID_USER') {
            $ionicPopup.alert({template:'Invalid User'});
        } else {
            $ionicPopup.alert({template:'Oops something went wrong. Please try again later'});
        }
    });
  }
});