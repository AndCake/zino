var Zino = (function () {
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

/**
 * Merges all objects provided as parameters into the first parameter object
 *
 * @param  {...Object} args list of arguments
 * @return {Object}         the merged object (same as first argument)
 */
function merge(target) {
	for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
		args[_key - 1] = arguments[_key];
	}

	args.forEach(function (arg) {
		for (var all in arg) {
			if (typeof HTMLElement !== 'undefined' && arg instanceof HTMLElement || typeof propDetails(arg, all).value !== 'undefined' && (!target[all] || propDetails(target, all).writable)) {
				if (all !== 'attributes') target[all] = arg[all];
			}
		}
	});

	return target;
}

function propDetails(obj, attribute) {
	return isObj(obj) && Object.getOwnPropertyDescriptor(obj, attribute) || {};
}

/**
 * Creates a diff of two JS objects. Includes attribute position check.
 *
 * @param  {Object} objA	the object to be compared
 * @param  {Object} objB 	the object to compare with
 * @return {Object,Boolean} false if both objects are deep equal, else the values of what is different
 */




/**
 * Checks if the given arguments are the provided types, if they do no match, an exception is thrown.
 *
 * @param  {Array} args 	list of arguments provided to callee
 * @param  {Array} types 	list of data types expected for the provided arguments
 * @param  {String} api  	name of the API (callee name)
 */


/**
 * makes sure that accessing attributes on an unknown data value is safe
 *
 * @param  {Mixed} obj 	data to made safe for attribute access
 * @return {Object}     will always return an object
 */


function uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = Math.random() * 16 | 0;
		return (c == 'x' ? r : r & 0x3 | 0x8).toString(16);
	});
}
var isObj = function isObj(obj) {
	return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object';
};
var isFn = function isFn(fn) {
	return typeof fn === 'function';
};
var emptyFunc = function emptyFunc() {};

var eventQueue = {};

function publishEvent(type, data) {
	data.name.indexOf('--event-') && trigger('--event-' + type, data);
}

function trigger(name, data) {
	if (!eventQueue[name]) return;
	for (var index in eventQueue[name]) {
		publishEvent('trigger', { name: name, fn: eventQueue[name][index], data: data });
		var result = eventQueue[name][index](data);
		if (result === false) break;
	}
}

function on(name, fn) {
	if (!eventQueue[name]) {
		eventQueue[name] = [];
	}
	eventQueue[name].push(fn);
	publishEvent('register', { name: name, fn: fn });
}

function off(name, fn) {
	if (!isFn(fn)) {
		delete eventQueue[name];
		return publishEvent('unregister', { name: name });
	}
	for (var index in eventQueue[name]) {
		if (eventQueue[name][index] === fn) {
			delete eventQueue[name][index];
			return publishEvent('unregister', { name: name, fn: fn });
		}
	}
}

function one(name, fn) {
	on(name, function self() {
		fn.apply(this, arguments);
		off(name, self);
	});
}

function attachEvent(el, events, host) {
	if (!isFn(el.addEventListener)) return;
	var findEl = function findEl(selector, target) {
		var node = [].slice.call(el.querySelectorAll(selector));
		while (node.length > 0 && target !== host) {
			if (node.indexOf(target) >= 0) return node[node.indexOf(target)];
			target = target.parentNode;
		}
		return false;
	};
	events.forEach(function (eventObj) {
		Object.keys(eventObj.handlers).forEach(function (event) {
			el.addEventListener(event, function (e) {
				var target = void 0;
				if (eventObj.selector === ':host' || (target = findEl(eventObj.selector, e.target))) {
					target && (target.getHost = function () {
						return host.getHost();
					});
					eventObj.handlers[event].call(target || host, e);
				}
			}, false);
		});
	});
}

var tagFilter = [];
var tagsCreated = [];
var dataResolver = function dataResolver(attr, value) {
	return attr;
};

function isArray(obj) {
	return Object.prototype.toString.call(obj) === '[object Array]';
}

function setDataResolver(resolver) {
	dataResolver = resolver;
}

function Tag(tagName, attributes, children) {
	tagName = tagName.toLowerCase();
	attributes = attributes || {};
	Object.keys(attributes).forEach(function (attr) {
		attributes[attr] = { name: attr, value: attributes[attr] };
	});
	children = children && ((typeof children === 'undefined' ? 'undefined' : _typeof(children)) !== 'object' || children.tagName) ? [children] : children || [];
	var tag = {
		tagName: tagName,
		attributes: attributes,
		children: children,
		__complexity: children.reduce(function (a, b) {
			return a + (b.__complexity || 1);
		}, 0) + children.length
	};
	if (tagFilter.indexOf(tagName) >= 0) tagsCreated.push(tag);
	return tag;
}

/**
 * Returns all tags with a given tag name. If the provided context contains a getElementsByTagName() function,
 * that will be used to retrieve the data, else a manual recursive lookup will be done
 *
 * @param  {String} name - name of the tag to retrieve the elements  of
 * @param  {Object} dom - either a VDOM node or a DOM node
 * @return {Array} - list of elements that match the provided tag name
 */
