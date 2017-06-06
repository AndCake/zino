---
layout: page
title: Events
permalink: /events
---

Zino works through events that can be used to customize how Zino deals with browser-specific things. Listening for these kind of events works through the `Zino.on` / `Zino.off` / `Zino.one` functions. Triggering these events works through the `Zino.trigger` function. The following events are fired automatically by Zino:

#### `publish-script`

Parameter:

* script DOM node

This event is fired if an external script file has been encountered when parsing the scripts of the given tag.

In the browser environment, Zino has an existing handler that will add the script tag to the page's DOM.

#### `publish-style`

Parameter:

* link DOM node or css text

This event is fired if some CSS styling is encountered while parsing the given component. If the component contains an external LINK tag, this tag will be handed as is into the listening function. If it encounters inline style, it will provide the pure CSS text.

In the browser environment, Zino has an existing handler that will either create a STYLE tag from the CSS code and attach it to the page's HEAD tag or will directly add a provided LINK tag to the page's HEAD tag.

#### `--zino-mount-tag`

Parameter:

* DOM node

This event is fired whenever a new DOM node is added to the page. If the DOM node is a registered component (imported via `Zino.import()` or `LINK` tag), the component will be mounted and rendered.

#### `--zino-unmount-tag`

Parameter:

* DOM node

This event is fired whenever a DOM node is removed from the DOM that contains (or is) a component. The DOM node provided is always a component. All contained sub components will have their `unmount` callback executed and complex data associated with this component will be cleaned up.

#### `--zino-rerender-tag`

Parameter:

* DOM node

This event is fired whenever a tag needs to be re-rendered. The DOM node provided is the tag that requires re-rendering.

#### `--event-register`

Parameter:

* object `{name, fn}`

This event is fired whenever a new event listener is registered. The object provided is containing name of the event and function to be called if the event is triggered

#### `--event-trigger`

Parameter:

* object `{name, fn, data}`

This event is fired whenever an event is dispatched/triggered. The object provided contains the name of the event, the function called and the data transmitted to the function.

#### `--event-unregister`

Parameter:

* object `{name, fn}`

This event is fired whenever an event handler is unregistered. The object provided contains the name of the event, and if existent, the function that is unregistered. If the object contains no fn property, all functions have been unregistered.
