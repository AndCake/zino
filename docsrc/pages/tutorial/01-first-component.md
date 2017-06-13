---
layout: page
title: Your first component
---

Our comment box will have all the previously-defined features. However, since we want to achieve a high reusability of all our code, we will break it down to three components in total:

 - the component-box will contain a list of comments
 - every comment is a component
 - the form to enter new comments is another component

Working with components and in a very modular way is what Zino is really made for. So let's go ahead and define our comment-box first.

Create a new file called `comment-box.html`. Give it the following contents:

{% highlight mustache linenos %}
<comment-box>
	<h1>Comments</h1>
	<ul>
		<li>
			<comment author="{{'{{'}}props.author}}">
				{{'{{'}}props.comment}}
			</comment>
		</li>
	</ul>
	<comment-form></comment-form>
</comment-box>
{% endhighlight %}

So what's happening here? The outermost tag `<comment-box>`, tells Zino that this is the new tag's name. Everything within that tag is describing how it will be rendered.

The variable `props` refers to the internal state of our component. It will have the variable data stored in it. How, this happens, we will get to later.

In line five you might be wondering what's happening with the curly braces: that's the Mustache syntax to render variables. Please read up on it over at the [Templates page]({{site.baseurl}}/templates).

By using the `<comment>` and the `<comment-form>` tags, we are basically employing the other components we are going to build.

So far so good. Let's flesh the first one out:

comment.html:

{% highlight mustache linenos %}
<comment>
	<h2>"{{'{{'}}author}}" says:</h2>
	<p>{{'{{'}}body}}</p>
</comment>
{% endhighlight %}

Here we use the attribute we passed the author over with by also just using it the Mustache-way. If you remember, in the `comment-box` component, we were handing the actual comment not as an attribute into the comment tag, but actually as the tag's body. That's why here we refer to it by using the `body` variable.

If you try to run the above, you won't see very much yet. That's because there is no data to be shown. so let's add some real data to our `comment-box` component:

In our `comment-box.html`, let's add a script tag to define our state:

{% highlight mustache %}
	...
	<script>
		(function () {
			Zino.import('comment.html');
			return {
				props: {
					author: 'Leeroy Jenkins',
					comment: 'Yeehaa! This is my first comment with Zino!'
				}
			};
		}())
	</script>
</comment-box>
{% endhighlight %}

So what did we do? First, we added a function that returns our props which define the different data variables we want to use in our component. `Zino.import()` is called in order to tell Zino that our component relies on another component. The path provided is always relative to the current component. It will automatically mount and render it. Sometimes you don't need to import anything if a component doesn't use other components. In these cases, you can just define the JSON object we returned above instead of wrapping it into a function.

Obviously it is not good only being able to have one comment at a time. Therefore, let's turn our comments into an array in our props:

{% highlight mustache %}
...
<ul>
	{{'{{'}}#props.comments}}
		<li><comment author="{{'{{'}}author}}">{{'{{'}}comment}}</comment></li>
	{{'{{'}}/props.comments}}
</ul>
...
<script>
{% endhighlight %}
{% highlight javascript %}
    ...
	return {
		props: {
			comments: [{
				author: 'Leeroy Jenkins',
				comment: 'Yeehaa! This is my first comment with Zino!'
			}, {
				author: 'Johnny Walker',
				comment: 'I\'m second with my fifty cents.'
			}]
		}
		...
{% endhighlight %}

So by employing the typical Mustache syntax, we iterate over the comments from our internal props and render them. Obviously this is still not optimal, since we actually might want to retrieve the data from a database.
