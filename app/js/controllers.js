'use strict';

/* Controllers */

angular.module('myApp.controllers', []) 

   .controller('HeaderCtrl', ['$scope', 'loginService', function($scope, loginService) {
      $scope.logout = function() {
         loginService.logout();
      }
   }])

   // HOME
   .controller('HomeCtrl', ['$scope', '$timeout', 'syncData', function($scope, $timeout, syncData) {

      $scope.theTask = null;
      $scope.tasks   = null;
      $scope.taskDB  = null; // for tracking current task
      $scope.working = false;
      $scope.paused  = false;
      $scope.counter = 0;

      // constrain number of messages by limit into syncData
      $scope.tasks = syncData('tasks').$child($scope.auth.user.uid);

      // Setup the timer for later
      $scope.onTimeout = function(){
         $scope.counter++;
         workTime = $timeout($scope.onTimeout, 1000);

         if(!!$scope.taskDB)
            $scope.tasks.$child($scope.taskDB).$child('timeTaken').$set($scope.counter);
      }

      var workTime = null;

      $scope.pause = function(){
         $timeout.cancel(workTime);
         $scope.paused  = true;
      }

      $scope.resume = function(){
         workTime = $timeout($scope.onTimeout, 1000);
         $scope.paused  = false;
      }

      // Stop work on current task
      $scope.finish = function(){
         $timeout.cancel(workTime);

         $scope.working = false;  
         $scope.counter = 0;
         $scope.taskDB  = null;
      }

      // Start / Add new task
      $scope.addTask = function() {
         if( $scope.theTask ) {
            // update the UI
            workTime = $timeout($scope.onTimeout, 1000);
            $scope.working = true;

            // Add the task to the user's tasks!
            $scope.tasks.$add({text: $scope.theTask, start: new Date()}).then(function(ref){
               $scope.taskDB = ref.name();
            });

         }
      };
   }])

   // LOGIN
   .controller('LoginCtrl', ['$scope', 'loginService', '$location', function($scope, loginService, $location) {
      $scope.email = null;
      $scope.pass = null;
      $scope.confirm = null;
      $scope.createMode = false;

      $scope.login = function(cb) {
         $scope.err = null;
         if( !$scope.email ) {
            $scope.err = 'Please enter an email address';
         }
         else if( !$scope.pass ) {
            $scope.err = 'Please enter a password';
         }
         else {
            loginService.login($scope.email, $scope.pass, function(err, user) {
               $scope.err = err? err + '' : null;
               if( !err ) {
                  cb && cb(user);
               }
            });
         }
      };

      $scope.createAccount = function() {
         $scope.err = null;
         if( assertValidLoginAttempt() ) {
            loginService.createAccount($scope.email, $scope.pass, function(err, user) {
               if( err ) {
                  $scope.err = err? err + '' : null;
               }
               else {
                  // must be logged in before I can write to my profile
                  $scope.login(function() {
                     loginService.createProfile(user.uid, user.email);
                     $location.path('/account');
                  });
               }
            });
         }
      };

      function assertValidLoginAttempt() {
         if( !$scope.email ) {
            $scope.err = 'Please enter an email address';
         }
         else if( !$scope.pass ) {
            $scope.err = 'Please enter a password';
         }
         else if( $scope.pass !== $scope.confirm ) {
            $scope.err = 'Passwords do not match';
         }
         return !$scope.err;
      }
   }])

   .controller('AccountCtrl', ['$scope', 'loginService', 'syncData', '$location', function($scope, loginService, syncData, $location) {
      syncData(['users', $scope.auth.user.uid]).$bind($scope, 'user');

      $scope.logout = function() {
         loginService.logout();
      };

      $scope.oldpass = null;
      $scope.newpass = null;
      $scope.confirm = null;

      $scope.reset = function() {
         $scope.err = null;
         $scope.msg = null;
      };

      $scope.updatePassword = function() {
         $scope.reset();
         loginService.changePassword(buildPwdParms());
      };

      function buildPwdParms() {
         return {
            email: $scope.auth.user.email,
            oldpass: $scope.oldpass,
            newpass: $scope.newpass,
            confirm: $scope.confirm,
            callback: function(err) {
               if( err ) {
                  $scope.err = err;
               }
               else {
                  $scope.oldpass = null;
                  $scope.newpass = null;
                  $scope.confirm = null;
                  $scope.msg = 'Password updated!';
               }
            }
         }
      }

   }]);