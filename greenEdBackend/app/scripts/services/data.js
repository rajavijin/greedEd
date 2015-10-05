'use strict';

/**
 * @ngdoc service
 * @name greenEdApp.Data
 * @description
 * # Data
 * Service in the greenEdApp.
 */
angular.module('greenEdBackendApp')
  .service('Data', function (FBURL, $window,  $rootScope, $localStorage) {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var Data = {
    	getMenus: function(emailId) {
    		console.log("emailid", emailId);
			var email = emailId.split("@")[0];
    		if(email == "admin") {
		        return [{
		          'title': 'Dashboard',
		          'href': '/wall',
		          'class': 'mdi-action-dashboard',
		        },{
		          'title': 'Add school',
		          'href': '/addschool',
		          'class': 'mdi-action-account-balance'
		        }];
			} else if(email.indexOf("h") > 0) {
				return [{
				  'title': 'Dashboard',
				  'href': '/dashboard',
				  'class': 'fa fa-dashboard',
				},
				{
				  'title': 'Add Teacher',
				  'href': '/addteacher',
				  'class': 'fa fa-user-md'
				},
				{
				  'title': 'Add Student',
				  'href': '/addstudent',
				  'class': 'fa fa-user'
				},
				 {
				  'title': 'Teachers',
				  'href': '/teachers',
				  'class': 'fa fa-user-md'
				},
				{
				  'title': 'Class',
				  'href': '/class',
				  'class': 'fa fa-home'
				},
				{
				  'title': 'Student',
				  'href': '/student',
				  'class': 'fa fa-user'
				}];
			} else {
				return [];
			}
    	}
    };
    return Data;
  });
