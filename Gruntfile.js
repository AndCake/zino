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
			},
			zino: {
				files: ['./src/*.js'],
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
				compress: {
					dead_code: true,
					unsafe: true,
					drop_debugger: true,
					conditionals: true,
					unused: true,
					hoist_funs: true,
					if_return: true,
					join_vars: true,
					collapse_vars: true,
					reduce_vars: true,
					warnings: true,
					keep_fargs: false,
					passes: 2
				},
				sourceMap: false,
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
		},
		assemble: {
			files: ['src/*.js'],
			targetDir: './'
		}
	});

	grunt.registerTask('assemble', 'assembles all components used by the library', function() {
		var files = grunt.file.expand(grunt.config.get(this.name).files),
			path = require('path'),
			targetDir = path.dirname(grunt.config.get(this.name).targetDir);

		files.forEach(function(file) {
			var data = grunt.file.read(file),
				changed = false;
			data = data.replace(/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/gm, function(match, fileName) {
				if (grunt.file.exists(path.dirname(file) + '/' + fileName + '.js')) {
					changed = true;
					return grunt.file.read(path.dirname(file) + '/' + fileName + '.js');
				} else {
					return match;
				}
			});
			if (changed) {
				grunt.file.write(targetDir + '/' + path.basename(file), data);
				console.log('Assembled file ' + path.basename(file));
			}
		});
	});

	grunt.registerTask('build', ['assemble', 'uglify', 'compress']);
	grunt.registerTask('default', ['build', 'zino', 'connect', 'chokidar']);
};
