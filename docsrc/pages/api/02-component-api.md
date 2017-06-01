---
layout: page
title: Component API
---

Importing components on page via:

{% highlight html %}
<link type="zino/tag" href="..."/>
{% endhighlight %}

All the script tags that are part of a component are evaluated. If any of them returns an object, it's properties are bound to the component.

### Component Properties

There are certain default properties that do exist for every component implicitly:

#### events

Used to define any events that should be applied to the components sub-elements. The structure of this object is:
{% highlight javascript %}
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
{% endhighlight %}

A special CSS selector can be used to bind an event to the component tag itself: `:host`.
The `this.getHost()` function can be used to access the component that event's target element belongs to.

*Example:*

{% highlight javascript %}
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
			this.getHost().setProps('query', this.value);
		}
	}
}
{% endhighlight %}

#### element

An object used to access the original tag's content before it is rendered. It uses a JSON-notation to allow access to child elements.

*Example:*

{% highlight javascript %}
// given the following structure:
// <my-tag>
//    <div><a href="#test" title="my title">click me</a></div>
//    <div><p>lorem ipsum</p></div>
// </my-tag>

// this will extract the A-tag's title attribute
element.div[0].a.title
{% endhighlight %}

#### body

An attribute of the custom element allowing read/write access to it's content. When using for write-access, the tag is automatically re-rendered.

*Example:*

{% highlight javascript %}
// somewhere on the page
document.querySelector('my-custom-tag').body = 'this is my new content';
{% endhighlight %}

#### props

An object used to define the initial internal state of the component. You can read the state by using `this.props.<prop-name>`, however, never write a value to the state using this syntax. Instead use `this.setProps('<prop-name>', <prop-value>);`, else there will be no automatic re-rendering of the component upon state-change.

*Example:*

{% highlight javascript %}
props: {
	myprop: 'Hello, World!',
	myOtherProp: [1, 2, 3]
}
{% endhighlight %}

#### render

A function that called whenever the component has been re-rendered. The render function is usually a good place to mount all used sub-components of the current component.

#### mount

A function that is called whenever the component is added to the page. This function is usually a good place to do some basic initialization, for example connecting to a store through the dispatcher

#### unmount

A function that is called when the component is removed from the page again. This function is a good place to cleanup any used resources and to disconnect from stores.

#### styles

An object to define any component-specific styling in JS-form. It's structure should be as follows:

{% highlight javascript %}
styles: {
	<name>: {
		<css-property>: <css-property-value>
	}
}
{% endhighlight %}

CSS property values can be strings, numbers or functions returning any of them. Strings will be directly applied as is, numbers will be converted to PX before the style is applied and functions will be called with the currently available data-context (provided in this) in order to retrieve the respective value.

CSS properties are camelCased. However, please note, that vendor-prefixes other than "ms" should begin with a capital letter.

*Example:*

{% highlight javascript %}
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
{% endhighlight %}

#### getHost()

Returns the component's instance. Use this to call `setProps()` and other instance methods from within event handlers.

#### setProps(prop[, value])

Call this function in order to update your props and trigger a re-render with the updated values.

The first parameter `prop` can be a the name of a prop (type string) or an object containing multiple props and their values. The second parameter is only used, if `prop` is a string to represent the prop's value.

*Never try to update your props without this method, unless you know what you are doing.*

#### onready

Once a component is initialized, meaning mounted and rendered, an optional `onready` function notifies you that this happened. Example:

{% highlight javascript %}
// somewhere in your code
...

// import the component we want to add to the DOM
Zino.import('my-tag');

// create the component's element
var myNewTag = document.createElement('my-tag');
myNewTag.setAttribute('myattr', 1);

// register the onready handler
myNewTag.onready = function() {
	// call setProps on myNewTag once the component is ready
	this.getHost().setProps('prop1', 'value1');
}

// attach the component to the DOM
document.body.appendChild(myNewTag);
...
{% endhighlight %}

#### Custom properties

You can define additional properties for the component that will be automatically bound to the component upon mounting by returning them in any of the component's script tags.

Since all these functions are bound to the Zino component they were defined for, you can access all methods and attributes of that tag via the DOM API. Example:

{% highlight html %}
	<!-- tag is used -->
	<my-tag myattr="1"></my-tag>
{% endhighlight %}

{% highlight javascript %}
	// in your tag's JS code then:
	render: function() {
		this.attributes.myattr.value === '1' // true
	}
{% endhighlight %}
