---
layout: page
title: Testing
permalink: /testing
---

Zino offers snapshot testing for making sure that tests can be written very easily and tested equally quickly. Consider this simple [button link example](https://github.com/AndCake/zino/blob/master/test/components/btn.html):

{% highlight javascript %}
var z = require('zino/test');

describe('btn link component', () => {
	z.importTag('src/btn.html');

	it('receives the URL and renders the text properly', () => {
		z.matchesSnapshot('<btn page="https://andcake.github.io/zino">ZinoJS</btn>')
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
	    "page": "https://andcake.github.io/zino"
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

Zino offers three methods to support your testing efforts:

 * `importTag(<pathToTag>[, <document>])` - imports a Zino component into the registry so that it can be used for testing. If the second parameter, which should be a virtual DOM implementation is provided, all instances of the imported component will be rendered in that document
 * `matchesSnapshot(<tagExample>, <data>)` - renders the tag as if it were used in a browser and checks if a previous snapshot of it has changed
 * `clearImports()` - removes all imported components from memory.

### Testing with Snapshots

Since events will usually trigger state changes, these events can be simulated by calling the `matchesSnapshot()` method with the data parameter, which allows you to overwrite props values. For our [todolist tag](https://github.com/AndCake/zino/blob/master/test/components/todolist.html) example, this could look like that:

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

### Testing with jsDOM or similar

Sometimes you might want to have a little more context than a single component - e.g. to test the interactions between components. In order to do this, you can use libraries like jsDOM that simulate a DOM and have Zino render the components inside that DOM as it would on a normal page. Here is an example of how this looks like:

{%highlight javascript %}
const zino = require('zino/test');
const assert = require('chai').assert;
const JSDOM = require('jsdom').jsdom;

describe('comment-box', () => {
	// prepare the JSDOM document containing the code
	const html = '<comment author="Bucks Bunny">I love carrots!</comment>';
	let document = new JSDOM(html).window.document;

	it('renders the comment', () {
		// import the component used - please note the document is handed into importTag
		zino.importTag('test/components/comment.html', document);

		let comment = document.body.querySelector('comment');
		assert.equal(comment.children[0].children[0].innerHTML, '"Bucks Bunny"', 'rendered the component into the DOM');
	});
});
{% endhighlight %}

Please refer to the [test/zino-tester.js](https://github.com/AndCake/zino/blob/master/test/zino-tester.js) for more examples of how Zino tests can be used.
