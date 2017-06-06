---
layout: page
title: Templating
permalink: /templates
showInMenu: true
subpages:
  - 01:
    url: /templates#variables
    name: Variables
  - 02:
    url: /templates#sections--conditions--iterations
    name: Conditions/Iterations
  - 03:
    url: /templates#inverted-sections
    name: Inverted Sections
  - 05:
    url: /templates#section-keys
    name: Section Keys
  - 04:
    url: /templates#style-tag
    name: Style Tag
  - 05:
    url: /templates#transfer-tag
    name: Transfer Tag
---

Zino uses an extended version of the [Mustache templating language](https://mustache.github.io/mustache.5.html).

Mustache can be used for HTML, config files, source code - anything. It works by expanding tags in a template using values provided in a hash or object.

We call it "logic-less" because there are no if statements, else clauses, or for loops. Instead there are only tags. Some tags are replaced with a value, some nothing, and others a series of values. This document explains the different types of Mustache tags.

## Variables

A `{{'{{'}}name}}` tag in a basic template will try to find the `name` key in the current data. All variables are HTML escaped by default. If you want to return unescaped HTML, use the triple mustache: `{{'{{{'}}name}}}`.

Example template:
{% highlight mustache %}
* {{'{{'}}name}}
* {{'{{'}}age}}
* {{'{{'}}company}}
* {{'{{{'}}company}}}
* {{'{{'}}detail.rating}}
* {{'{{'}}detail.list.2}}
{% endhighlight %}

Example data:
{% highlight javascript %}
{
  "name": "Chris",
  "company": "<b>GitHub</b>",
  "detail": {
      rating: "Good!",
      list: ["Shoe", "Grazer", "Sky"]
  }
}
{% endhighlight %}

Resulting output:
{% highlight mustache %}
* Chris
*
* &lt;b&gt;GitHub&lt;/b&gt;
* <b>GitHub</b>
* Good!
* Sky
{% endhighlight %}

## Sections / Conditions / iterations

Sections render blocks of text one or more times, depending on the value of the key in the current context.

A section begins with a pound and ends with a slash. That is, `{{'{{'}}#person}}` begins a "person" section while `{{'{{'}}/person}}` ends it.

The behavior of the section is determined by the value of the key.

#### False Values or Empty Lists

If the person key exists and has a value of false or an empty list, the HTML between the pound and slash will not be displayed.

Template:
{% highlight mustache %}
Shown.
{{'{{'}}#person}}
  Never shown!
{{'{{'}}/person}}
{% endhighlight %}

Hash:
{% highlight javascript %}
{
  "person": false
}
{% endhighlight %}

Output:
{% highlight mustache %}
Shown.
{% endhighlight %}

#### Non-Empty Lists

If the person key exists and has a non-false value, the HTML between the pound and slash will be rendered and displayed one or more times.

When the value is a non-empty list, the text in the block will be displayed once for each item in the list. The context of the block will be set to the current item for each iteration. In this way we can loop over collections.

Template:
{% highlight mustache %}
{{'{{'}}#repo}}
  <b>{{'{{'}}name}}</b>
{{'{{'}}/repo}}
{% endhighlight %}

Hash:
{% highlight javascript %}
{
  "repo": [
    { "name": "resque" },
    { "name": "hub" },
    { "name": "rip" }
  ]
}
{% endhighlight %}

Output:
{% highlight mustache %}
<b>resque</b>
<b>hub</b>
<b>rip</b>
{% endhighlight %}

#### Lambdas

When the value is a callable object, such as a function or lambda, the object will be invoked and passed the block of text. The text passed is the literal block, unrendered. `{{'{{'}}tags}}` will not have been expanded - the lambda should do that on its own. In this way you can implement filters or caching.

Template:
{% highlight mustache %}
{{'{{'}}#wrapped}}
  {{'{{'}}name}} is awesome.
{{'{{'}}/wrapped}}
{% endhighlight %}

Hash:
{% highlight javascript %}
{
  "name": "Willy",
  "wrapped": function() {
    return function(text, render) {
      return "<b>" + render(text) + "</b>"
    }
  }
}
{% endhighlight %}

Output:
{% highlight mustache %}
<b>Willy is awesome.</b>
{% endhighlight %}

#### Non-False Values

When the value is non-false but not a list, it will be used as the context for a single rendering of the block.

Template:
{% highlight mustache %}
{{'{{'}}#person?}}
  Hi {{'{{'}}name}}!
{{'{{'}}/person?}}
{% endhighlight %}

Hash:
{% highlight javascript %}
{
  "person?": { "name": "Jon" }
}
{% endhighlight %}

