---
layout: default
permalink: /releases
---

# Release Notes

This page contains a summary of changes to the previous version

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
	- impact on syntax: it is no longer possible to have dynamic tag names as in the following example:
		
		{% highlight mustache %}
		<!-- DON'T DO THIS -->
		<my-component>
			<div class='content'>
				<{{'{{'}}props.tag}}></{{'{{'}}props.tag}}>
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
