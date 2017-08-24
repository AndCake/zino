---
layout: page
title: Component Best-practices
---

Zino is all about components, which have two primary methods for receiving, handling, and displaying data: attributes
and props. Understanding the difference between these two is critical to effectively use Zino for development.

## Attributes

Attributes are values that are passed into a component from the outside, for example via setAttribute() or other means.
In the following example, the attributes `name` and `price` are handed in:

	{% highlight html %}
	<product name="Handbag" price="12.99"/>
	{% endhighlight %}

Attributes are simple in nature. They cannot contain complex data like arrays, objects or functions instead they are
used to hold direct values.

## Props

In order to represent the internal state of a component, the props are used. Props often change during a component's
lifetime. The are usually updated by using the component's `setProps` method. Props can be complex objects that also
include functions, objects and arrays. Please note: whenever you call `setProps`, the component will re-render itself.
If the change is just a minor one, then only the resulting diff DOM will be applied to the browser's DOM.

Although props are used to represent the internal state of a component, you can define their initial value from
the outside by transferring complex objects from your parent component like this:

	{% highlight mustache %}
	<product data-details="{{'{{'}}+props.currentProduct}}"/>
	{% endhighlight %}

Please note, that in order to pass props as initial state to a sub component, you need to define a data attribute, whose
name will be used for the props' name. In the above example, `currentProduct` is read from the parent component's state
and passed into the sub component 'product' as a prop called 'details'.

## When to use attributes vs. props

Attributes should be used to transfer simple information to a component (not necessarily to a sub component!). It should
also be used for simple information that can change in the parent component.

Props should be used only for the internal state of a component and to define this internal state initially, when
rendering it into a parent component. When you use a store to load information from the server, you should use the props
in order to store (and maybe transform) the data for display.

## Dumb Components

Dumb components are the most reusable components available, because they have a know-nothing approach to the application
in which they are used. Think of simple HTML DOM elements: an anchor tag knows nothing about the app using it and relies
on the app passing attributes like `href`, `title`, and `target`. This is an example of a dumb component.

Dumb components are incredibly reusable because they are not specific to any one use case or application.

### Example

An example of a dumb component would be the Avatar component shown below:

	{% highlight mustache %}
	<avatar>
		<img src="{{'{{'}}src}}" class="{{'{{'}}props.circle}} {{'{{'}}props.rounded}}" title="{{'{{'}}title}}" alt="{{'{{'}}title}}"/>

		<script>
		{
			props: {
				circle: false,
				rounded: false
			},

			mount: function() {
				// using setProps not required here, since the component will render after mount anyway!
				this.props.circle = this.props.circle ? 'circle' : '';
				this.props.rounded = this.props.rounded ? 'rounded' : '';
			}
		}
		</script>
		<link rel="stylesheet" href="./style.css"/>
	</avatar>
	{% endhighlight %}

The avatar has no awareness of the state of the external application and does not connect to any stores to retrieve data
to / from. It is passed the exact data it needs in order to render.

Whenever possible, try to use dumb components in order to reduce the complexity of your components, which makes them
easier to understand, maintain and allows for better reusability. If your component doesn't know anything about the
application, fewer parts of your code are adversely affected if you break app-level code.

## Smart components

The distinction key deciding factor between **smart** and **dumb** components is whether they need to access _external_ state.

Smart components are less reusable outside a single application or set of applications because they are aware of
application-level state.

For instance, Smart components may listen for store actions in order to directly integrate with business logic and
react to data or state changes. Whenever possible, you should favor creating dumb components and reduce the surface
area of components which bind to application logic.

### Rule of thumb: use sparingly

If you notice that you are creating many smart components, think carefully why the state of the component should not be
managed at a higher level. Often things that feel like they should bind to application state are better expressed as dumb
components included in a higher-level smart component.

### Example

As an example, you may have a page (/cart) to allow a user to purchase the contents of their shopping cart. On that page,
you will likely have some components to display the items in the cart, calculate sales tax and shipping, and show
"other people also bought" recommendations.

Initially, it may seem like the shopping cart component should connect to a shopping-cart-store to retrieve the list of
items and render them each and include a button on each row to call shopping-cart:changeQuantity or shopping-cart:removeFromCart.

If you took this approach, you'd have business logic in your shopping-cart component, and you'd insert it into the
Cart page like this:

	{% highlight html %}
	<cart>
		<!-- ... snip ... -->
		<div>
			<h1>Your cart</h1>
			<shopping-cart/>
			<shipping-info/>
			<checkout-button/>
		</div>
		<!-- ... snip ... -->
	</cart>
	{% endhighlight %}

This may feel very clean at the top, but pushes too much duplicate logic down into the child components. In this case,
all three of the Smart components shown will need to be aware of application state and all will update application state
directly via store actions.

Instead, in Zino, you should instead create the shopping-cart component as a dumb component, and pass the cart as props.
You should also pass down a callback for the actions you want to take, so that you can mutate application state centrally
on the cart page component.

Consider instead the following approach:

	{% highlight mustache %}
	<cart>
		<!-- ... snip ... -->
		<div>
			<h1>Your cart</h1>
			<shopping-cart data-cart="{{'{{'}}+props.cart}}" data-on-remove="{{'{{'}}+props.removeCartItem}}" data-on-change="{{'{{'}}+props.changeCartItemQuantity}}" />
			<shipping-info data-cart="{{'{{'}}+props.cart}}" data-address="{{'{{'}}+props.userShippingAddress}}"/>
			<checkout-button data-on-buy="{{'{{'}}+props.cartPurchase}}"/>
		</div>
		<!-- ... snip ... -->
	</cart>
	{% endhighlight %}

If you find yourself referencing components without any attributes or props like in the wrong example above, this should
be considered a code smell and you should make extra sure that using smart components in that case is the right approach.

## Pages

While pages are technically Smart Components themselves, we make a distinction between the two concepts in the context
of a Zino app to ensure simple structure and organization.

Pages are generally addressable via a URL and may read one or more parameters from the url or the query string. Pages
are roughly similar to actions in a MVC controller application and you may have pages like account-show or account-overview
in an application.

It is the responsibility of the page to bind to changes in the stores which are relevant to the page or its children.
Pages will also be generally responsible for calling store actions to make changes to data when children components
request it.

### Parent-child relationships

A common pattern is to pass a function on the Page into a component as a prop to enable the child component to make the
callback when an action is taken in the interface. For clean separability, it is important that parent components (or
pages, in this case) are unaware of the DOM structure generated by any children. Likewise, children components should
not have knowledge of where their data comes from or how to persist it to a server, etc.

### Changing between pages

When you want to have multiple pages that a user can navigate to and from, it can help to have a router store that can
modify the browser's history via the History API and load the requested page components, transferring any required
state to those components, if necessary.

## Dumb vs. Smart vs. Pages

### Dumb Components

 * DO bind to DOM events
 * CAN fetch data from the DOM and pass it up to parent callbacks.
 * DO NOT use state for data (UI behaviours only)
 * DO NOT know about stores
 * DO NOT know about url routes or what page they are on

### Smart Components

 * DO have data in state
 * DO bind to changes in stores
 * DO call store actions to make changes to data
 * DO pass data to children components as props or attributes

### Pages

Same as Smart Components rules, plus:

 * DO know about url routes
 * DO NOT know about the generated DOM in child components

Facebook has [some good tipps](https://facebook.github.io/react/docs/thinking-in-react.html#step-4-identify-where-your-state-should-live) on how to identify where the state of a component should live.