function getElementsByTagName(name, dom) {
	var result = [];
	name = (name || '').toLowerCase();
	if (typeof dom.getElementsByTagName === 'function') return [].slice.call(dom.getElementsByTagName(name));

	if (dom.children) {
		result = result.concat(dom.children.filter(function (child) {
			return child.tagName && child.tagName.toLowerCase() === name;
		}));
		dom.children.forEach(function (child) {
			result = result.concat(getElementsByTagName(name, child));
		});
	}
	return result;
}

/**
 * defines which VDOM nodes should be captured for getTagsCreated()
 * @param {Array} filter - an array of strings representing the tag names of the tags to be captured
 */
function setFilter(filter) {
	tagFilter = filter;
}

/**
 * retrieves the list of tags that have been created since the last call of getTagsCreated()
 * @return {Array} - an array of VDOM nodes that were created
 */
function clearTagsCreated() {
	tagsCreated = [];
}

/**
 * retrieves the list of tags that have been created since the last call of getTagsCreated()
 * @return {Array} - an array of VDOM nodes that were created
 */
function getTagsCreated() {
	var created = tagsCreated;
	return created;
}

/**
 * Calculates the HTML structure as a String represented by the VDOM
 *
 * @param  {Object} node - the VDOM node whose inner HTML to generate
 * @return {String} - the HTML structure representing the VDOM
 */
function getInnerHTML(node) {
	if (!node.children) return '';
	if (!isArray(node.children)) node.children = [node.children];

	return (isArray(node) && node || node.children).map(function (child) {
		if ((typeof child === 'undefined' ? 'undefined' : _typeof(child)) !== 'object') {
			return '' + child;
		} else if (isArray(child)) {
			return getInnerHTML(child);
		} else {
			var attributes = [''].concat(Object.keys(child.attributes).map(function (attr) {
				if (_typeof(child.attributes[attr].value) === 'object') {
					return attr + '="--' + dataResolver(attr, child.attributes[attr].value) + '--"';
				} else {
					return attr + '="' + child.attributes[attr].value + '"';
				}
			}));
			return '<' + child.tagName + attributes.join(' ') + '>' + getInnerHTML(child) + '</' + child.tagName + '>';
		}
	}).join('');
}

/**
 * Creates a new DOM node
 *
 * @param  {Object|String} node - a VDOM node
 * @param  {Document} document - the document in which to create the DOM node
 * @return {Node} - the DOM node created (either a text element or an HTML element)
 */
function createElement(node, document) {
	var tag = void 0;
	if ((typeof node === 'undefined' ? 'undefined' : _typeof(node)) !== 'object') {
		// we have a text node, so create one
		tag = document.createTextNode('' + node);
	} else {
		tag = document.createElement(node.tagName);
		// add all required attributes
		Object.keys(node.attributes).forEach(function (attr) {
			tag.setAttribute(attr, node.attributes[attr].value);
		});
		if (node.__vdom) {
			// it's a component, so don't forget to initialize this new instance
			trigger('--zino-initialize-node', { tag: tag, node: node.functions });
		}
		// define it's inner structure
		tag.innerHTML = getInnerHTML(node);
	}

	return tag;
}

