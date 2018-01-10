---
layout: page
title: Using JSX with Zino
---

Using Rollup
============

First you need to install all required packages:

{% highlight bash %}
$ npm i -D rollup glob rollup-plugin-buble
{% endhighlight %}

Then configure your Rollup build:

{% highlight js %}
/* rollup.config.js */
// you can also use Babel instead
import buble from 'rollup-plugin-buble';

// fetch all JSX files from your source directory
let config = glob.sync('src/**/*.jsx').map(file => ({
    input: file,
    output: {
        file: 'public/' + file.replace(/\.jsx$/, '.js'),
        format: 'iife',
        sourcemap: 'inline'
    },
    plugins: [
        buble({
            exclude: 'node_modules/**',
            // configure JSX parser
            jsx: 'this.createNode'
        })
    ]
}));

export default config;
{% endhighlight %}

Next, you can use it by creating your first Zino JSX component in src/:

{% highlight js %}
/* hello.jsx */
export default class Hello {
    render(data) {
        return (
            <div class="hello">
                Hello World!
            </div>
        );
    }
}
{% endhighlight %}

As you can see above, the render function which normally uses the `this.createNode()` function to generate the DOM structure of a component can now be written in JSX, making the code more readable and providing all of the niceties of JSX. As before, the `data` parameter of the render function provides access to the component's state and properties. The callbacks, state and event definitions can be added as additional methods / attributes to the class.

__Note:__ The callback can be defined as class methods, if they are prefixed with `on`, for example `onmount`, `onrender` etc... . Things like the state and events can be defined as getters of the class, providing a nice shell for complex values.

In order to compile it, simply run:

{% highlight bash %}
$ rollup -c
{% endhighlight %}

The output file will be generated into the public/ directory from which it can then be included into your page.

A more complex example using JSX would look like that:

{% highlight js %}
/* crud-list.jsx */
export default class CrudList {
    render(data) {
        return (
            <div class="container">
                <ul>
                    {data.props.list.map((entry => (
                        <li data-id="{entry.id}">
                            <span>{entry.name}</span>
                            <button type="button" class="delete">delete</button>
                        </li>
                    )).bind(this)).concat(data.props.isAdding ? (
                        <li>
                            <input name="name"/>
                            <button type="button" class="delete">delete</button>
                        </li>
                    ) : [])}
                </ul>
                <button type="button" class="add">{data.props.isAdding ? 'save' : 'new entry'}</button>
            </div>
        );
    }

    constructor() {
        let _this = this || {};
        _this.props = {
            list: [],
            isAdding: false
        };
    }

    get events() {
        return {
            '.add': {click() {
                let props = this.getHost().props;
                if (props.isAdding) {
                    // save entry
                    Zino.trigger('list-store:entry-added', {
                        id: props.list.length,
                        name: this.parentNode.querySelector('input[name="name"]').value
                    });
                }
            }},
            '.delete': {click() {
                let host = this.getHost();
                if (this.parentNode.dataset.id) {
                    let list = host.props.list.slice(0);
                    list.splice(this.parentNode.dataset.id, 1);
                    host.setProps('list', list);
                } else if (host.props.isAdding) {
                    // cancel add
                    host.setProps('isAdding', false);
                }
            }}
        };
    }

    onmount(z) {
        z.on('list-store:list-changed', data => {
            this.getHost().setProps('list', data);
        });
    }
}
{% endhighlight %}
