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
		chokidar: {
			options: {
				livereload: true,
				spawn: false
			},
			examples: {
				files: ['examples/src/*.html'],
				tasks: ['zino']
			}
		},
		connect: {
			server: {
				options: {
					port: 8000,
					base: './',
					open: 'http://localhost:8000/test/index.html'
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
		}
	});

	grunt.registerTask('default', ['zino', 'connect', 'chokidar']);
};