function applyText(domChild, dom, node, document) {
	// simply apply the value
	if (node.match(/<[\w:_-]+[^>]*>/)) {
		if (dom.childNodes.length === 1) {
			dom.innerHTML = node;
		} else {
			var html = document.createElement('span');
			html.innerHTML = node;
			dom.replaceChild(html, domChild);
		}
	} else {
		// it's just a text node, so simply replace the element with the text node
		dom.replaceChild(createElement(node.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'), document), domChild);
	}
}

/**
 * Applies a VDOM to an actual DOM, meaning that the state of the VDOM will be recreated on the DOM.
 * The end result is, that the DOM structure is the same as the VDOM structure. Existing elements will
 * be repurposed, new elements created where necessary.
 *
 * @param  {DOM} dom - the DOM to which the VDOM should be applied
 * @param  {Object} vdom - the VDOM to apply to the DOM
 * @param  {Document} document - the document that the DOM is based on, used for createElement() and createTextNode() calls
 */
function applyDOM(dom, vdom, document) {
	if (!isArray(vdom)) {
		// if we have a node
		if (!isArray(vdom.children)) vdom.children = [vdom.children];
		// if the tag name is not the same
		if (vdom.tagName !== dom.tagName.toLowerCase()) {
			// replace the node entirely
			dom.parentNode.replaceChild(createElement(vdom, document), dom);
		} else {
			// check all vdom attributes
			Object.keys(vdom.attributes).forEach(function (attr) {
				// if the VDOM attribute is a non-object
				if (_typeof(vdom.attributes[attr].value) !== 'object') {
					// check if it differs
					if (dom.getAttribute(attr) != vdom.attributes[attr].value) {
						// if so, apply it
						dom.setAttribute(attr, vdom.attributes[attr].value);
					}
				} else {
					// the attribute is an object
					if (dom.getAttribute(attr) && dom.getAttribute(attr).match(/^--|--$/g)) {
						// if it has a complex value, use the data resolver to define it on the DOM
						var id = dataResolver(attr, vdom.attributes[attr].value, dom.getAttribute(attr).replace(/^--|--$/g, ''));
						// only set the ID with markers so that we know it is supposed to be a complex value
						dom.setAttribute(attr, '--' + id + '--');
					}
				}
			});
			// if we have too many attributes in our DOM
			if (dom.attributes.length > Object.keys(vdom.attributes)) {
				[].forEach.call(dom.attributes, function (attr) {
					// if the respective attribute does not exist on the VDOM
					if (typeof vdom.attributes[attr.name] === 'undefined') {
						// remove it
						dom.removeAttribute(attr.name);
					}
				});
			}
		}
	}

	// deal with the vdom's children
	var children = isArray(vdom) ? vdom : vdom.children;
	children.forEach(function (node, index) {
		if (isArray(node)) return applyDOM(dom, node, document);
		var domChild = dom.childNodes[index];
		if (typeof domChild === 'undefined') {
			// does not exist, so it needs to be appended
			dom.appendChild(createElement(node, document));
		} else if (domChild.nodeType === 3) {
			// is a text node
			// if the VDOM node is also a text node
			if (typeof node === 'string' && domChild.nodeValue !== node) {
				applyText(domChild, dom, node, document);
			} else if (typeof node !== 'string') {
				// else replace with a new element
				dom.replaceChild(createElement(node, document), domChild);
			}
		} else if (domChild.nodeType === 1) {
			// is a normal HTML tag
			if ((typeof node === 'undefined' ? 'undefined' : _typeof(node)) === 'object') {
				// the VDOM is also a tag, apply it recursively
				applyDOM(domChild, node, document);
			} else {
				applyText(domChild, dom, node, document);
			}
		}
	});
	if (dom.childNodes.length > children.length) {
		// remove superfluous child nodes
		[].slice.call(dom.childNodes, children.length).forEach(function (child) {
			return dom.removeChild(child);
		});
	}
}

var renderOptions = {
	resolveData: function resolveData(key, value, oldID) {
		var id = uuid();
		if (oldID) {
			// unregister old entry
			delete dataRegistry[oldID];
		}
		dataRegistry[id] = value;
		return id;
	}
};

var tagRegistry = {};
var dataRegistry = {};
var defaultFunctions = {
	'props': {},
	'mount': emptyFunc,
	'unmount': emptyFunc,
	'render': emptyFunc,

	getHost: function getHost() {
		return this;
	},
	setProps: function setProps(name, value) {
		var tag = this.getHost();
		if (isObj(name)) {
			merge(tag.props, name);
		} else {
			tag.props[name] = value;
			var attrName = 'data-' + name.replace(/[A-Z]/g, function (g) {
				return '-' + g.toLowerCase();
			});
			if (tag.attributes[attrName]) {
				defineAttribute(tag, attrName, '--' + renderOptions.resolveData(name, value, tag.attributes[attrName].value) + '--');
			}
		}
		!tag.mounting && trigger('--zino-rerender-tag', tag);
	}
};

function registerTag(fn, document, Zino) {
	var firstElement = fn(Tag, Zino),
	    tagName = firstElement.tagName;

	if (tagRegistry[tagName]) {
		// tag is already registered
		return;
	}

	handleStyles(firstElement);
	firstElement.functions = merge({}, defaultFunctions, firstElement.functions);
	tagRegistry[tagName] = firstElement;

	// initialize all occurences in provided context
	document && [].slice.call(getElementsByTagName(tagName, document)).forEach(function (tag) {
		return initializeTag(tag, tagRegistry[tagName]);
	});
}

function mount(tag, ignoreRender) {
	if (!tag.tagName) return;
	var entry = tagRegistry[tag.tagName.toLowerCase()];
	if (!entry || tag.getAttribute('__ready')) return;
	if (ignoreRender) entry.functions.render = emptyFunc;
	return initializeTag.call(ignoreRender ? { noEvents: true } : this, tag, entry);
}

function render(tag) {
	var subEvents = renderTag(tag);
	attachSubEvents(subEvents, tag);
}



function initializeTag(tag, registryEntry) {
	// check if the tag has been initialized already
	if (tag.__vdom || !registryEntry) return;
	var functions = registryEntry.functions;

	// if it has been pre-rendered
	if (tag.children.length > 0 && tag.children[0].attributes && tag.children[0].attributes['class'] && tag.children[0].attributes['class'].value === '-shadow-root') {
		var sibling = tag.children[1];
		// remove original HTML content
		if (sibling && sibling.className === '-original-root') {
			tag.__i = sibling.innerHTML;
			setElementAttr(sibling, tag);
			sibling.parentNode.removeChild(sibling);
		}
		tag.isRendered = true;
	} else {
		tag.__i = tag.ownerDocument ? tag.innerHTML : getInnerHTML(tag);
		setElementAttr(tag);
		tag.innerHTML = '<div class="-shadow-root"></div>';
		tag.isRendered = false;
	}
	trigger('--zino-initialize-node', { tag: tag, node: functions });
	tag.__vdom = {};

	// render the tag's content
	var subEvents = !tag.isRendered && renderTag.call(this, tag) || { events: [] };

	// attach events
	var hostEvents = [],
	    events = functions.events || [],
	    childEvents = Object.keys(events).filter(function (all) {
		var isNotSelf = all !== ':host' && all !== tag.tagName;
		if (!isNotSelf) hostEvents.push({ handlers: events[all], selector: all });
		return isNotSelf;
	}).map(function (e) {
		return { selector: e, handlers: events[e] };
	});

	subEvents.events = subEvents.events.concat({ childEvents: childEvents, hostEvents: hostEvents, tag: this && this.noEvents ? tag.tagName : tag });

	if (!tag.attributes.__ready) {
		defineAttribute(tag, '__ready', true);
	}
	if (!this || this.noEvents !== true) {
		// attach sub events
		attachSubEvents(subEvents, tag);
	} else {
		return subEvents;
	}
}

function defineAttribute(tag, name, value) {
	// if __s is already defined (which means the component has been mounted already) 
	if (isFn(tag.__s)) {
		// if it's the same as setAttribute 
		if (tag.__s === tag.setAttribute) {
			// we might have a double override => use the original HTMLElement's setAttribute instead to avoid endless recursion 
			HTMLElement.prototype.setAttribute.call(tag, name, value);
		} else {
			// we now know it's the original setAttribute (also works for vdom nodes) 
			tag.__s(name, value);
		}
	} else {
		// if the element is not a mounted component 
		// but it is a regular HTML element 
		if (tag.ownerDocument) {
			// use the HTMLElement's setAttribute to define the attribute 
			HTMLElement.prototype.setAttribute.call(tag, name, value);
		} else {
			// we now know it can only be a vdom node, so set attribute vdom-style 
			tag.attributes[name] = { name: name, value: value };
		}
	}
}

function initializeNode(_ref) {
	var tag = _ref.tag,
	    _ref$node = _ref.node,
	    functions = _ref$node === undefined ? defaultFunctions : _ref$node;

	// copy all defined functions/attributes
	for (var all in functions) {
		var entry = functions[all];
		if (['mount', 'unmount', 'events', 'render'].indexOf(all) < 0) {
			if (isFn(entry)) {
				tag[all] = entry.bind(tag);
			} else {
				tag[all] = isObj(tag[all]) ? merge({}, entry, tag[all]) : entry;
			}
		}
	}
	// define basic properties
	var desc = Object.getOwnPropertyDescriptor(tag, 'body');
	if (!desc || typeof desc.get === 'undefined') {
		Object.defineProperty(tag, 'body', {
			set: function set(val) {
				tag.__i = val;
				setElementAttr(tag);
				trigger('--zino-rerender-tag', tag.getHost());
			},
			get: function get() {
				return tag.__i;
			}
		});
	}
	tag.__s = tag.setAttribute;
	tag.setAttribute = function (attr, val) {
		defineAttribute(this, attr, val);
		trigger('--zino-rerender-tag', this);
	};

	// call mount callback
	tag.props = merge({}, functions.props, getAttributes(tag, true));
	tag.attrs = getAttributes(tag);

	try {
		tag.mounting = true;
		functions.mount.call(tag);
		delete tag.mounting;
	} catch (e) {
		throw new Error('Unable to call mount function for ' + tag.tagName + ': ' + (e.message || e));
	}
}

function renderTag(tag) {
	var registryEntry = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : tagRegistry[tag.tagName.toLowerCase()];

	var events = [],
	    renderCallbacks = [],
	    renderedSubElements = [],
	    renderedDOM = void 0;

	// do the actual rendering of the component
	setDataResolver(renderOptions.resolveData);
	clearTagsCreated();
	var data = getAttributes(tag);
	if (isFn(registryEntry.render)) {
		// tell the vdom which tags to remember to look for
		setFilter(Object.keys(tagRegistry));
		renderedDOM = Tag('div', { 'class': '-shadow-root' }, registryEntry.render.call(tag, data));
	} else {
		throw new Error('No render function provided in component ' + tag.tagName);
	}

	// unmount previously rendered sub components
	tag.__subs && tag.__subs.forEach(unmountTag);

	// render all contained sub components
	// retrieve the tags that the vdom was made aware of (all our registered components)
	renderedSubElements = getTagsCreated();
	for (var idx = 0, len = renderedSubElements.length; idx < len; idx += 1) {
		var subEl = renderedSubElements[idx];

		// initialize them all
		var subElEvents = initializeTag.call({
			noRenderCallback: true,
			noEvents: true
		}, subEl, tagRegistry[subEl.tagName]);
		if (subElEvents) {
			renderedSubElements.splice.apply(renderedSubElements, [idx + 1, 0].concat(subElEvents.subElements));
			idx += subElEvents.subElements.length;
			len += subElEvents.subElements.length;
			events = events.concat(subElEvents.events);
			renderCallbacks = renderCallbacks.concat(subElEvents.renderCallbacks);
		}
	}

	if (tag.attributes.__ready && Math.abs(renderedDOM.__complexity - (tag.__complexity || 0)) < 50 && tag.ownerDocument) {
		// has been rendered before, so just apply diff
		applyDOM(tag.children[0], renderedDOM, tag.ownerDocument);
	} else {
		// simply render everything inside
		if (tag.ownerDocument) {
			tag.children[0].innerHTML = getInnerHTML(renderedDOM);
		} else {
			tag.children[0] = renderedDOM;
		}
	}
	tag.__subs = renderedSubElements;
	tag.__vdom = renderedDOM;
	tag.__complexity = renderedDOM.__complexity;

	// if we have rendered any sub components, retrieve their actual DOM node
	renderedSubElements.length > 0 && (tag.querySelectorAll && [].slice.call(tag.querySelectorAll('[__ready]')) || []).forEach(function (subEl, index) {
		// apply all additional functionality to them (custom functions, attributes, etc...)
		merge(subEl, renderedSubElements[index]);
		// update getHost to return the DOM node instead of the vdom node
		subEl.getHost = renderedSubElements[index].getHost = defaultFunctions.getHost.bind(subEl);
	});
	tag.isRendered = true;

	// if this is not a sub component's rendering run
	if (!this || !this.noRenderCallback) {
		// call all of our sub component's render functions
		renderCallbacks.forEach(function (callback) {
			return callback.fn.call(callback.tag.getHost());
		});
		// call our own rendering function
		registryEntry.functions.render.call(tag);
	} else {
		// just add this sub component's rendering function to the list
		renderCallbacks.push({ fn: registryEntry.functions.render, tag: tag });
	}
	return { events: events, renderCallbacks: renderCallbacks, data: data, subElements: renderedSubElements };
}

function attachSubEvents(subEvents, tag) {
	var count = {};
	subEvents.events.forEach(function (event) {
		var el = event.tag;
		if (!isObj(el)) {
			count[el] = (count[el] || 0) + 1;
			el = tag.querySelectorAll(el)[count[el] - 1];
		}
		if (!el.children[0].__eventsAttached) {
			attachEvent(el.children[0], event.childEvents, el);
			attachEvent(el, event.hostEvents, el);
			el.children[0].__eventsAttached = true;
		}
		isFn(el.onready) && el.onready.call(el);
	});
}

function unmountTag(tag) {
	var name = (tag.tagName || '').toLowerCase(),
	    entry = tagRegistry[name];
	if (entry) {
		[].forEach.call(tag.nodeType === 1 && tag.attributes || Object.keys(tag.attributes).map(function (attr) {
			return tag.attributes[attr];
		}), function (attr) {
			// cleanup saved data
			if (attr.name.indexOf('data-') >= 0) {
				delete dataRegistry[attr.value];
			}
		});
		try {
			entry.functions.unmount.call(tag);
		} catch (e) {
			throw new Error('Unable to unmount tag ' + name + ': ' + (e.message || e));
		}
	}
}

function getAttributes(tag, propsOnly) {
	var attrs = { props: tag.props, element: tag.element, styles: tag.styles, body: tag.__i },
	    props = attrs.props;

	[].forEach.call(tag.nodeType === 1 && tag.attributes || Object.keys(tag.attributes).map(function (attr) {
		return tag.attributes[attr];
	}), function (attribute) {
		var isComplex = attribute.name.indexOf('data-') >= 0 && typeof attribute.value === 'string' && attribute.value.substr(0, 2) === '--';
		var value = attribute.value;
		attrs[attribute.name] || (attrs[attribute.name] = isComplex && typeof value === 'string' && dataRegistry[value.replace(/^--|--$/g, '')] || value);
		if (attribute.name.indexOf('data-') === 0) {
			props[attribute.name.replace(/^data-/g, '').replace(/(\w)-(\w)/g, function (g, m1, m2) {
				return m1 + m2.toUpperCase();
			})] = attrs[attribute.name];
		}
	});

	if (propsOnly) return props;
	return attrs;
}

function setElementAttr(source) {
	var target = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : source;

	var baseAttrs = {};
	[].forEach.call(source.children, function (el) {
		if (!el.tagName) return;
		var name = el.tagName.toLowerCase();
		if (baseAttrs[name]) {
			if (!baseAttrs[name].isArray) {
				baseAttrs[name] = [baseAttrs[name]];
				baseAttrs[name].isArray = true;
			}
			baseAttrs[name].push(el);
		} else {
			baseAttrs[name] = el;
		}
	});
	target.element = baseAttrs;
}

function handleStyles(element) {
	var tagName = element.tagName;
	var styles = (element.styles || []).map(function (style) {
		var code = style;
		return code.replace(/[\r\n]*([^%\{;\}]+?)\{/gm, function (global, match) {
			if (match.trim().match(/^@/)) {
				return match + '{';
			}
			var selectors = match.split(',').map(function (selector) {
				selector = selector.trim();
				if (selector.match(/:host\b/) || selector.match(new RegExp('^\\s*' + tagName + '\\b')) || selector.match(/^\s*(?:(?:\d+%)|(?:from)|(?:to)|(?:@\w+)|\})\s*$/)) {
					return selector;
				}
				return tagName + ' ' + selector;
			});
			return global.replace(match, selectors.join(','));
		}).replace(/:host\b/gm, tagName) + '\n';
	}).join('\n');
	trigger('publish-style', { styles: styles, tagName: tagName });
}

on('--zino-initialize-node', initializeNode);
on('--zino-unmount-tag', unmountTag);
on('--zino-mount-tag', mount);

var tagRegExp = /<(\/?)([\w-]+)([^>]*?)(\/?)>/g;
var attrRegExp = /([\w_-]+)(?:=(?:'([^']*?)'|"([^"]*?)"))?/g;
var commentRegExp = /<!--(?:[^-]|-[^-])*-->/g;
var syntax = /\{\{\s*([^\}]+)\s*\}\}\}?/g;

