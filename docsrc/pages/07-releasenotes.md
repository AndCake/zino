---
layout: default
permalink: /releases
---

# Release Notes

This page contains a summary of changes to the previous version

Version 3.3.0
-------------

- Migrated to MIT license
- added some comments to the code
- implemented feature #3: Support different base path for urls in component css
- implemented feature #6: HTML boolean attributes without values are no longer removed during the rendering process
- fixed a bug with rendering inverted sub blocks
- fixed issue #1: Not able to nest three levels or more
- fixed issue with "this" within the render function of sub components
- fixed an issue with nested blocks
- fixed an issue with mustache comments

Version 3.2.0
-------------

- replaced light DOM implementation with [nano-dom](https://www.npmjs.com/package/nano-dom) as an alternative to JSDOM for testing zino components (or pre-rendering) in a non-browser context
- added possibility to clear all custom events during testing by providing the `clearEvents()` function (see [Testing](/testing)).
- added possibility to react to pre-rendered tags in the `mount` function by using this.isRendered (see [Component API](/pages/api/02-component-api.html))
- fixed issues with pre-render detection
- fixed a bug where comments in script nodes could lead to syntax errors
- fixed a bug with dynamic HTML injection
- fixed an issue where attributes could not be consistently accessed between sub components and components
- fixed an issue where when an error was thrown, sometimes the causing exception's stack trace was lost


Version 3.1.0
-------------

- zino test now supports "external" JS files in components without an additional compilation step via grunt-zino. So testing your components like that is now possible:

	{% highlight mustache %}
	<my-component>
		<div class="content">
			{{props.text}}
		</div>
		<script src="./my-component.js"></script>
	</my-component>
	{% endhighlight %}
	{% highlight js %}
	// in ./my-component.js
	(function() {
		return {
			props: {
				text: 'Lorem ipsum dolor sit amet'
			}
		};
	}())
	{% endhighlight %}

- JSDOM dependency for testing has been removed (a very slim DOM implementation replaced it)
- fixed a bug where paths of sub components imported within other components were not resolved properly
- the publish-script event is fired again for external scripts

Version 3.0.0
-------------

- DOM-based mustache parser
	- templates are no longer being parsed and evaluated during re-rendering but instead at component registration
	- impact on syntax: it is no longer possible to have dynamic tag names or tag attributes as in the following example:

		{% highlight mustache %}
		<!-- DON'T DO THIS -->
		<my-component>
			<div class='content'>
				<{{'{{'}}props.tag}}></{{'{{'}}props.tag}}>
				<a {{#url}}href="{{.}}"{{/url}}>Test</a>
			</div>
			<script>
			{
				props: {tag: 'some-random-component'}
			}
			</script>
		</my-component>

		<!-- instead do this: -->
		<my-component>
			<div class='content'></div>
			{{#url}}
				<a href="{{.}}">Test</a>
			{{/url}}
			{{^url}}
				<a>Test</a>
			{{/url}}
			<script>
			{
				props: {tag: 'some-random-component'},
				render: function() {
					var element = document.createElement(this.props.tag);
					this.querySelector('.content').appendChild(element);
				}
			}
			</script>
		</my-component>
		{% endhighlight %}

- an extended VDOM now uses DOM diff to apply changes to the DOM more selectively, which drastically improves performance
- you can now create components in pure JS:

	{% highlight js %}
	function MyComponent(Tag) {
		return {
			tagName: 'my-component',
			render: function(data) {
				return new Tag('div', {id: 'my-id'}, [
					'Hello,',
					data.props.name,
					new Tag('p', {}, 'Paragraph')
				]);
			},
			styles: [':host { color: red; }', '#my-id { font-weight: bold; }'],
			functions: {
				props: {
					name: 'World!'
				}
			}
		};
	}

	Zino.import(MyComponent);
	{% endhighlight %}

- when using the regular HTML component definition, including sub components now supports self-closing tags

	{% highlight html %}
	<my-component>
		<div>
			<my-sub-component attribute="value"/>
		</div>
	</my-component>
	{% endhighlight %}
