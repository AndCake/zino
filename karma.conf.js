// Karma configuration
// Generated on Wed Apr 12 2017 09:40:22 GMT+0200 (CEST)

module.exports = function(config) {
	var customLaunchers = {
		sl_chrome: {
			base: 'SauceLabs',
			browserName: 'chrome',
			platform: 'Windows 7',
			version: '35'
		},
		sl_firefox: {
			base: 'SauceLabs',
			browserName: 'firefox',
			version: '30'
		},
		sl_ie_11: {
			base: 'SauceLabs',
			browserName: 'internet explorer',
			platform: 'Windows 8.1',
			version: '11'
		}
	},
	sauce = require('./.saucelabs.json');

	config.set({

	// base path that will be used to resolve all patterns (eg. files, exclude)
	basePath: './',

	sauceLabs: {
		testName: 'Zino Unit Tests',
		username: sauce.user,
		accessKey: sauce.key
	},
	customLaunchers: customLaunchers,

	// frameworks to use
	// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
	frameworks: ['mocha'],


	// list of files / patterns to load in the browser
	files: [
		'zino.min.js',
		'test/karma/**/test.*.js',
		{pattern: 'examples/dist/**/*.html', included: false},
	],


	// list of files to exclude
	exclude: [
	],


	// preprocess matching files before serving them to the browser
	// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
	preprocessors: {
	},


	// test results reporter to use
	// possible values: 'dots', 'progress'
	// available reporters: https://npmjs.org/browse/keyword/karma-reporter
	reporters: ['progress', 'saucelabs'],


	// web server port
	port: 9876,


	// enable / disable colors in the output (reporters and logs)
	colors: true,


	// level of logging
	// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
	logLevel: config.LOG_WARN,


	// enable / disable watching file and executing tests whenever any file changes
	autoWatch: true,


	// start these browsers
	// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
	browsers: Object.keys(customLaunchers),


	// Continuous Integration mode
	// if true, Karma captures browsers, runs the tests and exits
	singleRun: true,

	// Concurrency level
	// how many browser should be started simultaneous
	concurrency: Infinity
})
}