/* helper functions to be used inside the generated code */

/** @function safeAccess
 * safely access the given property in the object obj.
 * 
 * @param obj (Object) - the object to read the property from
 * @param attrs (String) - the name of the property to access (allows for object paths via ., e.g. "myprop.firstValue")
 * @param escape (Boolean) - if the value should be HTML escaped to prevent XSS attacks and such
 * @return any
 */
var safeAccess$1 = 'function safeAccess(t,e,r){if(!e)return t;if("."===e[0])return t[e];for(e=e.split(".");e.length>0&&void 0!==(t=t[e.shift()]););return"string"==typeof t&&r===!0?t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;").replace(/>/g,"&gt;"):"function"==typeof t?t.call(__i):"number"==typeof t?t:t||""}';

/** @function toArray
 * turn property value of an object into an array
 * 
 * @param data (Object) - the object to read the property value from
 * @param value (String) - the property whose value should be read from the object
 * @return Array
 */
var toArray$1 = 'function toArray(t,e){var r=safeAccess(t,e);return r?"[object Array]"===Object.prototype.toString.call(r)?r:"function"==typeof r?r():[r]:[]}';

/** @function spread
 * turns an array of arrays into an array of all containing elements (reduces the array depth by 1)
 * 
 * @param array (Array) - the array to spread the values along
 * @return Array - a new array containing all the values of the sub elements
 */
