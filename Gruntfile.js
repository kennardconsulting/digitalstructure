module.exports = function( grunt ) {

	// Project configuration.
	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),
		clean: [ 'dist' ],
		uglify: {
			my_target: {
				files: {
					'dist/output.min.js': [ 'js/*.js' ],
					'dist/lib.min.js': [ 'lib/angular/*.js', 'lib/jquery/*.js', 'lib/bootstrap/*.js', 'lib/metawidget/core/*.js', 'lib/metawidget/angular/*.js', 'lib/metawidget/bootstrap/*.js' ]
				}
			}
		},
		stylus: {
			compile: {
				files: {
					'dist/app.css': [ 'css/app.styl', 'lib/bootstrap/*.styl' ]
				}
			}
		},
		watch: {
			js: {
				files: [ 'js/*.js' ],
				tasks: [ 'uglify' ]
			},
			css: {
				files: [ 'css/*.styl' ],
				tasks: [ 'stylus' ]
			}
		}
	} );

	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-stylus' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );

	grunt.registerTask( 'default', [ 'clean', 'uglify', 'stylus', 'watch' ] );
};