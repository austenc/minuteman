'use strict';
module.exports = function(grunt) {

  grunt.initConfig({
    less: {
      dist: {
        files: {
          'app/css/app.min.css': [
            'app/less/app.less'
          ]
        },
        options: {
          compress: true
        }
      }
    },
    watch: {
      less: {
        files: [
          'app/less/*.less',
          'app/less/bootstrap/*.less'
        ],
        tasks: ['less'],
        // Uncomment below to use grunt watch with a browser livereload extension
        // options: {
        //   livereload: true
        // }
      }
    },
    clean: {
      dist: [
        'app/css/main.min.css'
      ]
    }
  });

  // Load tasks
  grunt.loadNpmTasks('grunt-contrib-clean');
  //grunt.loadNpmTasks('grunt-contrib-jshint');
  //grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  
  // Register tasks
  grunt.registerTask('default', [
    'clean',
    'less'
  ]);
  grunt.registerTask('dev', [
    'watch'
  ]);

};
