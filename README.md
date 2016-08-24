ZinoJS - Tiny Components
========================

This is a microframework similar to ReactJS and Polymer but without all the bloating and additional dependencies.

Comparison
----------

- ReactJS: 43.8 KB minified & gzipped
- Polymer: 48.80 KB minified & gzipped
- ZinoJS: 2.3 KB minified & gzipped

Features
--------

- define custom components in a human-readable way
- event handling
- Flux support - just define your stores
- lifecycle events
- no extra HTML elements/root elements
- uses Mustache-like Syntax to keep components clean
- no polyfills required
- works with your coding style
	- Write a component in one file or split it up into files by different technologies
	- plays well together with jQuery and other UI frameworks
- dynamic on-demand loading of components
- can be integrated to work with grunt
	- use SASS, LESS or Stylus for your component
	- write your JS in ES6, Typescript or CoffeeScript, and/or use Browserify
	- Zino Grunt task merges separated technologies back into the components for easier deployment
- faster to download
- use CSS in JS the React way or define an automatically scoped fully-fledged stylesheet or mix both

Getting started
---------------

In order to create a new component using ZinoJS, simply create a new HTML file that looks like that:

	<my-component>
		<!-- the content of this component comes here -->
		<p>Hello {{name}}!</p>
	</my-component>

This very simple component will just render the text "Hello World!" in a P tag.

In order to use this component, you have to load it in your page's HTML using a link tag with rel="zino-tag" specified. Additionally, you will need to add the zino.js at the very end of your body tag.

Here a simple example page HTML:

	<!DOCTYPE html>
	<html>
		<head>
			<!-- load the component statically -->
			<link rel="zino-tag" href="my-component.html"/>
		</head>
		<body>
			<!-- use component, will be rendered here. -->
			<my-component name="World"></my-component>

			<!-- load ZinoJS, initialize & mount all statically loaded components -->
			<script src="zino.js"></script>
		</body>
	</html>

### Next Steps

Check out the tutorial and API documentation or take a look at the examples from the `examples/` directory.

Tutorial
========

For this tutorial you will need a running server to serve your static files. You can use the Gruntfile from this repository and adapt it to your needs. Don't forget to take over
the dev dependencies from the package.json, though.

In this tutorial, we will be creating a simple comment component where you can see
all the comments that have been entered before, enter a new comment and functionality
to bind it your backend.

Create your tutorial HTML file that looks like this:

	<!DOCTYPE html>
	<html>
		<head>
			<link rel="zino-tag" href="dist/comment-box.html"/>
		</head>
		<body>
			<comment-box></comment-box>

			<script src="zino.js"></script>
		</body>
	</html>

Your first component
--------------------

Our comment box will have all the previously-defined features. However, since we want to achieve a high reusability of all our code, we will break it down to three components in total:

 - the component-box will contain a list of comments
 - every comment is a component
 - the form to enter new comments is another component

Working with components and in a very modular way is what Zino is really made for. So let's go ahead and define our comment-box first.

Create a new file, in a directory called "dist", called "comment-box.html" (as specified in the above example page). Give it the following contents:

	<comment-box>
		<h1>Comments</h1>
		<ul>
			<li>
				<comment author="{{props.author}}">{{props.comment}}</comment>
			</li>
		</ul>
		<comment-form></comment-form>
	</comment-box>

So what's happening here? The outermost tag "<comment-box>", tells ZinoJS that this is the new tag's name. Everything within that tag is describing how it will be rendered.

The variable `props` refers to the internal state of our component. It will have the variable data stored in it. How, this happens, we will get to later.

