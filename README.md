ZinoJS Tiny Components
====================

This is a microframework similar to ReactJS and Polymer but without all the bloating and additional dependencies.

Comparison:

- ReactJS: 43.8 KB minified & gzipped
- Polymer: 48.80 KB minified & gzipped
- ZinoJS: 2.3 KB minified & gzipped

Features:

- define custom components in a human-readable way
- event handling
- Flux support - just define your stores
- lifecycle events
- no extra HTML elements/root elements
- uses Mustache-like Syntax to keep components clean
- no polyfills required
- works with your coding style
	- write a component in one file
	- split it up into files by different technologies
	- plays well together with jQuery
- dynamic on-demand loading of components
- can be integrated to work with grunt
	- use SASS, LESS or Stylus for your component
	- write your JS in ES6, Typescript or CoffeeScript, and/or use Browserify
	- mol grunt task merges separated technologies back into the components for easier deployment
- faster to download
- use CSS in JS the React way or define an automatically scoped fully-fledged stylesheet or mix both
