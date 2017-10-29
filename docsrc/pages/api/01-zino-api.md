---
layout: page
title: Zino API
---

When loading initially, in the browser context, Zino will look for a global variable called `zinoTagRegistry`. If this is defined, it expects it to be filled with a series of URL - data mappings that will be used to pre-fill the AJAX cache. Any requests using the cache for the registered URLs will automatically be answered without additional network traffic.

Zino exports a set of functions in order to interact with it. Those functions are available in the Zino scope.

#### import(url[, callback)

- url - URL to load the element from, if not loaded yet
- callback - callback function to call when the tag has been loaded (optional)

Imports a component from the provided URL so that it can be rendered whenever added to the DOM. It will automatically be mounted. If used inside a component, the url is relative to the current component's URL.

#### trigger(event[, data])
- event - name of the event to trigger
- data - data to send with the event (optional)

Triggers the given event.

*Example:*
{% highlight javascript %}
Zino.trigger('update-data', {id: 2, text: 'My changed data'});
{% endhighlight %}

#### on(event, callback)
- event - name of the event to listen for
- callback - callback function to call when the event is triggered

Listens for the given event and calls the callback for every occurrence.
Any data sent with the trigger will be directly given into the callback.

*Example:*

{% highlight javascript %}
Zino.on('update-data', function(data) {
	// do something with the data
});
{% endhighlight %}

#### one(event, callback)
- event - name of the event to listen for
- callback - callback function to call when the event is triggered

Listens for the given event and calls the callback only for the first
occurrence. Any data sent with the trigger will be directly given into
the callback.

#### off(event, callback)
- event - name of the event to listen for
- callback - function to remove as event listener

Removes the event listener for the given event.

#### fetch(url, callback[, cache[, code]])
- url - from where to fetch some content/data?
- callback(data, status) - function to call once response has been received
- cache - a boolean indicating whether or not to cache the result
- code - a string containing data to be cached

Do a very simple AJAX call (supports only GET). The response body will be handed
into the callback function as `data`. If the code property is transmitted, then the callback parameter can be left empty and not actual AJAX request will be triggered. This works similar to having the global `zinoTagRegistry` variable prefilled when loading Zino.

#### isBrowser()

Allows to check if the environment running is a browser (which will make it return `true`, else `false`).

#### isServer()

Allows to check if the environment running is a server (which will make it return `true`, else `false`).