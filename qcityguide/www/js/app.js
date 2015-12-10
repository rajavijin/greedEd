// Ionic Hoss - Restaurant App
var ref = null;
var catRef = null;
var shopRef = null;
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'firebase'])

.constant('FB_URL', 'https://qcityguide.firebaseio.com')

.run(function($ionicPlatform, FB_URL, $rootScope, $firebaseObject) {
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

    navigator.geolocation.getCurrentPosition(function (pos) {
      console.log('Got pos', pos);
      $rootScope.currentP = [pos.coords.latitude, pos.coords.longitude];
    }, function (error) {
      alert('Unable to get location: ' + error.message);
    });
  });
})

.directive('map', function($rootScope) {
  return {
    restrict: 'E',
    scope: {
      onCreate: '&'
    },
    link: function ($scope, $element, $attr) {
      var latlng = ($rootScope.currentP) ? $rootScope.currentP : [12.917147, 77.622798];
      console.log("latlng", latlng);
      
      function initialize() {
        var mapOptions = {
          center: new google.maps.LatLng(latlng[0], latlng[1]),
          zoom: 16,
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
            templateUrl: "templates/app/product_menu.html",
            controller: 'ProductMenuCtrl'
        })

        // MAIN APP
        .state('app', {
            url: "/app",
            abstract: true,
            templateUrl: "templates/app/ion_nav_view.html",
            controller: 'AppCtrl'
        })
        .state('app.category', {
            url: "/category",
            views: {
                'menuAppContent': {
                    templateUrl: "templates/app/category.html"
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
        .state('app.shopping_cart', {
            url: "/shopping_cart",
            views: {
                'menuAppContent': {
                    templateUrl: "templates/app/shopping_cart.html"
                }
            }
        })
        .state('app.settings', {
            url: "/settings",
            views: {
                'menuAppContent': {
                    templateUrl: "templates/app/settings.html"
                }
            }
        })
        .state('app.profile', {
            url: "/profile",
            views: {
                'menuAppContent': {
                    templateUrl: "templates/app/profile.html"
                }
            }
        });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/intro');
});
