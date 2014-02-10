'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp.config', [])

   .constant('version', '0.1')

   // where to redirect users if they need to authenticate (see module.routeSecurity)
   .constant('loginRedirectPath', '/login')

   // your Firebase URL goes here
   .constant('FBURL', 'https://minuteman.firebaseio.com')