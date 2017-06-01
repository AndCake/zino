---
layout: page
title: Communicating with a backend system
---

In order to understand how communication with the backend works, let's to a small excursion to a concept called "Flux". With a typical Model-View-Controller pattern, you would have a model that retrieves the data from the database and hands it over to the controller which finally triggers the view to re-render the results. With Flux, this concept changes:

When the user interacts with a view, so for example our component, the view sends an action through Zino, which acts as a dispatcher for all messages, to the various stores that want to be notified of such an action. The stores then do their respective data changes and notify the view through the dispatcher of the changes done.

In praxis, this means that first, we create our store by creating a new file, called `comment-store.js`. The file should look like that:

{% highlight javascript linenos %}
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
{% endhighlight %}

As you can see, the store mainly deals with handling our actual comment data. `Zino.trigger()` and `Zino.on()` are used to communicate with the dispatcher. Just load the `comment-store.js` in our tutorial HTML file:

{% highlight html %}
    <script src="comment-store.js"></script>
{% endhighlight %}    

and we're ready to use it. Now let's update our component to make use of the store:

{% highlight js %}
...
return {
	props: {
		comments: []
	},

	mount: function() {
		// listen for comments-changed events
		Zino.on('comments-changed', this.changeHandler = function(comments) {
			// update our internal state
			this.getHost().setProps('comments', comments);
		}.bind(this));

		// notify the store that we need the latest data
		Zino.trigger('comments-initialize');
	},
	unmount: function() {
		// make sure we clean up after us
		Zino.off('comments-changed', this.changeHandler);
	}
};
...
{% endhighlight %}

The `mount()` and `unmount()` functions are called once our component is mounted/added to the page's DOM or unmounted/removed from the page's DOM. On those, we tell our dispatcher, that we want to be notified of any changes to the comments in our store. If there is one, we simply update our internal component state but using `this.getHost().setProps()`. The `getHost()` function will return the actual component instance. Every time you call `setProps` on it and therefore change the internal state of the component, it triggers a re-render of the component, thereby displaying our updated comment list.

Last but not least, by triggering the `comments-initialize` action, we tell our store to send us everything he has for this action.

Sometimes you might want to change something of the component after it has been rendered. For this, there is the property `render`. It works similar to `mount` and `unmount`, so is also a callback. Since it is called after every time the component is rendered, having complex logic there should be avoided.

Now let's write our component for adding a new entry. Create the file `comment-form.html`:

{% highlight html linenos %}
<comment-form>
	<form class='comment-form'>
		<input type="text" name="author" placeholder="Your name" />
		<textarea name="comment" placeholder="Say something..."></textarea>
		<button>Post</button>
	</form>
	<script>
	({
		events: {
			'form': {
				submit: function addComment(e) {
					e.preventDefault();
					Zino.trigger('add-comment', {
						author: this.author.value,
						comment: this.comment.value
					});
				}
			}
		}
	})
	</script>
</comment-form>
{% endhighlight %}

So what does this mean? Since we don't use other components, we simply use object syntax to define what the properties of our component are. With the events property we can register any kind of event for any part of our component. It won't register events to anything outside the component. So in this case, we select the form element, but any kind of CSS selector would work, there. For example, instead of `'form'`, we could also use `'.comment-form'` as the key in our object. All events declared in the events object are registered through event delegation for optimal performance.

Within the event's form object, we have defined the submit property, which is a function that handles the event, once it occurs. Within this function, we simply tell our store what the new comment's author and content are, the store will deal with the rest.

For our store to actually support this action, we need to extend it with the following code in `comment-store.js`:

{% highlight js %}
	...
	// when receiving the notification about an added comment
	Zino.on('add-comment', function(comment) {
		// add it to the list of comments
		comments.push(comment);

		// send comments to the server
		// ...

		// once done, trigger the comments-changed event to notify everyone
		Zino.trigger('comments-changed', comments);
	});
}());
{% endhighlight %}

Last but not least, we need to tell our `comment-box` where Zino can load our `comment-form` component from:

{% highlight js %}
...
(function() {
	Zino.import('comment.html');
	Zino.import('comment-form.html');

	return {
		...
{% endhighlight %}
