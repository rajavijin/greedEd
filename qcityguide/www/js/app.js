// Ionic Hoss - Restaurant App
var ref = null;
var catRef = null;
var shopRef = null;
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'jett.ionic.filter.bar', 'firebase', 'ngCordova'])

.constant('FB_URL', 'https://qcityguide.firebaseio.com')

.run(function($ionicPlatform, FB_URL, $rootScope, $firebaseObject, $cordovaGeolocation) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    ref = new Firebase(FB_URL);
    catRef = $firebaseObject(ref.child('categories'));
    catRef.$loaded().then(function(ccsnap) {
        console.log("ccsnap", catRef)
    });
    shopRef = $firebaseObject(ref.child('shops'));
  });
})

.directive('map', function($rootScope, $cordovaGeolocation) {
  return {
    restrict: 'E',
    scope: {
      onCreate: '&'
    },
    link: function ($scope, $element, $attr) {
      function initialize() {
        var posOptions = {timeout: 10000, enableHighAccuracy: false};
        $cordovaGeolocation
          .getCurrentPosition(posOptions)
          .then(function (pos) {
            console.log("latlng", pos);
            $rootScope.currentP = [pos.coords.latitude, pos.coords.longitude];
            var mapOptions = {
              center: new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude),
              zoom: 5,
              mapTypeId: google.maps.MapTypeId.ROADMAP,
              mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.TOP_RIGHT
            },
            };
            var map = new google.maps.Map($element[0], mapOptions);
      
            $scope.onCreate({map: map});
          // Stop the side bar from dragging when mousedown/tapdown on the map
            google.maps.event.addDomListener($element[0], 'mousedown', function (e) {
              e.preventDefault();
              return false;
            });
          }, function(err) {
            // error
          });

      }
      console.log("document.readyState", document.readyState);
      if (document.readyState === "complete") {
        initialize();
      } else {
        google.maps.event.addDomListener(window, 'load', initialize);
      }
    }
  }
})

.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider

        .state('intro', {
            url: "/intro",
            templateUrl: "templates/intro.html",
            controller: 'IntroCtrl'
        })

        .state('product_menu', {
            url: "/product/menu/:cateId/:cateTitle",
            templateUrl: "templates/product_menu.html",
            controller: 'ProductMenuCtrl'
        })

        // MAIN APP
        .state('app', {
            url: "/app",
            abstract: true,
            templateUrl: "templates/ion_nav_view.html",
            controller: 'AppCtrl'
        })
        .state('app.category', {
            url: "/category",
            views: {
                'menuAppContent': {
                    templateUrl: "templates/category.html"
                }
            }
        })     
        .state('app.nearby', {
            url: "/nearby/:id",
            views: {
                'menuAppContent': {
                    templateUrl: "templates/nearby.html",
                    controller: 'NearbyCtrl'
                }
            }
        })
        .state('app.nearbydirection', {
            url: "/nearby/:id/:shopid",
            views: {
                'menuAppContent': {
                    templateUrl: "templates/nearby.html",
                    controller: 'NearbyCtrl'
                }
            }
        })
        .state('app.profile', {
            url: "/profile",
            views: {
                'menuAppContent': {
                    templateUrl: "templates/profile.html"
                }
            }
        });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/intro');
});
