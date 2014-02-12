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

      $scope.theTask      = null;
      $scope.tasks        = null;
      $scope.taskDB       = null; // for tracking current task
      $scope.currentBreak = null; // current break ref
      $scope.working      = false;
      $scope.slacking     = false;
      $scope.paused       = false;
      $scope.counter      = 0;
      $scope.breakCounter = 0;

      // constrain number of messages by limit into syncData
      $scope.tasks = syncData('tasks').$child($scope.auth.user.uid);

      // for the main counter / timer
      var workTime = null;

      // for break time!
      var breakTime = null

      // Watch the main counter to prompt for regular break times (every 30min)
      $scope.$watch('counter', function(){
         if($scope.counter > 0 && $scope.counter % (30*60) == 0) 
            $scope.takeBreak();
      });

      // Slacker watcher for breaktime (set for 5 minutes)
      $scope.$watch('breakCounter', function(){
         if($scope.breakCounter >= 5*60) // 5 minutes
            $scope.slacking = true;
      });

      // confirm() dialog to take a break or not
      $scope.takeBreak = function(){
         if(confirm('It\'s time for a break! Take 5?') == true)
         {
            // Break time! Add a new break to firebase, show timer as such..
            $scope.pause();
         }
      }

      // Break timer
      $scope.breakTimer = function(){
         $scope.breakCounter++;
         breakTime = $timeout($scope.breakTimer, 1000);

         if((!!$scope.taskDB) && (!!$scope.currentBreak))
            $scope.tasks.$child($scope.taskDB).$child('breaks').$child($scope.currentBreak).$child('timeTaken').$set($scope.breakCounter);
      }

      // Main timer
      $scope.taskTimer = function(){
         $scope.counter++;
         workTime = $timeout($scope.taskTimer, 1000);

         if(!!$scope.taskDB)
            $scope.tasks.$child($scope.taskDB).$child('timeTaken').$set($scope.counter);
      }

      $scope.pause = function(){
         // stop main work timer
         $timeout.cancel(workTime);

         // add new break to firebase
         $scope.tasks.$child($scope.taskDB).$child('breaks').$add({start: new Date(), timeTaken:0}).then(function(ref){
               $scope.currentBreak = ref.name();
         });         

         // start break timer
         breakTime = $timeout($scope.breakTimer, 1000);
         
         $scope.paused  = true;
      }

      $scope.resume = function(){
         // reset the break time for next break
         $timeout.cancel(breakTime);
         $scope.breakCounter = 0;
         $scope.currentBreak = null;

         // Setup main counter and start going!
         workTime = $timeout($scope.taskTimer, 1000);
         $scope.paused   = false;
         $scope.slacking = false;
      }

      // Stop work on current task
      $scope.finish = function(){
         // cancel any running timers
         $timeout.cancel(workTime);
         $timeout.cancel(breakTime);
         $scope.paused       = false;
         $scope.working      = false;  
         $scope.breakCounter = 0;
         $scope.counter      = 0;
         $scope.theTask      = null;
         $scope.taskDB       = null;
         $scope.currentBreak = null;
      }

      // Start / Add new task
      $scope.addTask = function() {
         if( $scope.theTask ) {
            // update the UI
            workTime = $timeout($scope.taskTimer, 1000);
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