In line five you might be wondering what's happening with the curly braces: that's the Mustache syntax to render variables. Please read up on it over at the [Mustache website](http://mustachejs.org).

By using the <comment> and the <comment-form> tags, we are basically employing the other components we are going to build.

So far so good. Let's flesh the first one out:

comment.html:

	<comment>
		<h2>"{{author}}" says:</h2>
		<p>{{body}}</p>
	</comment>

Here we use the attribute we passed the author over with by also just using it the Mustache-way. If you remember, in the comment-box component, we were handing the actual comment not as an attribute into the comment tag, but actually as the tag's body. That why here we refer to it by using the `body` variable.

If you try to run the above, you won't see very much yet. That's because there is no data to be shown. so let's add some real data to our comment-box component:

In our comment-box.html, let's add a script tag to define our state:

	...
		<script>
			({
				props: {
					author: 'Leeroy Jenkins',
					comment: 'Yeehaa! This is my first comment with Zino!'
				},

				render: function() {
					Zino.mount('comment', this.querySelectorAll('comment'), 'dist/comment.html');
				}
			})
		</script>
	</comment-box>

So what did we do? First, in props, we define the different data-variables we want to use in our component. The render function is called every time the tag is rendered. Since we want to dynamically add our comment component, we have to mount it after using it.

Obviously it is not good only being able to have one comment at a time. Therefore, let's turn our comments into an array in our props:

	...
	<ul>
		{{#props.comments}}
			<li><comment author="{{author}}">{{comment}}</comment></li>
		{{/props.comments}}
	</ul>
	...
	<script>
		({
			props: {
				comments: [{
					author: 'Leeroy Jenkins'
					comment: 'Yeehaa! This is my first comment with Zino!'
				}, {
					author: 'Jonny Walker',
					comment: 'I\'m second with my fifty cents.'
				}]
			}
			...

So by employing the typical Mustache syntax, we iterate over the comments from our internal props and render them. Obviously this is still not optimal, since we actually might want to retrieve the data from a database.

In order to understand how communication with the backend works, let's to a small excursion to a concept called "Flux". With a typical Model-View-Controller pattern, you would have a model that retrieves the data from the database and hands it over to the controller which finally triggers the view to re-render the results. With Flux, this concept changes:

When the user interacts with a view, so for example our component, the view sends an action through ZinoJS, which acts as a dispatcher for all messages, to the various stores that want to be notified of such an action. The stores then do their respective data changes and notify the view through the dispatcher of the changes done.

In praxis, this means that first, we create our store by creating a new file, called "comment-store.js". The file should look like that:

	(function() {
		'use strict';

		var comments = [];

		// initially load the comments from the server
		Zino.fetch('comments.json', function(data) {
			comments = JSON.parse(data) || [];

			// once loaded, notify everyone about the changes
			Zino.trigger('comments-changed', comments);
		});

		Zino.on('comments-initialize', function() {
			// send over the list of comments to anyone listening
			Zino.trigger('comments-changed', comments);
		});
	}());

As you can see, the store mainly deals with handling our actual comment data. Zino.trigger() and Zino.on() are used to communicate with the dispatcher. Now let's update our component to make use of the store:

	...
	<script>
	({
		props: {
			comments: []
		},

		mount: function() {
			// listen for comments-changed events
			Zino.on('comments-changed', this.changeHandler = function(comments) {
				// update our internal state
				this.setState('comments', comments);
			}.bind(this));

			// notify the store that we need the latest data
			Zino.trigger('comments-initialize');
		},
		unmount: function() {
			Zino.off('comments-changed', this.changeHandler);
		},

		render: function() {
			...

The mount() and unmount() functions are called once our component is mounted/added to the page or unmounted/removed from the page. On those, we tell our dispatcher, that we want to be notified of any changes to the comments in our store. If there is one, we simply update our internal component state but using this.setState(). Every time you call setState and therefore change the internal state of the component, it triggers a re-render of the component, thereby displaying our updated comment list.

Last but not least, by triggering the comments-initialize action, we tell our store to send us everything he has for this action.

Now let's write our component for adding a new entry. Create the file comment-form.html:

	<comment-form>
		<form class='comment-form'>
			<input type="text" name="author" placeholder="Your name" />
			<textarea name="comment" placeholder="Say something..."></textarea>
			<button>Post</button>
		</form>
		<script>
		({
			events: {
				form: {
					submit: function(e) {
						e.preventDefault();
						Zino.trigger('comments-added', {
							author: this.author.value,
							comment: this.comment.value
						});
					}
				}
			}
		})
		</script>
	</comment-form>

So what does this mean? With the events property we can register any kind of event for any part of our component. I won't register events to anything outside the component. So in this case, we select the form element, but any kind of CSS selector would work, there. For example, instead of 'form', we could also use '.comment-form' as the key in our object.

Within the event's form object, we have defined the submit property, which is a function that handles the event, once it occurs. Within this function, we simply tell our store what the new comment's author and content are, the store will deal with the rest.

For our store to actually support this action, we need to extend it with the following code in comment-store.js:

		...
		// when receiving the notification about an added comment
		Zino.on('comments-added', function(comment) {
			// add it to the list of comments
			comments.push(comment);

			// send comments to the server
			// ...

			// once done, trigger the comments-changed event to notify everyone
			Zino.trigger('comments-changed', comments);
		});
	}());

Last but not least, we need to tell our comment-box to actually mount our comment-form component:

	...
	render: function() {
		Zino.mount('comment', this.querySelectorAll('comment'), 'dist/comment.html');
		Zino.mount('comment-form', this.querySelectorAll('comment-form'), 'dist/comment-form.html');		
	}
	...

Now, the last part of our tutorial goes into showing how to style our components. Obviously the components can be styled by just using a global stylesheet. However, doing so will get you all the problems that are [intrinsically part of CSS at scale](https://speakerdeck.com/vjeux/react-css-in-js).

Instead, you can use component-specific styling, which can be added by including a CSS file into the component. Alternatively, you can use the style tag directly, to put small amounts of component-specific CSS code. Doing either of those will turn the CSS into component-specific CSS by prefixing it accordingly.

Let's style our `comment-form` component with that in mind:

		...
		})
		</script>

		<style>
			input, textarea {
				display: block;
				width: 200px;
				padding: 2px 5px;
				margin-bottom: 5px;
				border: 1px solid #ccc;
			}

			button {
				background: #efefef;
				border: 1px solid #ccc;
				text-transform: uppercase;
				color: #414141;
				border-radius: 3px;
				padding: 2px 5px;
				cursor: pointer;
			}
			button:hover {
				background: #fff;
				box-shadow: 0px 0px 2px #efefef;
				color: black;
			}
		</style>
	</comment-form>

As mentioned above, the element styles will not apply to any element outside our component. However, styles from the outer scope might leak in here, if you defined any. In order to prevent any leakage of styles into the innerts of your components and to resolve the above-mentioned intrinsic problems of CSS, the safest way is to use Javascript-based CSS.

Let's see how this works. Out comment-box component should never leak it's own style to included components, so therefore, we define the styling within the script tag rather than the style tag as before. This looks like that:

		render: function() {
			...
		},

		styles: {
			commentList: {
				listStyleType: 'none',
				margin: 0,
				padding: 0
			},

			entry: {
				marginBottom: '0.5em',
				paddingTop: '0.5em',
				borderBottom: '1px solid #6ac'
			}
		}
	})
	</script>

You can see, that the normal CSS rules are simply transformed into JSON objects and properties. All dashed properties are - for the sake of a simplified writing - camel-cased instead. Additionally, number values are converted to pixel values for you and functions are automatically evaluated at render-time.

Since you now are in a Javascript context, you automatically also have access to variables, expressions & calculations, libraries, dependency management, etc...

Let's see how to apply these styles to elements in our component:

	<comment-box>
		<h1>Comments</h1>
		<!-- apply the commentList style to the UL -->
		<ul style={{%styles.commentList}}>
			{{#props.comments}}
				<!-- apply the entry style to the LI -->
				<li style={{%styles.entry}}><comment author="{{author}}">{{comment}}</comment></li>
			{{/props.comments}}
		</ul>
		<comment-form></comment-form>
		...

The style attribute is used for it. It makes more sense defining the style attribute in order to style an element rather than saying it should be of a specific class.

We also have the option of combining multiple defined styles into one style for a tag. We're going to do this in our comment component:

	<comment>
		<h2 style={{%styles.reset, styles.author}}>"{{author}}" says:</h2>
		<p style={{%styles.reset, styles.comment}}>{{body}}</p>

		<script>
		({
			styles: {
				reset: {
					margin: 0
				},

				author: {
					padding: 0,
					fontSize: '1em',
					color: '#6ac'
				},

				comment: {
					fontSize: 13,
					paddingLeft: '1em'
				}
			}
		})
		</script>
	</comment>

Both techniques, the script-based styling and normal CSS styling can also be combined. By employing the normal

	<link rel="stylesheet" href="mystylesheet.css"/>

you can also apply the localized version of the CSS by using the grunt-zino task to re-integrate it back into the component on build time, thereby enabling you to manage your styles outside.

API Documentation
=================

Components
----------

Importing custom tags on page via:

	<link type="zino/tag" href="..."/>

All the script tags that are part of a component are evaluated. If any of them returns an object, it's properties are bound to the component.

There are certain default properties that do exist for every component implicitly:

	* events
		- used to define any events that should be applied to the components sub-elements. The structure of this object is:

			events: {
				<CSS-selector>: {
					<event-to-listen-for>: <event-handler>,
					<another-event>: <another-event-handler>,
					...
				},
				<another-css-selector>: {
					...
				}
			}

		- a special CSS selector can be used to bind an event to the component tag itself: `:host`

		- Example:

			events: {
				// define events on all "A" tags in our component
				a: {
					// define a CLICK event
					click: function(event) {
						event.preventDefault();
						location.href = 'my-other-url';
					}
				},
				// define events for all text INPUT elements in our component
				'input[type="text"]': {
					// define a CHANGE event for them
					change: function(event) {
						// ...
					}
				}
			}

	* props
		- an object used to define the initial internal state of the component. You can read the state by using `this.props.<prop-name>`, however, never write a value to the state using this syntax. Instead use `this.setState('<prop-name>', <prop-value>);`, else there will be no automatic re-rendering of the component upon state-change.

		- Example:

			props: {
				myprop: 'Hello, World!',
				myOtherProp: [1, 2, 3]
			}

	* render
		- a function that called whenever the component is re-rendered. Do not put expensive logic into this function, since it will slow down rendering.
		- the render function is usually a good place to mount all used sub-components of the current component.

	* mount
		- a function that is called whenever the component is added to the page.
		- this function is usually a good place to do some basic initialization, for example connecting to a store through the dispatcher

	* unmount
		- a function that is called when the component is removed from the page again
		- this function is a good place to cleanup any used resources and to disconnect from stores.

	* styles
		- an object to define any component-specific styling in JS-form. It's structure should be as follows:

			styles: {
				<name>: {
					<css-property>: <css-property-value>
				}
			}

		- CSS property values can be strings, numbers or functions returning any of them. Strings will be directly applied as is, numbers will be converted to PX before the style is applied and functions will be called with the currently available data-context (provided in this) in order to retrieve the respective value.
		- CSS properties are camelCased. However, please note, that vendor-prefixes other than "ms" should begin with a capital letter.

		- Example:

			styles: {
				link: function() {
					return {color: this.props.color};
				},
				button: {
					border: '1px solid red',
					color: function() { return this.props.color; },
					WebkitTransition: 'all',	// notice the upper-cased W here
					msTransition: 'all'
				}
			}

You can define additional properties for the component that will be automatically bound to the component upon mounting by returning them in any of the component's script tags.

ZinoJS itself
-------------

ZinoJS exports a set of functions in order to interact with it. Those functions are available in the Zino scope.

	- mount(tagName, element[, url][, props])
		- tagName - name of the tag to be mounted
		- element - the DOM element to be mounted
		- url - URL to load the element from, if not loaded yet (optional)
		- props - initially set properties (optional)

		Mounts the given element as the given tag name, optionally, loaded from the
		server, if it has not been loaded already. This is especially useful, if you want to render a component dynamically, meaning after the page load.

		Example:

			<script>
			(function() {
				var myNewComponent = document.createElement('my-component');
				document.body.appendChild(myNewComponent);
				Zino.mount('my-component', myNewComponent);

				// render a component that has not been loaded statically
				var myOtherComponent = document.createElement('my-other-component');
				document.body.appendChild(myOtherComponent);
				Zino.mount('my-other-component', myOtherComponent, "./my-other-component.html");

				// hand over some props
				var myData = ["test", 1, 2];
				var myComponent = document.createElement('my-component');
				document.body.appendChild(myComponent);
				Zino.mount('my-component', myComponent, myData);
			}());
			</script>


	- mountAll([baseElement])
		- baseElement - DOM element to start mounting from (optional, default = document.body)

		Mounts all loaded tags on the page, starting from the given position

	- trigger(event[, data])
		- event - name of the event to trigger
		- data - data to send with the event (optional)

		Triggers the given event

	- on(event, callback)
		- event - name of the event to listen for
		- callback - callback function to call when the event is triggered

		Listens for the given event and calls the callback for every occurrence.
		Any data sent with the trigger will be directly given into the callback.

	- one(event, callback)
		- event - name of the event to listen for
		- callback - callback function to call when the event is triggered

		Listens for the given event and calls the callback only for the first
		occurrence. Any data sent with the trigger will be directly given into
		the callback.

	- off(event, callback)
		- event - name of the event to listen for
		- callback - function to remove as event listener

		Removes the event listener for the given event

	- fetch(url, callback)
		- url - from where to fetch some content/data?
		- callback - function to call once successful

		Do a very simple AJAX call (supports only GET). The response body will
		be handed into the callback function as it is received.