Output:
{% highlight mustache %}
Hi Jon!
{% endhighlight %}

## Inverted Sections

An inverted section begins with a caret (hat) and ends with a slash. That is `{{'{{'}}^person}}` begins a "person" inverted section while `{{'{{'}}/person}}` ends it.

While sections can be used to render text one or more times based on the value of the key, inverted sections may render text once based on the inverse value of the key. That is, they will be rendered if the key doesn't exist, is false, or is an empty list.

Template:
{% highlight mustache %}
{{'{{'}}#repo}}
  <b>{{'{{'}}name}}</b>
{{'{{'}}/repo}}
{{'{{'}}^repo}}
  No repos :(
{{'{{'}}/repo}}
{% endhighlight %}

Hash:
{% highlight javascript %}
{
  "repo": []
}
{% endhighlight %}

Output:
{% highlight mustache %}
No repos :(
{% endhighlight %}

## Section keys

When rendering mustache sections, additional attributes are provided to access the relevant data. Those are:

 - `.index` - contains the index of the current entry in the array for this block (starts with 0)
 - `.` - contains the current entry itself in the array for this block
 - `.length` - contains the amount of entries in the array for this block

Template:
{% highlight mustache %}
<ul>
{{'{{'}}#props.list}}
    <li data-position="{{'{{'}}.index}} of {{'{{'}}.length}}">{{'{{'}}.}}</li>
{{'{{'}}/props.list}}
</ul>
{% endhighlight %}

Hash:
{% highlight javascript %}
{
    props: {
        list: ['test', 'value', 12, false]
    }
}
{% endhighlight %}

Output:
{% highlight html %}
<ul>
    <li data-position="0 of 4">test</li>
    <li data-position="1 of 4">value</li>
    <li data-position="2 of 4">12</li>
    <li data-position="3 of 4">false</li>
</ul>
{% endhighlight %}

## Style Tag

A style tag starts with a %, like in `{{'{{'}}%mystyle}}`. It can take multiple keys that are separated by a comma such as `{{'{{'}}%style1, style2, style3}}`. The style tag instructs the template engine to interpret the data values for the provided key list as CSS properties and render them as such.

This is best used inside a style attribute of an HTML tag. By providing multiple objects, the result is merged from
left to right in order to determine the resulting properties that actually apply.

A value can be an object or a function that evaluate to a JS object containing CSS properties and their values.

 * If it's a string, it will be taken as is.
 * If it's a number, it will be appended with the default unit (except if the number is 0). The default unit can be configured in the styles object by defining a property called `defaultUnit`.
 * If it's a function, it will be called in order to determine it's value. Every function call is bound to the data that is available inside the code fragment, so that it is available via the keyword `this`.

Template:
{% highlight mustache %}
<div style="{{'{{'}}%styles.reset, styles.baseStyle, styles.border}}">
    Test content
</div>
{% endhighlight %}

Hash:
{% highlight javascript %}
{
    styles: {
        defaultUnit: 'em',
        reset: {
           margin: 0,
           border: '0 solid black'
        },
        baseStyle: {
           fontSize: 2,
           color: function() {
              return Math.random() > 0.5 ? 'red' : 'blue';
           }
        },
        border: function() {
           return {
               borderSize: Math.floor(Math.random() * 10),
               borderColor: '#aaa'
           };
        }
}
{% endhighlight %}

Output:
{% highlight mustache %}
<div style="margin: 0; border: 0 solid black; font-size: 2em; color: red; border-size: 6em; border-color: green;">
    Test content
</div>
{% endhighlight %}

## Transfer Tag

A transfer tag starts with a +, as in `{{'{{'}}+myObj}}`. The data value provided by the given key will be kept as is and not transformed into a string nor anything else. That way it is possible to transfer data between components. When rendering it, a UUID will be generated for the object to uniquely identify it. That information is used by Zino in order to map the UUID back to it's original data structure in order to access it's properties at a later point in time (e.g. in an inner component). It should always be used in conjunction with the data attribute. The data attribute's name is then directly used a a prop with the provided data.

Template:
{% highlight mustache %}
<my-sub-component data-entry="{{'{{'}}+props.entryData}}"></my-sub-component>
{% endhighlight %}

Hash:
{% highlight javascript %}
{
    props: {
        entryData: {
            callback: function() { ... },
            nums: 'Test value',
            isValid: false
        }
    }
}
{% endhighlight %}

Output:
{% highlight mustache %}
<my-sub-component data-entry="--c30e6a46-562f-4cf0-6054-fcd78045a9be--"></my-sub-component>
{% endhighlight %}

In my-sub-component the value `props.entry` will then contain the data from the parent component's `props.entryData`
