---
layout: page
title: Server-side Rendering
---

In order to render a component on the server-side, Zino provides the following methods:

#### renderComponent(name, path[, props])
- name (String) - the component's name to render
- path (String) - which component to load and render
- props (Object) - any pre-defined properties that should be handed into the component before `mount()`

This function will render a component including all imported sub components into a virtual document. Every call of renderComponent creates a new virtual document. The function's result is a Promise that provides an object with the following properties:

- styles (String) - all generated CSS styles (including the style tags) for the rendered components
- preloader (String) - HTML code required to prefetch the rendered component (without extra network requests after page load)
- body (String) - HTML code of the rendered component(s)
- components (Object) - more detailed information on the components that were loaded on the server-side as part of this renderComponent call (contains the component's code and path)
- toString (Function) - when called, all required information will be bundled into one output string

*A simple nodeJS example:*
{% highlight js %}
var Zino = require('zino-ssr');
var http = require('http');
var url = require('url');
var path = require('path');

setBasePath(process.cwd());
setStaticBasePath('/static/');

http.createServer(function (request, response) {
	let uri = url.parse(request.url).pathname,
		filename = path.join(process.cwd(), uri);

	// home page
	if (uri === '/') {
		Zino.renderComponent('home', './homepage.js').
		then(result => {
			response.writeHead(200, {
				'Content-Type': 'text/html'
			});
			response.write(result.toString());
		}).catch(error => {
			// if the component could not be rendered correctly bail out
			response.writeHead(500, {
				'Content-Type': 'text/plain'
			});
			response.end('500 - unable to render page: ' + error);
		});
	// static contents loaded by browser
	} else if (uri.indexOf('/static/') === 0) {
		// simplified static file handling for demonstration purposes only!
		if (fs.existsSync(filename)) {
			fs.readFile(filename, 'binary', function (err, file) {
				response.writeHead(200);
				response.write(file, 'binary');
				response.end();
			});
		}
	}
}).listen(8080);
{% endhighlight %}

#### setBasePath(path)
- path (String) - the path that should become the new base path

This function defines from where components should be loaded on the server-side when calling `Zino.import()`. This path should be compatible to a require() call.

#### setStaticBasePath(path)
- path (String) - the path from which all the component files will be loaded by the Browser from the server.

This function defines where to load the components from on the client-side, when `Zino.import()` is called. Please note, that the path should be component-independent.

#### setCollector(fn)
- fn (Function) - callback function to be called when the final data has been provided

If the components that are rendered require additional, asynchronous data, setCollector can be used to define a callback function which is executed as soon as the components are rendered. That callback receives a parameter `next` of type Function, which, when called, leads to resolution or rejection of the promise returned by `renderComponent`. It is rejected if the next function is provided with an error message or object.

The default collector immediately executes the `next()` function.
