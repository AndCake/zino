var __zino = (function () {
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
function merge$1(target) {
	for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
		args[_key - 1] = arguments[_key];
	}

	for (var arg, len = args.length, index = 0; arg = args[index], index < len; index += 1) {
		for (var all in arg) {
			if (typeof HTMLElement !== 'undefined' && arg instanceof HTMLElement || typeof propDetails(arg, all).value !== 'undefined' && (!target[all] || propDetails(target, all).writable)) {
				if (all !== 'attributes') target[all] = arg[all];
			}
		}
	}

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

function toArray$1(obj, startIdx) {
	return Array.prototype.slice.call(obj, startIdx || 0);
}

var isObj = function isObj(obj) {
	return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object';
};
var isFn = function isFn(fn) {
	return typeof fn === 'function';
};
var emptyFunc = function emptyFunc() {};
var identity = function identity(a) {
	return a;
};

var eventQueue = {};

function publishEvent(type, data) {
	data.name.indexOf('--event-') && trigger('--event-' + type, data);
}

function trigger(name, data) {
	publishEvent('trigger', { name: name, data: data });
	if (!eventQueue[name]) return;
	for (var index in eventQueue[name]) {
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
var safeAccess = 'function safeAccess(t,e,r){if(!e)return t;if("."===e[0])return t[e];for(e=e.split(".");e.length>0&&void 0!==(t=t[e.shift()]););return"string"==typeof t&&r===!0?t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;").replace(/>/g,"&gt;"):"function"==typeof t?t.call(__i):"number"==typeof t?t:t||""}';

/** @function toArray
 * turn property value of an object into an array
 *
 * @param data (Object) - the object to read the property value from
 * @param value (String) - the property whose value should be read from the object
 * @return Array
 */
var toArray = 'function toArray(t,e){var r=safeAccess(t,e);return r?"[object Array]"===Object.prototype.toString.call(r)?r:"function"==typeof r?r():[r]:[]}';

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
var merge = 'function merge(t){return[].slice.call(arguments,1).forEach(function(e){for(var r in e)t[r]=e[r]}),t}';

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

/** parses style information from within a style tag makes sure it is localized */
function handleStyles(tagName, styles) {
	styles = (styles || []).map(function (style) {
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
	});
	return styles;
}

/** takes an HTML string containing mustache code and turns it into executable JS code that generates a vdom */
function parse(data) {
	var resultObject = {
		styles: [],
		helperFunctions: [safeAccess],
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
				usesMerge = true;
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
	resultObject.styles = handleStyles(resultObject.tagName, resultObject.styles);

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
			resultObject.render += 'Tag(\'' + match[2] + '\', ' + attributes;
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
		resultObject.helperFunctions.push(merge);
		resultObject.helperFunctions.push(toArray);
	}
	if (usesSpread) {
		resultObject.helperFunctions.push(spread);
	}
	if (usesRenderStyle) {
		resultObject.helperFunctions.push(renderStyle);
	}
	if (resultObject.functions.length > 0) {
		resultObject.functions = 'merge({}, ' + (resultObject.functions.join(', ') || '{}') + ')';
		if (!usesMerge) {
			resultObject.helperFunctions.push(merge);
		}
	} else {
		resultObject.functions = '{}';
	}
	resultObject.styles = resultObject.styles.length > 0 ? 'styles: ' + JSON.stringify(resultObject.styles) + ',' : '';
	resultObject.helperFunctions = resultObject.helperFunctions.join('\n');

	// fill in place-holders in base code and return the result
	return baseCode.replace(/\{\{([^\}]+)\}\}/g, function (g, m) {
		return resultObject[m];
	});
}

function attachEvent(el, events, host) {
	if (!isFn(el.addEventListener)) return;
	var findEl = function findEl(selector, target) {
		var node = toArray$1(el.querySelectorAll(selector));
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

function attachSubEvents(events) {
	var subEvents = events.subEvents,
	    tag = events.tag;

	var count = {};
	// make sure that we only attach events if we are actually in browser context
	if (tag.addEventListener.toString().indexOf('[native code]') >= 0) {
		subEvents.events.forEach(function (event) {
			var el = event.tag;
			if (!isObj(el)) {
				// we have a selector rather than an element
				count[el] = (count[el] || 0) + 1;
				// turn the selector into the corresponding element
				el = tag.querySelectorAll(el)[count[el] - 1];
			}
			// if no events have been attached yet
			if (el && el.children.length > 0 && !el.children[0].__eventsAttached) {
				// attach children tag events to the shadow root
				attachEvent(el.children[0], event.childEvents, el);
				// attach host events directly to the component!
				attachEvent(el, event.hostEvents, el);
				el.children[0].__eventsAttached = true;
			}
		});
	}
}

var tagFilter = [];
var tagsCreated = [];
var dataResolver = function dataResolver(attr, value) {
	return attr;
};

function isArray(obj) {
	return Object.prototype.toString.call(obj) === '[object Array]';
}

function hashCode(str) {
	var hash = 0,
	    i = void 0,
	    chr = void 0;
	for (i = 0; i < str.length; i++) {
		chr = str.charCodeAt(i);
		hash = (hash << 5) - hash + chr;
		hash |= 0;
	}
	return hash;
}

function setDataResolver(resolver) {
	dataResolver = resolver;
}

function Tag(tagName, attributes) {
	for (var _len = arguments.length, children = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
		children[_key - 2] = arguments[_key];
	}

	tagName = tagName.toLowerCase();
	attributes = attributes || {};
	var attributeHash = '';
	Object.keys(attributes).forEach(function (attr) {
		attributes[attr] = { name: attr, value: _typeof(attributes[attr]) !== 'object' ? attributes[attr] : '--' + dataResolver(attr, attributes[attr]) + '--' };
		attributeHash += attr + attributes[attr].value;
	});
	children = children.length === 1 && Array.isArray(children[0]) ? children[0] : children;
	var tag = {
		tagName: tagName,
		attributes: attributes,
		children: children.filter(function (child) {
			return child;
		}),
		__hash: hashCode(tagName + '!' + attributeHash + '@' + children.map(function (child) {
			return child && child.__hash || child;
		}).join('!'))
	};
	if (tagFilter.indexOf(tagName) >= 0) tagsCreated.push(tag);
	return tag;
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
	if (!isArray(node.children) && typeof HTMLCollection !== 'undefined' && !(node.children instanceof HTMLCollection)) node.children = [node.children];

	return (isArray(node) && node || (typeof HTMLCollection !== 'undefined' && node.children instanceof HTMLCollection ? [].slice.call(node.children) : node.children)).map(function (child) {
		if ((typeof child === 'undefined' ? 'undefined' : _typeof(child)) !== 'object') {
			return '' + child;
		} else if (isArray(child)) {
			return getInnerHTML(child);
		} else {
			var attributes = [''].concat(Object.keys(child.attributes).map(function (attr) {
				return attr + '="' + child.attributes[attr].value + '"';
			}));
			if (['img', 'link', 'meta', 'input', 'br', 'area', 'base', 'param', 'source', 'hr', 'embed'].indexOf(child.tagName) < 0) {
				return '<' + child.tagName + attributes.join(' ') + '>' + getInnerHTML(child) + '</' + child.tagName + '>';
			} else {
				return '<' + child.tagName + attributes.join(' ') + '/>';
			}
		}
	}).join('');
}

function setAttribute(name, value) {
	// ignore setAttribute definition for custom tags
	if (this.tagName.indexOf('-') >= 0) return;
	HTMLElement.prototype.setAttribute.call(this, name, value);
	var el = this;
	do {
		delete el.__hash;
		el = el.parentNode;
	} while (el && el.__hash);
}

function attachSetAttribute(node) {
	node.setAttribute = setAttribute.bind(node);
	for (var index = 0, length = node.children.length, child; child = node.children[index], index < length; index += 1) {
		attachSetAttribute(child);
	}
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
		// define it's inner structure
		tag.innerHTML = getInnerHTML(node);
		tag.__hash = node.__hash;
		attachSetAttribute(tag);
	}

	return tag;
}

function applyText(domChild, dom, node, document) {
	// simply apply the value
	if ((node || '').match(/<[\w:_-]+[^>]*>/)) {
		if (dom.childNodes.length === 1) {
			dom.innerHTML = node;
		} else {
			var html = document.createElement('span');
			html.innerHTML = node;
			dom.replaceChild(html, domChild);
		}
	} else {
		// it's just a text node, so simply replace the element with the text node
		dom.replaceChild(createElement((node || '').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'), document), domChild);
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
	if (!dom || !vdom) return;
	if (!isArray(vdom)) {
		// if we have a node
		if (!isArray(vdom.children)) vdom.children = [vdom.children];
		if (dom.__hash !== vdom.__hash) {
			// if the tag name is not the same
			if (vdom.tagName !== dom.tagName.toLowerCase()) {
				// replace the node entirely
				dom.parentNode.replaceChild(createElement(vdom, document), dom);
			} else {
				var attributes = Object.keys(vdom.attributes);
				// check all vdom attributes
				for (var attr, _index = 0, len = attributes.length; attr = vdom.attributes[attributes[_index]], _index < len; _index += 1) {
					// if the VDOM attribute is a non-object
					if (_typeof(attr.value) !== 'object') {
						// check if it differs
						if (dom.getAttribute(attr.name) != attr.value) {
							// if so, apply it
							dom.setAttribute(attr.name, attr.value);
						}
					} else {
						// the attribute is an object
						if (dom.getAttribute(attr.name) && dom.getAttribute(attr.name).match(/^--|--$/g)) {
							// if it has a complex value, use the data resolver to define it on the DOM
							var id = dataResolver(attr.name, attr.value, dom.getAttribute(attr.name).replace(/^--|--$/g, ''));
							// only set the ID with markers so that we know it is supposed to be a complex value
							dom.setAttribute(attr.name, '--' + id + '--');
						}
					}
				}
				// if we have too many attributes in our DOM
				var index = 0;
				while (dom.attributes.length > attributes.length) {
					var _attr = dom.attributes[index];
					// if the respective attribute does not exist on the VDOM
					if (typeof vdom.attributes[_attr.name] === 'undefined') {
						// remove it
						dom.removeAttribute(_attr.name);
						index = 0;
						continue;
					}
					index += 1;
				}
			}
		}
	}

	// deal with the vdom's children
	var children = isArray(vdom) ? vdom : vdom.__hash !== dom.__hash ? vdom.children : [];
	for (var _index2 = 0, node, _len2 = children.length; node = children[_index2], _index2 < _len2; _index2 += 1) {
		if (isArray(node)) return applyDOM(dom, node, document);
		var domChild = dom.childNodes[_index2];
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
	}
	if (dom.__hash !== vdom.__hash && dom.childNodes.length > children.length) {
		// remove superfluous child nodes
		for (var _index3 = children.length, _len3 = dom.childNodes.length; _index3 < _len3; _index3 += 1) {
			dom.removeChild(dom.childNodes[_index3]);
			_len3 -= 1;
			_index3 -= 1;
		}
	}
	dom.__hash = vdom.__hash;
	dom.setAttribute = setAttribute.bind(dom);
}

var resolveData = function resolveData(key, value, oldID) {
	var id = uuid();
	if (oldID) {
		// unregister old entry
		delete dataRegistry[oldID];
	}
	dataRegistry[id] = value;
	return id;
};

var resolveDataKey = function resolveDataKey(key) {
	return dataRegistry[key];
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
			tag.mounting = true;
			for (var all in name) {
				setProps.call(this, all, name[all]);
			}
			tag.mounting = false;
		} else {
			tag.props[name] = value;
			var attrName = 'data-' + name.replace(/[A-Z]/g, function (g) {
				return '-' + g.toLowerCase();
			});
			if (tag.attributes[attrName]) {
				defineAttribute(tag, attrName, '--' + resolveData(name, value, tag.attributes[attrName].value) + '--');
			}
		}
		!tag.mounting && trigger('--zino-rerender-tag', tag);
	}
};


function setDataRegistry(newValues) {
	dataRegistry = newValues;
}

function registerTag(fn, document, Zino) {
	var firstElement = new fn(Tag, Zino),
	    tagName = firstElement && firstElement.tagName || fn.name || '';
	if (!tagName) {
		tagName = fn.toString().split('\n')[0].replace(/^\s*function\s+(.*?)\s*\(.*$/, '$1');
		if (!tagName.match(/^[A-Z][A-Za-z]*$/)) {
			throw new Error('Unable to extract component\'s tag name from provided component function: ' + fn.toString());
		}
	}
	tagName = tagName.replace(/([A-Z])/g, function (g, beginning) {
		return '-' + beginning;
	}).toLowerCase().replace(/^-/, '');

	if (firstElement instanceof fn) {
		firstElement.__zino = Zino;
		firstElement.functions = {
			props: firstElement.props || {},
			events: firstElement.events || {},
			render: firstElement.onrender || emptyFunc,
			mount: firstElement.onmount || emptyFunc,
			unmount: firstElement.onunmount || emptyFunc
		};
	}

	if (tagRegistry[tagName]) {
		// tag is already registered
		// initialize all occurences in provided context
		document && toArray$1(document.getElementsByTagName(tagName)).forEach(function (tag) {
			return initializeTag(tag, tagRegistry[tagName]);
		});
		return;
	}

	trigger('publish-style', { styles: firstElement.styles, tagName: tagName });
	firstElement.functions = merge$1({}, defaultFunctions, firstElement.functions);
	tagRegistry[tagName] = firstElement;

	// initialize all occurences in provided context
	document && toArray$1(document.getElementsByTagName(tagName)).forEach(function (tag) {
		return initializeTag(tag, tagRegistry[tagName]);
	});
}

function mount(tag, ignoreRender) {
	if (!tag || !tag.tagName) return {};
	var entry = tagRegistry[tag.tagName.toLowerCase()];
	if (!entry || tag.getAttribute('__ready')) return {};
	if (ignoreRender) entry.functions.render = emptyFunc;
	return initializeTag.call(ignoreRender ? { noEvents: true } : this, tag, entry);
}

function render(tag) {
	if (!tag || !tag.addEventListener) return;
	var subEvents = renderTag(tag);
	if (!subEvents) return;
	trigger('--zino-attach-events', {
		subEvents: subEvents,
		tag: tag
	});
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
	if (!tag.nodeType) while (tag.children.length > 1) {
		tag.children.pop();
	}
	trigger('--zino-initialize-node', { tag: tag, node: functions, entry: registryEntry });
	tag.__vdom = {};
	tag.createNode = Tag;

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
		trigger('--zino-attach-events', { subEvents: subEvents, tag: tag });

		[tag].concat(tag.__subs).forEach(function (el) {
			var actual = el && el.getHost() || {};
			isFn(actual.onready) && actual.onready.call(actual);
		});
	} else {
		return subEvents;
	}
}

function defineAttribute(tag, name, value) {
	if (tag.ownerDocument) {
		// use the HTMLElement's setAttribute to define the attribute
		(tag.prototype || HTMLElement.prototype).setAttribute.call(tag, name, value);
	} else {
		// we now know it can only be a vdom node, so set attribute vdom-style
		tag.attributes[name] = { name: name, value: value };
	}
}

function initializeNode(_ref) {
	var tag = _ref.tag,
	    _ref$node = _ref.node,
	    functions = _ref$node === undefined ? defaultFunctions : _ref$node,
	    entry = _ref.entry;

	// copy all defined functions/attributes
	for (var all in functions) {
		var _entry = functions[all];
		if (['mount', 'unmount', 'events', 'render'].indexOf(all) < 0) {
			if (isFn(_entry)) {
				tag[all] = _entry.bind(tag);
			} else {
				tag[all] = isObj(tag[all]) ? merge$1({}, _entry, tag[all]) : _entry;
			}
		}
	}
	// define basic properties
	var desc = Object.getOwnPropertyDescriptor(tag, 'body');
	if (!desc || typeof desc.get === 'undefined') {
		Object.defineProperty(tag, 'body', {
			set: function set$$1(val) {
				tag.__i = val;
				setElementAttr(tag);
				trigger('--zino-rerender-tag', tag.getHost());
			},
			get: function get$$1() {
				return tag.__i;
			}
		});
	}
	tag.setAttribute = function (attr, val) {
		defineAttribute(this, attr, val);
		trigger('--zino-rerender-tag', this);
	};

	// call mount callback
	tag.props = merge$1({}, functions.props, getAttributes(tag, true));
	tag.attrs = getAttributes(tag);

	try {
		tag.mounting = true;
		functions.mount.call(tag, entry.__zino);
		delete tag.mounting;
	} catch (e) {
		e.message = 'Unable to call mount function for ' + tag.tagName + ': ' + (e.message || e);
		throw e;
	}
}

function renderTag(tag) {
	var registryEntry = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : tagRegistry[tag.tagName.toLowerCase()];

	var events = [],
	    renderCallbacks = [],
	    renderedSubElements = [],
	    renderedDOM = void 0;

	// do the actual rendering of the component
	setDataResolver(resolveData);
	clearTagsCreated();
	var data = getAttributes(tag);
	var dataList = [];

	function dataToString(data) {
		var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

		var num = 0;
		for (var all in data) {
			if (_typeof(data[all]) !== 'object') {
				num = hashCode(num + ';' + all + ':' + (data[all] === null || data[all] === undefined ? 'null' : data[all]).toString());
			} else {
				var res = all + ':';
				if (depth < 10 && !(depth === 0 && all === 'element') && dataList.indexOf(data[all]) < 0) {
					dataList.push(data[all]);
					res += dataToString(data[all], depth + 1);
				}
				num = hashCode(num + ';' + res);
			}
		}
		return num;
	}
	dataList = [];
	var hash = dataToString(data);

	if (tag.__dataHash === hash) {
		// data did not change, so no re-render required
		return { events: events, renderCallbacks: renderCallbacks, data: data, subElements: renderedSubElements };
	}
	tag.__dataHash = hash;

	if (isFn(registryEntry.render)) {
		// tell the vdom which tags to remember to look for
		setFilter(Object.keys(tagRegistry));
		renderedDOM = Tag('div', { 'class': '-shadow-root' }, registryEntry.render.call(tag, data));
	} else {
		throw new Error('No render function provided in component ' + tag.tagName);
	}

	// unmount previously rendered sub components
	tag.__subs && tag.__subs.forEach(unmount);

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
			// make sure that we build the hierarchical order of sub elements (same as what comes back from querySelectorAll)
			renderedSubElements.splice.apply(renderedSubElements, [idx + 1, 0].concat(subElEvents.subElements));
			// array has been extended, adapt...
			idx += subElEvents.subElements.length;
			len += subElEvents.subElements.length;
			events = events.concat(subElEvents.events);
			renderCallbacks = renderCallbacks.concat(subElEvents.renderCallbacks);
		}
	}

	if (tag.ownerDocument) {
		// has been rendered before, so just apply diff
		applyDOM(tag.children[0], renderedDOM, tag.ownerDocument);
	} else {
		tag.children[0] = renderedDOM;
		tag.children[0].__hash = renderedDOM.__hash;
	}
	tag.__subs = renderedSubElements;
	tag.__vdom = renderedDOM;

	var inconsistent = false;

	do {
		if (inconsistent) {
			tag.children[0].innerHTML = getInnerHTML(renderedDOM);
			inconsistent = false;
			break;
		}
		// if we have rendered any sub components, retrieve their actual DOM node
		if (renderedSubElements.length > 0 && tag.querySelectorAll) {
			for (var _subEl, ready = tag.querySelectorAll('[__ready]'), index = 0, _len = ready.length; _subEl = ready[index], index < _len; index += 1) {
				// apply all additional functionality to them (custom functions, attributes, etc...)
				merge$1(_subEl, renderedSubElements[index]);
				// update getHost to return the DOM node instead of the vdom node
				if (!renderedSubElements[index] || _subEl.tagName.toLowerCase() !== renderedSubElements[index].tagName) {
					console.info('Inconsistent state - might be caused by additional components generated in render callback: ', _subEl, tag.__subs, ready);
					inconsistent = true;
					break;
				}
				_subEl.getHost = renderedSubElements[index].getHost = defaultFunctions.getHost.bind(_subEl);
			}
		}
	} while (inconsistent);
	tag.isRendered = true;

	// if this is not a sub component's rendering run
	if (!this || !this.noRenderCallback) {
		// call all of our sub component's render functions
		renderCallbacks.forEach(function (callback) {
			try {
				callback.fn.call(callback.tag.getHost(), tagRegistry[callback.tag.getHost().tagName.toLowerCase()].__zino);
			} catch (e) {
				throw new Error('Unable to call render callback for component ' + callback.tag.tagName + ': ' + (e.message || e));
			}
		});
		// call our own rendering function
		try {
			registryEntry.functions.render.call(tag, registryEntry.__zino);
		} catch (e) {
			throw new Error('Unable to call render callback for component ' + tag.tagName + ': ' + (e.message || e));
		}
	} else {
		// just add this sub component's rendering function to the list
		renderCallbacks.push({ fn: registryEntry.functions.render, tag: tag });
	}

	return { events: events, renderCallbacks: renderCallbacks, data: data, subElements: renderedSubElements };
}

function unmount(tag) {
	var name = (tag && tag.tagName || '').toLowerCase(),
	    entry = tagRegistry[name];
	if (tag && name && entry) {
		[].forEach.call(tag.nodeType === 1 && tag.attributes || Object.keys(tag.attributes).map(function (attr) {
			return tag.attributes[attr];
		}), function (attr) {
			// cleanup saved data
			if (attr.name.indexOf('data-') >= 0) {
				delete dataRegistry[attr.value];
			}
		});
		try {
			entry.__subs && entry.__subs.forEach(unmount);
			entry.functions.unmount.call(tag, entry.__zino);
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
		attrs[attribute.name] || (attrs[attribute.name] = isComplex && typeof value === 'string' && resolveDataKey(value.replace(/^--|--$/g, '')) || value);
		if (attribute.name.indexOf('data-') === 0) {
			if (typeof attrs[attribute.name] === 'string' && attrs[attribute.name].match(/^--[a-f0-9-]+--$/)) {
				attrs[attribute.name] = resolveDataKey(value.replace(/^--|--$/g, ''));
			}
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

on('--zino-initialize-node', initializeNode);

var document$1 = void 0;
var loadComponent = emptyFunc;

var Zino$1 = {
	on: on, one: one, off: off, trigger: trigger,
	fetch: emptyFunc,

	import: function _import(path) {
		var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : emptyFunc;

		var runCode = function runCode(code) {
			if (code) {
				isFn(code.setDocument) && code.setDocument(document$1);
				registerTag(code, document$1.body, Zino$1);
			}
			callback();
		};
		if (typeof path === 'function') {
			runCode(path);
		} else {
			loadComponent((this.path || '') + path, runCode);
		}
	}
};

var actions = { mount: mount, render: render, unmount: unmount };
function setDocument(doc) {
	document$1 = doc;
}
function setComponentLoader(fn) {
	loadComponent = fn;
}
on('publish-style', function (data) {
	if (typeof data.tagName === 'string' && data.styles && data.styles.length > 0) {
		if (document$1.getElementById('style:' + data.tagName)) return;
		var style = document$1.createElement('style');
		style.innerHTML = data.styles;
		style.setAttribute('id', 'style:' + data.tagName);
		document$1.head.appendChild(style);
	}
});

var urlRegistry = window.zinoTagRegistry || {};
var dirtyTags = [];
var mountTags = [];
var parseCode = identity;
var tagObserver = new MutationObserver(function (records) {
	records.forEach(function (record) {
		var added = record.addedNodes,
		    removed = record.removedNodes;

		if (added.length > 0) {
			mountTags = [].concat.call(added, mountTags);
		} else if (removed.length > 0) {
			[].forEach.call(removed, function (tag) {
				(tag.children && toArray$1(tag.querySelectorAll('[__ready]')) || []).concat(tag).forEach(actions.unmount);
			});
		}
	});
});

setDataRegistry(window.zinoDataRegistry || {});

window.Zino = Zino$1;
Zino$1.isBrowser = true;
Zino$1.isServer = false;
Zino$1.fetch = function (url, callback, cache, code) {
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
};
setComponentLoader(function (url, fn) {
	Zino$1.fetch(url, function (data, status) {
		var path = url.replace(/[^\/]+$/g, '');
		if (status === 200) {
			var code = void 0;
			try {
				data = parseCode(data);
				code = new Function('return ' + data.replace(/url\((\\*['"])?(.*?)\1\)/g, function (g, quote, url) {
					if (url.indexOf('data:') === 0 || url.indexOf('http') === 0 || url.indexOf('//') === 0 || url.indexOf('/') === 0) return g;
					return 'url(' + path + url + ')';
				}).replace(/\bZino.import\s*\(/g, 'Zino.import.call({path: ' + JSON.stringify(path) + '}, ').trim().replace(/;$/, ''))();
				if (typeof code(function () {}, Zino$1) === 'function') {
					code = code();
				}
			} catch (e) {
				e.message = 'Unable to import tag ' + url.replace(/.*\//g, '') + ': ' + e.message;
				throw e;
			}
			fn(code);
		}
	}, true);
});
setDocument(window.document);

function setParser(fn) {
	parseCode = fn;
}

Zino$1.on('--zino-attach-events', attachSubEvents);
Zino$1.on('--zino-rerender-tag', function (tag) {
	return dirtyTags.indexOf(tag) < 0 && dirtyTags.push(tag);
});
Zino$1.trigger('publish-style', '[__ready] { contain: content; }');
toArray$1(document.querySelectorAll('[rel="zino-tag"]')).forEach(function (tag) {
	return Zino$1.import(tag.href);
});
tagObserver.observe(document.body, {
	subtree: true,
	childList: true
});

function loopList(start, list, action) {
	while (list.length > 0) {
		var entry = list.shift();
		if (entry instanceof NodeList || entry.length > 0) {
			for (var all in entry) {
				action(entry[all]);
			}
		} else {
			action(entry);
		}
		if (performance.now() - start > 16) {
			break;
		}
	}
}

requestAnimationFrame(function reRender(start) {
	loopList(start, mountTags, actions.mount);
	loopList(start, dirtyTags, actions.render);
	requestAnimationFrame(reRender);
});

setParser(function (data) {
	// if we have HTML input
	if (data.trim().indexOf('<') === 0) {
		// convert it to JS
		data = parse(data);
	}

	return data;
});

return Zino$1;

}());
//# sourceMappingURL=zino.js.map
