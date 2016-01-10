var app = angular.module('starter.services', [])

app.factory('Data', function($rootScope, $q, $http, ApiEndpoint) {
  var categories = [
	{icon:"", key:"accounting", text:"Find the best place", name:"accounting"},
	{icon:"ion-plane", key:"airport", text:"Find the best place", name:"airport"},
	{icon:"", key:"amusement_park", text:"Find the best place", name:"amusement park"},
	{icon:"", key:"aquarium", text:"Find the best place", name:"aquarium"},
	{icon:"", key:"art_gallery", text:"Find the best place", name:"art gallery"},
	{icon:"", key:"atm", text:"Find the best place", name:"atm"},
	{icon:"", key:"bakery", text:"Find the best place", name:"bakery"},
	{icon:"", key:"bank", text:"Find the best place", name:"bank"},
	{icon:"ion-android-bar", key:"bar", text:"Find the best place", name:"bar"},
	{icon:"", key:"beauty_salon", text:"Find the best place", name:"beauty salon"},
	{icon:"ion-android-bicycle", key:"bicycle_store", text:"Find the best place", name:"bicycle store"},
	{icon:"", key:"book_store", text:"Find the best place", name:"book store"},
	{icon:"", key:"bowling_alley", text:"Find the best place", name:"bowling alley"},
	{icon:"ion-android-bus", key:"bus_station", text:"Find the best place", name:"bus station"},
	{icon:"", key:"cafe", text:"Find the best place", name:"cafe"},
	{icon:"", key:"campground", text:"Find the best place", name:"campground"},
	{icon:"ion-model-s", key:"car_dealer", text:"Find the best place", name:"car dealer"},
	{icon:"ion-model-s", key:"car_rental", text:"Find the best place", name:"car rental"},
	{icon:"ion-model-s", key:"car_repair", text:"Find the best place", name:"car repair"},
	{icon:"ion-model-s", key:"car_wash", text:"Find the best place", name:"car wash"},
	{icon:"", key:"casino", text:"Find the best place", name:"casino"},
	{icon:"", key:"cemetery", text:"Find the best place", name:"cemetery"},
	{icon:"", key:"church", text:"Find the best place", name:"church"},
	{icon:"", key:"city_hall", text:"Find the best place", name:"city hall"},
	{icon:"", key:"clothing_store", text:"Find the best place", name:"clothing store"},
	{icon:"", key:"convenience_store", text:"Find the best place", name:"convenience store"},
	{icon:"", key:"courthouse", text:"Find the best place", name:"courthouse"},
	{icon:"", key:"dentist", text:"Find the best place", name:"dentist"},
	{icon:"", key:"department_store", text:"Find the best place", name:"department store"},
	{icon:"", key:"doctor", text:"Find the best place", name:"doctor"},
	{icon:"", key:"electrician", text:"Find the best place", name:"electrician"},
	{icon:"", key:"electronics_store", text:"Find the best place", name:"electronics store"},
	{icon:"", key:"embassy", text:"Find the best place", name:"embassy"},
	{icon:"", key:"establishment", text:"Find the best place", name:"establishment"},
	{icon:"", key:"finance", text:"Find the best place", name:"finance"},
	{icon:"", key:"fire_station", text:"Find the best place", name:"fire station"},
	{icon:"", key:"florist", text:"Find the best place", name:"florist"},
	{icon:"ion-spoon", key:"food", text:"Find the best place", name:"food"},
	{icon:"", key:"funeral_home", text:"Find the best place", name:"funeral home"},
	{icon:"", key:"furniture_store", text:"Find the best place", name:"furniture store"},
	{icon:"", key:"gas_station", text:"Find the best place", name:"gas station"},
	{icon:"", key:"general_contractor", text:"Find the best place", name:"general contractor"},
	{icon:"", key:"grocery_or_supermarket", text:"Find the best place", name:"grocery or supermarket"},
	{icon:"", key:"gym", text:"Find the best place", name:"gym"},
	{icon:"", key:"hair_care", text:"Find the best place", name:"hair care"},
	{icon:"", key:"hardware_store", text:"Find the best place", name:"hardware store"},
	{icon:"", key:"health", text:"Find the best place", name:"health"},
	{icon:"", key:"hindu_temple", text:"Find the best place", name:"hindu temple"},
	{icon:"", key:"home_goods_store", text:"Find the best place", name:"home goods store"},
	{icon:"", key:"hospital", text:"Find the best place", name:"hospital"},
	{icon:"", key:"insurance_agency", text:"Find the best place", name:"insurance agency"},
	{icon:"", key:"jewelry_store", text:"Find the best place", name:"jewelry store"},
	{icon:"", key:"laundry", text:"Find the best place", name:"laundry"},
	{icon:"", key:"lawyer", text:"Find the best place", name:"lawyer"},
	{icon:"", key:"library", text:"Find the best place", name:"library"},
	{icon:"", key:"liquor_store", text:"Find the best place", name:"liquor store"},
	{icon:"", key:"local_government_office", text:"Find the best place", name:"local government office"},
	{icon:"", key:"locksmith", text:"Find the best place", name:"locksmith"},
	{icon:"", key:"lodging", text:"Find the best place", name:"lodging"},
	{icon:"", key:"meal_delivery", text:"Find the best place", name:"meal delivery"},
	{icon:"", key:"meal_takeaway", text:"Find the best place", name:"meal takeaway"},
	{icon:"", key:"mosque", text:"Find the best place", name:"mosque"},
	{icon:"ion-ios-film", key:"movie_rental", text:"Find the best place", name:"movie rental"},
	{icon:"ion-ios-film", key:"movie_theater", text:"Find the best place", name:"movie theater"},
	{icon:"ion-ios-film", key:"moving_company", text:"Find the best place", name:"moving company"},
	{icon:"", key:"museum", text:"Find the best place", name:"museum"},
	{icon:"", key:"night_club", text:"Find the best place", name:"night club"},
	{icon:"", key:"painter", text:"Find the best place", name:"painter"},
	{icon:"", key:"park", text:"Find the best place", name:"park"},
	{icon:"", key:"parking", text:"Find the best place", name:"parking"},
	{icon:"", key:"pet_store", text:"Find the best place", name:"pet store"},
	{icon:"", key:"pharmacy", text:"Find the best place", name:"pharmacy"},
	{icon:"", key:"physiotherapist", text:"Find the best place", name:"physiotherapist"},
	{icon:"", key:"place_of_worship", text:"Find the best place", name:"place of worship"},
	{icon:"", key:"plumber", text:"Find the best place", name:"plumber"},
	{icon:"", key:"police", text:"Find the best place", name:"police"},
	{icon:"", key:"post_office", text:"Find the best place", name:"post office"},
	{icon:"", key:"real_estate_agency", text:"Find the best place", name:"real estate agency"},
	{icon:"", key:"restaurant", text:"Find the best place", name:"restaurant"},
	{icon:"", key:"roofing_contractor", text:"Find the best place", name:"roofing contractor"},
	{icon:"", key:"rv_park", text:"Find the best place", name:"rv park"},
	{icon:"", key:"school", text:"Find the best place", name:"school"},
	{icon:"", key:"shoe_store", text:"Find the best place", name:"shoe store"},
	{icon:"", key:"shopping_mall", text:"Find the best place", name:"shopping mall"},
	{icon:"", key:"spa", text:"Find the best place", name:"spa"},
	{icon:"", key:"stadium", text:"Find the best place", name:"stadium"},
	{icon:"", key:"storage", text:"Find the best place", name:"storage"},
	{icon:"", key:"store", text:"Find the best place", name:"store"},
	{icon:"", key:"subway_station", text:"Find the best place", name:"subway station"},
	{icon:"", key:"synagogue", text:"Find the best place", name:"synagogue"},
	{icon:"", key:"taxi_stand", text:"Find the best place", name:"taxi stand"},
	{icon:"", key:"train_station", text:"Find the best place", name:"train station"},
	{icon:"", key:"travel_agency", text:"Find the best place", name:"travel agency"},
	{icon:"", key:"university", text:"Find the best place", name:"university"},
	{icon:"", key:"veterinary_care", text:"Find the best place", name:"veterinary care"},
	{icon:"", key:"zoo", text:"Find the best place", name:"zoo"}];

  return {
  	getPlaces: function(key) {
  	  var q = $q.defer();
  	  //var path = '/place/nearbysearch/json?location='+$rootScope.currentP[0]+','+$rootScope.currentP[1]+'&radius=500&types='+key+'&name=cruise&key=AIzaSyAOCggglx0FfgW2fHdcvZs8erma_n74og4';
      $http.get('http://192.168.1.5:8100/api/place/nearbysearch/json?location='+$rootScope.currentP[0]+','+$rootScope.currentP[1]+'&radius=1000&type='+key+'&key=AIzaSyAOCggglx0FfgW2fHdcvZs8erma_n74og4')
	    .success(function(data) {
	    console.log("api data", data.results);
	      q.resolve(data.results);
	    })
	    .error(function(error){
	      console.log('Had an error')
	      q.reject(error);
	    });

	    return q.promise;
  	},
  	categories: function() {
  		return categories;
  	},
  	shops: function() {
		  var q = $q.defer();

	    $http.get(ApiEndpoint.url+'/all_shop_for_mobile')
		    .success(function(data) {
		      shops = data;
		      q.resolve(data);
		    })
		    .error(function(error){
		      console.log('Had an error')
		      q.reject(error);
		    });
		    
		  return q.promise;
  	},
    all: function() {
      return cates;
    },
    get: function(cateId) {
      for (var i = 0; i < cates.length; i++) {
        if (cates[i].id === parseInt(cateId)) {
          return cates[i];
        }
      }
      return null;
    }
  };
});