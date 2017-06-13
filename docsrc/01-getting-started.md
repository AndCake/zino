---
layout: page
title: Getting Started
permalink: /getting-started
---

In order to create a new component using ZinoJS, simply create a new HTML file that looks like that:

{% highlight mustache linenos %}
<my-component>
	<!-- the content of this component comes here -->
	<p>Hello {{'{{'}} name }}!</p>
</my-component>
{% endhighlight %}

This very simple component will just render the text "Hello World!" in a P tag.

In order to use this component, you have to load it in your page's HTML using a `link` tag with `rel="zino-tag"` specified. Additionally, you will need to add the zino.js at the very end of your body tag.

Here a simple example page HTML:

{% highlight html linenos %}
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
{% endhighlight %}

### Next Steps

Check out the [tutorial](/tutorial) and [API documentation](#/api-documentation) or take a look at the [examples](https://bitbucket.org/rkunze/zinojs/src/master/test/components/).