var spread = 'function spread(t){var e=[];return t.forEach(function(t){e=e.concat(t)}),e}';

/** @function merge
 * merges any number of objects into the target object
 * @param target (Object) - the object the other object should be merged into
 * @param obj1 (Object) - the first object to be merged into the target object
 * @param objn (Object) - all nth object to be merged into the target object
 * @return Object - the target object
 */
var merge$1 = 'function merge(t){return[].slice.call(arguments,1).forEach(function(e){for(var r in e)t[r]=e[r]}),t}';

/** @function renderStyle
 * transforms an object into CSS properties
 * 
 * @param value (Object) - the object to be transformed
 * @param context (Object) - for any functions defined in the object, context will be provided within as `this`
 * @return String - the CSS property list separated by semicolon
 */
var renderStyle = 'function renderStyle(t,r){var e="";if(transform=function(t){return"function"==typeof t?transform(t.apply(r)):t+("number"==typeof t&&null!==t?r.styles&&r.styles.defaultUnit||"px":"")},"object"==typeof t)for(var n in t)e+=n.replace(/[A-Z]/g,function(t){return"-"+t.toLowerCase()})+":"+transform(t[n])+";";return e}';

/* this is the base structure of a Zino tag */
var baseCode = 'function (Tag,Zino){var __i;{{helperFunctions}};return{tagName:"{{tagName}}",{{styles}}render:function(data){return __i=this,[].concat({{render}})},functions:{{functions}}}}';

