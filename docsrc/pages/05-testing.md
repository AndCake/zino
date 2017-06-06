---
layout: page
title: Testing
permalink: /testing
---

Zino offers snapshot testing for making sure that tests can be written very easily and tested equally quickly. Consider this simple [button link example](https://bitbucket.org/rkunze/zinojs/src/master/examples/src/btn.html):

{% highlight javascript %}
var z = require('zino/test');

describe('btn link component', () => {
	z.importTag('src/btn.html');

	it('receives the URL and renders the text properly', () => {
		z.matchesSnapshot('<btn page="https://bitbucket.org/rkunze/zinojs">ZinoJS</btn>')
	});
})
{% endhighlight %}

The first time, this test is executed, Zino creates a snapshot file that looks like this:

	<button class="special-button" type="button">
		ZinoJS
	</button>
	{
	  "data": {
	    "props": {},
	    "body": "ZinoJS",
	    "page": "https://bitbucket.org/rkunze/zinojs"
	  },
	  "events": [
	    {
	      "button": [
	        "click = [function]changePage"
	      ]
	    }
	  ],
	  "tagName": "btn"
	}

The snapshot artifact should be committed alongside the code changes. On subsequent runs Zino will compare the rendered output with the snapshot. If it matches, the test passes. If it doesn't match, either the implementation changed and the snapshot can be updated by confirming that the change is intended or you found a bug in your code that should be fixed.

## Installation & usage

Testing Zino components can be done in NodeJS context after installing it via NPM:

{% highlight bash %}
$ npm install zino
{% endhighlight %}

Once it is installed, in your project, create a `test/` directory. Place all your tests in that directory. It is recommended to use [MochaJS](http://mochajs.org/) for your tests but any test framework will do.

Zino offers two methods to support your testing efforts:

 * `importTag(<pathToTag>)` - imports a Zino component into the registry so that it can be used for testing
 * `matchesSnapshot(<tagExample>, <data>)` - renders the tag as if it were used in a browser and checks if a previous snapshot of it has changed

Since events will usually trigger state changes, these events can be simulated by calling the `matchesSnapshot()` method with the data parameter, which allows you to overwrite props values. For our [todolist tag](https://bitbucket.org/rkunze/zinojs/src/master/examples/src/todolist.html) example, this could look like that:

{% highlight javascript %}
const zino = require('zino/test');

describe('todo-list', () => {
	zino.importTag('examples/dist/todolist.html');

	it('renders empty', () => zino.matchesSnapshot('<todo-list></todo-list>'));
	it('renders todos', () => {
		let data = {
			props: {
				tasks: ['Task 1']
			}
		};
		zino.matchesSnapshot('<todo-list></todo-list>', data);
	});
})
{% endhighlight %}

Please refer to the [test/zino-tester.js](https://bitbucket.org/rkunze/zinojs/src/master/test/zino-tester.js) for more examples of how snapshots can be used.
