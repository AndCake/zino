---
layout: page
title: Styling Components
---

Now, the last part of our tutorial goes into showing how to style our components. Obviously the components can be styled by just using a global stylesheet. However, doing so will get you all the problems that are [intrinsically part of CSS at scale](https://speakerdeck.com/vjeux/react-css-in-js).

Instead, you can use component-specific styling, which can be added by including a CSS file into the component. Alternatively, you can use the style tag directly, to put small amounts of component-specific CSS code. Doing either of those will turn the CSS into component-specific CSS by prefixing it accordingly.

Let's style our `comment-form` component with that in mind:

{% highlight html %}
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
{% endhighlight %}

As mentioned above, the element styles will not apply to any element outside our component. However, styles from the outer scope might leak in here, if you defined any. In order to prevent any leakage of styles into the innerts of your components and to resolve the above-mentioned intrinsic problems of CSS, the safest way is to use Javascript-based CSS.

Let's see how this works. Our `comment-box` component should never leak it's own style to included components, so therefore, we define the styling within the script tag at the `style` property rather than the style tag as before. This looks like that:

{% highlight js %}
    {
        ...
		unmount: function() {
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
	};
}())
{% endhighlight %}

You can see, that the normal CSS rules are simply transformed into JSON objects and properties. All dashed properties are - for the sake of a simplified writing - camel-cased instead. Additionally, number values are converted to pixel values for you and functions are automatically evaluated at render-time.

Since you now are in a Javascript context, you automatically also have access to variables, expressions & calculations, libraries, dependency management, etc...

Let's see how to apply these styles to elements in our component:

{% highlight mustache linenos %}
<comment-box>
    <h1>Comments</h1>
    <!-- apply the commentList style to the UL -->
    <ul style="{{'{{'}}%styles.commentList}}">
        {{'{{'}}#props.comments}}
            <!-- apply the entry style to the LI -->
            <li style="{{'{{'}}%styles.entry}}">
                <comment author="{{'{{'}}author}}">
                    {{'{{'}}comment}}
                </comment>
            </li>
        {{'{{'}}/props.comments}}
    </ul>
    <comment-form></comment-form>
    ...
{% endhighlight %}

The `{{'{{'}}%...}}` is an extension to the Mustache syntax. You can learn more about that over in the Mustache Enhancements section of this documentation.
The style attribute is used for styling the element. It makes more logical sense of employing the style attribute in order to style an element rather than saying it should be of a specific class.

We also have the option of combining multiple defined styles into one style for a tag. We're going to do this in our `comment` component:

{% highlight mustache linenos %}
<comment>
	<h2 style="{{'{{'}}%styles.reset, styles.author}}">"{{'{{'}}author}}" says:</h2>
	<p style="{{'{{'}}%styles.reset, styles.comment}}">{{'{{'}}body}}</p>

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
{% endhighlight %}

Both techniques, the script-based styling and normal CSS styling can also be combined. Additionally, by employing the normal

{% highlight html %}
<link rel="stylesheet" href="mystylesheet.css"/>
{% endhighlight %}

you can also apply the localized version of the CSS by using the [grunt-zino](https://bitbucket.org/rkunze/grunt-zino) task to re-integrate it back into the component on build time, thereby enabling you to manage your styles outside and compile them from a CSS post-processor like SASS or LESS.