/** takes an HTML string containing mustache code and turns it into executable JS code that generates a vdom */
function parse(data) {
	var resultObject = {
		styles: [],
		helperFunctions: [safeAccess$1],
		tagName: '',
		render: '',
		functions: []
	};
	var usesMerge = false,
	    usesRenderStyle = false,
	    usesSpread = false;
	var match = void 0,
	    lastIndex = 0,
	    level = 0,
	    tagStack = [];

	// return the correct data level for multi-level mustache blocks
	function getData() {
		return 'data' + (level === 0 ? '' : '$' + level);
	}

	// text is the only place where mustache code can be found
	function handleText(text, isAttr) {
		var match = void 0,
		    result = '',
		    lastIndex = 0;
		var cat = isAttr ? ' + ' : ', ';
		if (!text.match(syntax)) {
			return result += "'" + text.substr(lastIndex).replace(/\n/g, '').replace(/'/g, '\\\'') + "'" + cat;
		}
		// locate mustache syntax within the text
		while (match = syntax.exec(text)) {
			if (match.index < lastIndex) continue;
			var frag = text.substring(lastIndex, match.index).replace(/^\s+/g, '');
			if (frag.length > 0) {
				result += "'" + frag.replace(/\n/g, '').replace(/'/g, '\\\'') + "'" + cat;
			}
			lastIndex = match.index + match[0].length;
			var key = match[1];
			// of "{{#test}}" value will be "test"
			var value = key.substr(1);
			if (key[0] === '#') {
				// handle block start
				result += 'spread(toArray(' + getData() + ', \'' + value + '\').map(function (e, i, a) {\n\t\t\t\t\t\tvar data$' + (level + 1) + ' = merge({}, data' + (0 >= level ? '' : '$' + level) + ', {\'.\': e, \'.index\': i, \'.length\': a.length}, e);\n\t\t\t\t\t\treturn [].concat(';
				level += 1;
				usesMerge = true;
				usesSpread = true;
			} else if (key[0] === '/') {
				// handle block end
				result += '\'\'); }))' + (isAttr ? '.join("")' : '') + cat;
				level -= 1;
				if (level < 0) {
					throw new Error('Unexpected end of block: ' + key.substr(1));
				}
			} else if (key[0] === '^') {
				// handle inverted block start
				result += '(safeAccess(' + getData() + ', \'' + value + '\') && (typeof safeAccess(' + getData() + ', \'' + value + '\') === \'boolean\' || safeAccess(' + getData() + ', \'' + value + '\').length > 0)) ? \'\' : spread([1].map(function() { var data$' + (level + 1) + ' = merge({}, data' + (0 >= level ? '' : '$' + level) + '); return [].concat(';
				usesSpread = true;
				level += 1;
			} else if (key[0] === '%') {
				// handle style rendering "{{%myvar}}" - only to be used for attribute values!
				result += key.substr(1).split(/\s*,\s*/).map(function (value) {
					return 'renderStyle(safeAccess(' + getData() + ', \'' + value + '\'), ' + getData() + ')';
				}).join(' + ');
				usesRenderStyle = true;
			} else if (key[0] === '+') {
				// handle deep data transfer "{{+myvar}}"
				result += 'safeAccess(' + getData() + ', \'' + value + '\')' + cat;
			} else if (key[0] !== '{' && key[0] !== '!') {
				// handle non-escaping prints "{{{myvar}}}"
				value = key;
				result += '\'\'+safeAccess(' + getData() + ', \'' + value + '\', true)' + cat;
			} else if (key[0] !== '!') {
				// regular prints "{{myvar}}"
				result += '\'\'+safeAccess(' + getData() + ', \'' + value + '\')' + cat;
			} // ignore comments
		}
		if (text.substr(lastIndex).length > 0) {
			result += "'" + text.substr(lastIndex).replace(/\n/g, '').replace(/'/g, '\\\'') + "'" + cat;
		}
		return result;
	}

	// generate attribute objects for vdom creation
	function makeAttributes(attrs) {
		var attributes = '{';
		var attr = void 0;

		while (attr = attrRegExp.exec(attrs)) {
			if (attributes !== '{') attributes += ', ';
			attributes += '"' + attr[1].toLowerCase() + '": ' + handleText(attr[2] || attr[3] || '', true).replace(/\s*[,+]\s*$/g, '');
		}
		return attributes + '}';
	}

	// clean up code
	on('--zino-addscript', function (content) {
		content = content.trim().replace(/;$/, '').replace(/(['"`])([^\1\n]*)\1/gm, function (g, m, c) {
			return g.replace(c, c.replace(/\/\//g, '\\/\\/'));
		}).replace(/\/\/.*$/gm, '');
		if (content.trim()) {
			resultObject.functions.push(content);
			usesMerge = true;
		}
	});
	// handle all scripts and styles
	data = data.replace(commentRegExp, '').replace(/<(script|style)(\s+[^>]*?)?>((?:.|\n)*?)<\/\1>/gi, function (g, x, a, m) {
		if (x === 'style') {
			resultObject.styles.push(m);
		} else {
			if (a && a.match(/\s+src=(?:(?:'([^']+)')|(?:"([^"]+)"))/g)) {
				trigger('publish-script', RegExp.$1 || RegExp.$2);
			} else {
				trigger('--zino-addscript', m);
			}
		}
		return '';
	}).trim();
	off('--zino-addscript');

	// check if we have an actual HTML component code (looking for the starting tag)
	if (!data.match(tagRegExp)) {
		throw new Error('No proper component provided');
	}
	// find out how the component is called
	resultObject.tagName = data.match(/^<([\w_-]+)>/)[1].toLowerCase();

	// loop through all HTML tags in code
	while (match = tagRegExp.exec(data)) {
		// skip the ones we already processed
		if (match.index < lastIndex) continue;
		var text = data.substring(lastIndex, match.index).replace(/^[ \t]+|[ \t]$/g, ' ').trim();
		lastIndex = match.index + match[0].length;
		// if we have some leading text (before the first tag)
		if (text.length > 0) {
			// it must be a text node
			resultObject.render += handleText(text);
		}
		// if we found the tag's definition, skip it
		if (match[2] === resultObject.tagName) continue;
		if (match[1]) {
			// closing tag
			var expected = tagStack.pop();
			if (expected !== match[2]) {
				throw new Error('Unexpected end of tag: ' + match[2] + '; expected to end ' + expected);
			}
			resultObject.render = resultObject.render.replace(/,\s*$/g, '') + ')), ';
		} else {
			// opening tag
			tagStack.push(match[2]);
			var attributes = makeAttributes(match[3]);
			resultObject.render += 'new Tag(\'' + match[2] + '\', ' + attributes;
			if (!match[4]) {
				// not a self-closing tag, so prepare for it's content
				resultObject.render += ', [].concat(';
			} else {
				// self-closing tag, close it immediately
				resultObject.render += '), ';
				tagStack.pop();
			}
		}
	}
	if (tagStack.length > 0) {
		throw new Error('Unclosed tags: ' + tagStack.join(', '));
	}
	if (level > 0) {
		throw new Error('Unexpected end of block');
	}
	// if we have content after the last found tag node
	if (data.substr(lastIndex).trim().length > 0) {
		// it must be a text node
		resultObject.render += handleText(data.substr(lastIndex).replace(/^[ \t]+|[ \t]$/g, ' ').trim());
	}
	resultObject.render = resultObject.render.replace(/,\s*$/g, '');

	// add helper functions that were used by the code
	if (usesMerge) {
		resultObject.helperFunctions.push(merge$1);
		resultObject.helperFunctions.push(toArray$1);
	}
	if (usesSpread) {
		resultObject.helperFunctions.push(spread);
	}
	if (usesRenderStyle) {
		resultObject.helperFunctions.push(renderStyle);
	}
	resultObject.functions = resultObject.functions.length > 0 ? 'merge({}, ' + (resultObject.functions.join(', ') || '{}') + ')' : '{}';
	resultObject.styles = resultObject.styles.length > 0 ? 'styles: ' + JSON.stringify(resultObject.styles) + ',' : '';
	resultObject.helperFunctions = resultObject.helperFunctions.join('\n');

	// fill in place-holders in base code and return the result
	return baseCode.replace(/\{\{([^\}]+)\}\}/g, function (g, m) {
		return resultObject[m];
	});
}

var urlRegistry = window.zinoTagRegistry || {};
var Zino = void 0;
var dirtyTags = [];
var tagObserver = new MutationObserver(function (records) {
	records.forEach(function (record) {
		var added = record.addedNodes,
		    removed = record.removedNodes;

		if (added.length > 0) {
			[].forEach.call(added, function (tag) {
				return trigger('--zino-mount-tag', tag);
			});
		} else if (removed.length > 0) {
			[].forEach.call(removed, function (tag) {
				(tag.children && $('[__ready]', tag) || []).concat(tag).forEach(function (subTag) {
					return trigger('--zino-unmount-tag', subTag);
				});
			});
		}
	});
});

function $(selector, context) {
	return [].slice.call(context.querySelectorAll(selector));
}

var zino = Zino = {
	on: on, one: one, off: off, trigger: trigger,

	fetch: function fetch(url, callback, cache, code) {
		if (cache && urlRegistry[url] && !urlRegistry[url].callback) {
			return callback(urlRegistry[url], 200);
		} else if (isObj(urlRegistry[url])) {
			return urlRegistry[url].callback.push(callback);
		}
		urlRegistry[url] = code || {
			callback: [callback]
		};
		if (code) return;
		var req = new XMLHttpRequest();
		req.open('GET', url, true);
		req.onreadystatechange = function () {
			if (req.readyState === 4) {
				var callbacks = urlRegistry[url].callback;
				if (req.status === 200) {
					urlRegistry[url] = req.responseText;
				}
				if (!cache) delete urlRegistry[url];
				callbacks.forEach(function (cb) {
					return cb(req.responseText, req.status);
				});
			}
		};
		req.send();
	},


	import: function _import(path) {
		var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : emptyFunc;

		var register = function register(code) {
			code && registerTag(code, document.body, Zino);
			callback();
		};

		var url = (this.path || '') + path;
		if (typeof path !== 'string') return register(path);
		Zino.fetch(url, function (data, status) {
			var path = url.replace(/[^\/]+$/g, '');
			if (status === 200) {
				var code = void 0;
				try {
					// if we have HTML input
					if (data.trim().indexOf('<') === 0) {
						// convert it to JS
						data = parse(data);
					}
					code = new Function('return ' + data.replace(/url\((\\*['"])?(.*?)\1\)/g, function (g, quote, url) {
						if (url.indexOf('data:') === 0 || url.indexOf('http') === 0 || url.indexOf('//') === 0 || url.indexOf('/') === 0) return g;
						return 'url(' + path + url + ')';
					}).replace(/\bZino.import\s*\(/g, 'Zino.import.call({path: ' + JSON.stringify(path) + '}, ').trim().replace(/;$/, ''))();
				} catch (e) {
					e.message = 'Unable to import tag ' + url.replace(/.*\//g, '') + ': ' + e.message;
					throw e;
				}
				register(code);
			}
		}, true);
	}
};
window.Zino = Zino;
on('publish-style', function (data) {
	if (typeof data.tagName === 'string' && data.styles.length > 0) {
		if (document.getElementById('style:' + data.tagName)) return;
		var style = document.createElement('style');
		style.innerHTML = data.styles;
		style.id = 'style:' + data.tagName;
		document.head.appendChild(style);
	}
});
on('--zino-rerender-tag', function (tag) {
	return dirtyTags.indexOf(tag) < 0 && dirtyTags.push(tag);
});
trigger('publish-style', '[__ready] { contain: content; }');
$('[rel="zino-tag"]', document).forEach(function (tag) {
	return Zino.import(tag.href);
});
tagObserver.observe(document.body, {
	subtree: true,
	childList: true
});

requestAnimationFrame(function reRender() {
	while (dirtyTags.length > 0) {
		render(dirtyTags.shift());
	}
	requestAnimationFrame(reRender);
});

return zino;

}());
//# sourceMappingURL=zino.js.map
