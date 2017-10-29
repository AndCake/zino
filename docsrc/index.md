---
layout: default
---

# Zino Documentation

![Chrome 18+](https://img.shields.io/badge/Chrome-18+-green.svg?style=flat&colorA=777777&colorB=679A00)
![Firefox 14+](https://img.shields.io/badge/Firefox-14+-green.svg?style=flat&colorA=777777&colorB=679A00)
![Mac & iOS Safari 6+](https://img.shields.io/badge/Safari-6.1+-green.svg?style=flat&colorA=777777&colorB=679A00)
![Internet Explorer 10](https://img.shields.io/badge/Internet Explorer-10-yellow.svg?style=flat&colorB=af8300&colorA=777777 "is supported with the MutationObserver polyfill")
![Internet Explorer 11](https://img.shields.io/badge/Internet Explorer-11-green.svg?style=flat&colorA=777777&colorB=679A00)
![Edge](https://img.shields.io/badge/Edge-20+-green.svg?style=flat&colorA=777777&colorB=679A00)

This is a microframework similar to ReactJS and Polymer but without all the bloating and additional dependencies.

To learn about the latest changes to Zino, please take a look at the [Release Notes]({{site.baseurl}}/releases).


## Features

- no polyfills required
- define custom components in a human-readable way
- can use Mustache-like Syntax or JSX to keep components clean
- event handling
- lifecycle events
- Flux support - simply define your stores
- uses virtual DOM to efficiently render with as few reflows / repaints as possible
- dynamic on-demand loading of components
- works with your coding style
  - write a component in one file or split it up into files by different technologies
  - write components directly in JS and bundle them with your favourite JS bundler
  - plays well together with jQuery and other UI frameworks
- can be integrated to work with grunt
  - use SASS, LESS or Stylus for your component
  - write your JS in ES6, Typescript or CoffeeScript, and/or use Browserify
- use CSS in JS the React way or define an automatically scoped fully-fledged stylesheet or mix both
- no extra editor/editor plugins for specialized syntax highlighting necessary
- server-side rendering

## Comparison

| Name | Version      | Size (minified & gzipped) | Comment |
|------|--------------|---------------------------|---------|
| AngularJS | 4.1.3   | 237.41 KB                 |         |
| Polymer   | 1.8.0   | 66.3 KB                   | with Web Components Polyfill Lite |
| ReactJS   | 15.6.1  | 51.1 KB                   | with Redux |
| Zino      | 4.0.0   | 4.7 KB                    | Zino-light |

Installation
------------

Zino can be installed through NPM:

{% highlight bash %}
$ npm install -D zino
{% endhighlight %}

Alternatively, you can use the unpkg CDN by adding a script tag to your page:

{% highlight html %}
<script src="https://unpkg.com/zino"></script>

<!-- or if you don't want Mustache Support, you can use zino-light -->
<script src="https://unpkg.com/zino/zino-light.min.js"></script>
{% endhighlight %}
