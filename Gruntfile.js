/* jshint node:true */
/*
 * grunt
 *
 *
 * Copyright (c) 2016 Robert Kunze
 * Licensed under the UNLICENSED license.
 */

'use strict';

module.exports = function(grunt) {
	// Project configuration.
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		watch: {
			options: {
				livereload: true
			},
			examples: {
				files: ['examples/src/*.html'],
				tasks: ['zino']
			},
			zino: {
				files: ['zino.js'],
				tasks: ['build']
			}
		},
		connect: {
			server: {
				options: {
					port: 8000,
					base: './',
					open: 'http://localhost:8000/examples/index.html'
				}
			}
		},
		zino: {
			comps: {
				files: [{
					expand: true,
					cwd: './examples/src',
					src: ['*.html'],
					dest: './examples/dist'
				}]
			}
		},
		uglify: {
			options: {
				mangle: true,
				compress: true,
				sourceMap: true,
				screwIE8: true
			},
			main: {
				files: [{'zino.min.js': 'zino.js'}]
			}
		},
		compress: {
			main: {
				options: {
					mode: 'gzip'
				},
				files: [{'zino.min.js.gz': 'zino.min.js'}]
			}
		}
	});

	grunt.registerTask('build', ['uglify', 'compress']);
	grunt.registerTask('default', ['build', 'zino', 'connect', 'watch']);
};
