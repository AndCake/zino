(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Zino = factory());
}(this, (function () { 'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};









































var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

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
			if (typeof propDetails(arg, all).value !== 'undefined' && (!target[all] || propDetails(target, all).writable)) {
				target[all] = arg[all];
			}
		}
	});

	return target;
}

function propDetails(obj, attribute) {
	return Object.getOwnPropertyDescriptor(obj, attribute) || {};
}

/**
 * Creates a diff of two JS objects. Includes attribute position check.
 *
 * @param  {Object} objA	the object to be compared
 * @param  {Object} objB 	the object to compare with
 * @return {Object,Boolean} false if both objects are deep equal, else the values of what is different
 */


function error$1(method, tag, parentException) {
	if (parentException) {
		throw new Error('Error while calling ' + method + ' function of ' + tag + ': ' + (parentException.message || parentException), parentException.fileName, parentException.lineNumber);
	} else {
		parentException = tag;
		throw new Error(method + ': ' + (parentException.message || parentException), parentException.fileName, parentException.lineNumber);
	}
}

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
var identity = function identity(a) {
	return a;
};

var syntax = /\{\{\s*([^\}]+)\s*\}\}\}?/g;
var getValue = function getValue(name, data, noRun) {
	var parts = ['.'],
	    obj = data;

	if (obj[name]) {
		parts = [name];
	} else if (name.length > 1) {
		parts = name.split('.');
	}

	while (obj && parts.length > 0) {
		obj = obj[parts.shift()];
	}

	if (!noRun && isFn(obj)) {
		obj = obj.apply(data);
	}
	return obj !== undefined && obj !== null ? obj : '';
};
var handleBlock = function handleBlock(match, data, code, options, depth, startIdx) {
	var ch = match[0],
	    key = match.substr(1).trim(),
	    condition = getValue(key, data, true),
	    parsed = '',
	    result = '';

	if (ch === '^' && (!condition || condition && condition.length <= 0)) {
		condition = true;
	} else if (ch === '^') {
		condition = false;
	}

	if (condition) {
		if (!isObj(condition)) {
			condition = [condition];
		}
		for (var all in condition) {
			if (all === 'isArray') continue;
			var el = condition[all];
			parsed = parse(code, merge({}, data, el, {
				'.index': all,
				'.length': condition.length,
				'.': el
			}), options, depth, startIdx);
			if (isFn(el)) {
				try {
					result += el(parsed.content);
				} catch (e) {
					throw new Error('Unable to run condition function ' + parsed.content + ' while parsing template: ' + e.message);
				}
			} else {
				result += parsed.content;
			}
		}
	}

	if (!isObj(parsed)) {
		parsed = parse(code, data, options, depth, startIdx);
	}

	return [parsed.lastIndex, result];
};
var parse = function parse(code, data) {
	var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
	var depth = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
	var startIdx = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;

	var result = '',
	    lastPos = startIdx,
	    match = void 0,
	    key = void 0,
	    len = void 0,
	    ch = void 0,
	    transform = function transform(val) {
		return isFn(val) ? transform(val.apply(data)) : val + (typeof val === 'number' && val !== null ? data.styles && data.styles.defaultUnit || 'px' : '');
	},
	    renderStyle = function renderStyle(name) {
		var value = getValue(name, data),
		    style = '';

		if (isObj(value)) {
			for (var all in value) {
				style += all.replace(/[A-Z]/g, function (g) {
					return '-' + g.toLowerCase();
				}) + ':' + transform(value[all]) + ';';
			}
		}

		return style;
	};

	// reset regexp so that recursion works
	if (!code.match(syntax)) {
		return {
			content: code,
			lastIndex: code.length - 1
		};
	}

	while ((match = syntax.exec(code)) !== null) {
		if (match.index < lastPos) {
			continue;
		}

		result += code.substr(lastPos, match.index - lastPos);
		ch = match[1][0];
		key = match[1].substr(1).trim();
		len = match[0].length;
		lastPos = match.index + len;

		if ('#^@'.indexOf(ch) >= 0) {
			// begin of block
			var cresult = void 0;

			var _handleBlock = handleBlock(match[1], data, code, options, depth + 1, lastPos);

			var _handleBlock2 = slicedToArray(_handleBlock, 2);

			lastPos = _handleBlock2[0];
			cresult = _handleBlock2[1];

			result += cresult;
		} else if (ch === '/') {
			// end of block
			if (depth <= 0) {
				throw new Error('Unexpected end of block ' + key);
			}
			return { lastIndex: lastPos, content: result };
		} else if (ch === '>') {
			result += (options.resolvePartial || identity)(key, data);
		} else if (ch === '!') {
			// comment - don't do anything
			result += '';
		} else if (ch === '%') {
			// interpret given values separated by comma as styling
			result += key.split(/\s*,\s*/).map(renderStyle).join('');
		} else if (ch === '+') {
			var value = getValue(key, data);
			var id = (options.resolveData || identity)(key, value);
			result += '--' + id + '--';
		} else if (ch === '{') {
			// unescaped content
			result += getValue(key, data);
		} else {
			// escaped content
			result += ('' + getValue(match[1], data) || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
		}
	}
	result += code.substr(lastPos);
	if (depth > 0) {
		throw new Error('Unable to locate end of block for ' + code.substr(startIdx));
	}

	return {
		content: result,
		lastIndex: code.length - 1
	};
};

// parses mustache-like template code
var mustache = function (code, data, options) {
	var result = parse(code, data, options);
	return result && result.content || '';
};

var tagRegExp = /<(\/?)([\w-]+)([^>]*?)(\/?)>/g;
var attrRegExp = /([\w_-]+)=(?:'([^']*?)'|"([^"]*?)")/g;
var commentRegExp = /<!--(?:[^-]|-[^-])*-->/g;
var selfClosingTags = 'br,img,input,source,hr,link,meta'.split(',');

function parseAttributes(match) {
	var attributes = [];
	var attr = void 0;

	while (null !== (attr = attrRegExp.exec(match))) {
		var idx = attributes.push({ name: attr[1].toLowerCase(), value: attr[2] || attr[3] }) - 1;
		attributes[attributes[idx].name] = attributes[idx].value;
	}
	return attributes;
}

function DOM(tagName, match, parentNode) {
	var attributes = parseAttributes(match);

	// make sure all tag names are lower cased
	tagName = tagName && tagName.toLowerCase();

	return {
		tagName: tagName,
		attributes: attributes,
		children: [],
		parentNode: parentNode,
		get outerHTML() {
			var attributes = [''].concat(this.attributes.map(function (attr) {
				return attr.name + '="' + attr.value + '"';
			}));
			if (selfClosingTags.indexOf(this.tagName) >= 0) {
				return '<' + this.tagName + attributes.join(' ') + '/>';
			} else {
				return '<' + this.tagName + attributes.join(' ') + '>' + this.innerHTML + '</' + this.tagName + '>';
			}
		},
		get innerHTML() {
			var html = '';
			this.children.forEach(function (child) {
				if (child.text) {
					html += child.text;
				} else {
					html += child.outerHTML;
				}
			});
			return html;
		},
		set innerHTML(value) {
			this.children = parse$1(value).children;
		},
		get className() {
			return this.attributes['class'] || '';
		},
		getAttribute: function getAttribute(name) {
			return this.attributes[name];
		},
		setAttribute: function setAttribute(name, value) {
			this.attributes = this.attributes.filter(function (attr) {
				return attr.name !== name;
			});
			value !== null && this.attributes.push({ name: name, value: value });
			this.attributes[name] = value;
		},
		removeChild: function removeChild(ref) {
			for (var all in this.children) {
				if (this.children[all] === ref) {
					delete this.children[all]; // remove element
					return;
				}
			}
		}
	};
}
function parse$1(html) {
	var dom = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new DOM('root');

	var match = void 0,
	    lastIndex = 0,
	    currentDOM = dom;

	// remove all comments in code
	html = html.replace(commentRegExp, '').trim();
	while (null !== (match = tagRegExp.exec(html))) {
		var child = void 0;
		var _text = html.substring(lastIndex, match.index).replace(/^[ \t]+|[ \t]$/g, ' ');
		lastIndex = match.index + match[0].length;
		if (_text.length > 0) {
			// if we have any text in between the tags, add it as text node
			currentDOM.children.push({ text: _text });
		}
		if (match[1]) {
			// closing tag
			child = currentDOM;
			currentDOM = currentDOM.parentNode;
		} else {
			// opening tag
			child = new DOM(match[2], match[3], currentDOM);
			currentDOM.children.push(child);
			if (!match[4] && selfClosingTags.indexOf(child.tagName) < 0) {
				// if it's not a self-closing tag, create a nesting level
				currentDOM = child;
			}
		}
	}
	// capture the text after the last found tag
	var text = html.substr(lastIndex);
	text && dom.children.push({ text: text });

	return dom;
}

function find(selector, dom) {
	var evaluateMatch = function evaluateMatch(value, operator, expected) {
		if (!operator) return value === expected;
		if (operator === '^') return value.indexOf(expected) === 0;
		if (operator === '$') return value.lastIndexOf(expected) + expected.length === value.length;
		if (operator === '*') return value.indexOf(expected) >= 0;
		return false;
	};
	var result = [];

	// for regular Browser DOM
	if (dom && typeof dom.ownerDocument !== 'undefined') {
		return [].slice.call(dom.querySelectorAll(selector));
	}

	// for virtual DOM
	dom && dom.children.forEach(function (child) {
		var attr = void 0;
		if (child.text) return;
		if (selector[0] === '#' && child.attributes.id === selector.substr(1) || (attr = selector.match(/^\[(\w+)\]/)) && child.attributes[attr[1]] || (attr = selector.match(/^\[(\w+)(\^|\$|\*)?=(?:'([^']*)'|"([^"]*)"|([^\]])*)\]/)) && child.attributes[attr[1]] && evaluateMatch(child.attributes[attr[1]], attr[2], attr[3] || attr[4] || attr[5]) || selector[0] === '.' && child.attributes['class'] && child.attributes['class'].split(' ').indexOf(selector.substr(1)) >= 0 || child.tagName === selector.split(/\[\.#/)[0]) {
			result.push(child);
		}
		result = result.concat(find(selector, child));
	});
	return result;
}

var eventQueue = {};

function trigger(name, data) {
	if (!eventQueue[name]) return;
	for (var index in eventQueue[name]) {
		var event = eventQueue[name][index];
		var result = event(data);
		if (result === false) break;
	}
}

function on(name, fn) {
	if (!eventQueue[name]) {
		eventQueue[name] = [];
	}
	eventQueue[name].push(fn);
}

function off(name, fn) {
	if (typeof fn !== 'function') {
		delete eventQueue[name];
		return;
	}
	for (var index in eventQueue[name]) {
		if (eventQueue[name][index] === fn) {
			delete eventQueue[name][index];
			return;
		}
	}
}

function one(name, fn) {
	var _this = this,
	    _arguments = arguments;

	var _self = void 0;
	on(name, _self = function self() {
		fn.apply(_this, _arguments);
		off(name, _self);
	});
}

function attachEvent(el, events, host) {
	if (typeof el.addEventListener !== 'function') return;
	events.forEach(function (eventObj) {
		Object.keys(eventObj.handlers).forEach(function (event) {
			el.addEventListener(event, function (e) {
				if (find(eventObj.selector, el).indexOf(e.target) >= 0) {
					e.target.getHost = function () {
						return host.getHost();
					};
					eventObj.handlers[event].call(e.target, e);
				}
			}, false);
		});
	});
}

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
		}
		var subEvents = renderTag(tag);
		attachSubEvents(subEvents, tag);
	}
};

var renderOptions = {
	resolveData: function resolveData(key, value) {
		var id = uuid();
		dataRegistry[id] = value;
		return id;
	}
};

function registerTag(code, path, document) {
	var firstElement = parse$1(code).children[0],
	    tagName = firstElement.tagName,
	    functions = void 0;

	// clean up path
	path = path.replace(/[^\/]+$/g, '');
	// remove recursive tag use and all style/script nodes
	code = code.replace(new RegExp('<\\/?' + tagName + '(?:\s+[^>]+)?>', 'ig'), '').replace(/<(style|script)[^>]*>(?:[^\s]|[^\S])*?<\/\1>/g, '');
	firstElement.code = code;

	if (tagRegistry[tagName]) {
		// tag is already registered
		return;
	}

	handleStyles(firstElement);
	functions = handleScripts(firstElement, path);
	tagRegistry[tagName] = { functions: functions, code: code, path: path, tagName: tagName };

	// initialize all occurences in provided context
	document && find(tagName, document).forEach(function (tag) {
		return initializeTag(tag, tagRegistry[tagName]);
	});
}

function mount(tag, ignoreRender) {
	if (!tag.tagName) return;
	var entry = tagRegistry[tag.tagName.toLowerCase()];
	if (!entry || tag.getAttribute('__ready')) return;
	if (ignoreRender === true) entry.functions.render = emptyFunc;
	return initializeTag.call({ noEvents: true }, tag, entry);
}



function initializeTag(tag, registryEntry) {
	// check if the tag has been initialized already
	if (tag['__s'] || !registryEntry) return;
	var functions = registryEntry.functions;

	// copy all defined functions/attributes
	for (var all in functions) {
		var entry = functions[all];
		if (['mount', 'unmount', 'events', 'render'].indexOf(all) < 0) {
			if (typeof entry === 'function') {
				tag[all] = entry.bind(tag);
			} else {
				tag[all] = entry;
			}
		}
	}
	// if it has been pre-rendered
	if (tag.children.length > 0 && tag.children[0].className === '-shadow-root') {
		var sibling = tag.children[1];
		// remove original HTML content
		if (sibling && sibling.className === '-original-root') {
			tag.__i = sibling.innerHTML;
			setElementAttr(sibling, tag);
			sibling.parentNode.removeChild(sibling);
		}
		tag.isRendered = true;
	} else {
		tag.__i = tag.innerHTML;
		setElementAttr(tag);
		tag.innerHTML = '<div class="-shadow-root"></div>';
	}
	// define basic properties
	Object.defineProperty(tag, 'body', {
		set: function set(val) {
			tag.__i = val;
			setElementAttr(tag);
			renderTag(tag);
		},
		get: function get() {
			return tag.__i;
		}
	});
	tag.__s = tag.__s || tag.setAttribute;
	tag.setAttribute = function (attr, val) {
		tag.__s(attr, val);
		renderTag(tag);
	};

	// call mount callback
	tag.props = merge({}, functions.props, getAttributes(tag, true));
	try {
		functions.mount.call(tag);
	} catch (e) {
		error$1('mount', tag.tagName, e);
	}

	// render the tag's content
	var subEvents = renderTag.call(this, tag);

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
	if (!this || this.noEvents !== true) {
		// attach sub events
		attachSubEvents(subEvents, tag);
	} else {
		return subEvents;
	}
}

function renderTag(tag) {
	var registryEntry = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : tagRegistry[tag.tagName.toLowerCase()];

	var events = [],
	    renderCallbacks = [];

	// do the actual rendering of the component
	var data = getAttributes(tag);
	var renderedHTML = mustache(registryEntry.code, data, renderOptions);
	var renderedDOM = parse$1(renderedHTML);

	// render all contained sub components

	var _loop = function _loop(all) {
		find(all, renderedDOM).forEach(function (subEl) {
			var subElEvents = initializeTag.call({
				noRenderCallback: true,
				noEvents: true
			}, subEl, tagRegistry[all]);
			events = events.concat(subElEvents.events);
			renderCallbacks = renderCallbacks.concat(subElEvents.renderCallbacks);
		});
	};

	for (var all in tagRegistry) {
		_loop(all);
	}

	// unmount all existing sub tags
	find('[__ready]', tag).forEach(unmountTag);
	var renderedSubElements = find('[__ready]', renderedDOM);
	// simply render everything inside
	tag.children[0].innerHTML = renderedDOM.innerHTML;
	renderedSubElements.length > 0 && find('[__ready]', tag).forEach(function (subEl, index) {
		merge(subEl, renderedSubElements[index]);
		renderedSubElements[index].getHost = defaultFunctions.getHost.bind(subEl);
	});

	if (!tag.attributes.__ready) {
		tag.__s('__ready', true);
	}

	if (!this || !this.noRenderCall) {
		renderCallbacks.forEach(function (callback) {
			return callback();
		});
		registryEntry.functions.render.call(tag);
	} else {
		renderCallbacks.push(registryEntry.functions.render.bind(tag));
	}
	return { events: events, renderCallbacks: renderCallbacks, data: data };
}

function attachSubEvents(subEvents, tag) {
	var count = {};
	subEvents.events.forEach(function (event) {
		var el = event.tag;
		if (!isObj(el)) {
			count[el] = (count[el] || 0) + 1;
			el = find(el, tag)[count[el] - 1];
		}
		attachEvent(el.children[0], event.childEvents, el);
		attachEvent(el, event.hostEvents, el);
		isFn(el.onready) && el.onready();
	});
}

function unmountTag(tag) {
	var name = (tag.tagName || '').toLowerCase(),
	    entry = tagRegistry[name];
	if (entry) {
		[].forEach.call(tag.attributes, function (attr) {
			// cleanup saved data
			if (attr.name.indexOf('data-') >= 0) {
				delete dataRegistry[attr.value];
			}
		});
		try {
			entry.functions.unmount.call(tag);
		} catch (e) {
			error$1('Unable to unmount tag ' + name, e);
		}
	}
}

function getAttributes(tag, propsOnly) {
	var attrs = { props: tag.props, element: tag.element, styles: tag.styles, body: tag.__i },
	    props = {};

	[].forEach.call(tag.attributes, function (attribute) {
		var isComplex = attribute.name.indexOf('data-') >= 0 && attribute.value.substr(0, 2) === '--';
		attrs[attribute.name] || (attrs[attribute.name] = isComplex ? dataRegistry[attribute.value.replace(/^--|--$/g, '')] : attribute.value);
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
		if (el.text) return;
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
	find('link', element).forEach(function (link) {
		if (link.attributes.type === 'stylesheet') {
			link.attributes.id = tagName + '-external-styles';
			trigger('publish-style', link);
		}
	});
	trigger('publish-style', find('style', element).map(function (style) {
		var code = style.children[0].text.replace(/<br>/g, '');
		return code.replace(/[\r\n]*([^@%\{;\}]+?)\{/gm, function (global, match) {
			var selectors = match.split(',').map(function (selector) {
				selector = selector.trim();
				if (selector.match(/:host\b/) || selector.match(new RegExp('^\\s*' + tagName + '\\b')) || selector.match(/^\s*(?:(?:\d+%)|(?:from)|(?:to)|(?:@\w+)|\})\s*$/)) {
					return selector;
				}
				return tagName + ' ' + selector;
			});
			return global.replace(match, selectors.join(','));
		}).replace(/:host\b/gm, tagName) + '\n';
	}).join('\n'));
}

function handleScripts(element, path) {
	var functions = merge({}, defaultFunctions);
	find('script', element).forEach(function (script) {
		var text = script.children.length > 0 && script.children[0].text.trim();
		if (script.attributes.src) {
			return trigger('publish-script', script);
		}
		try {
			text = text.replace(/\bZino\.import\s*\(/g, 'Zino.import.call({path: "' + path + '"}, ').replace(/;$/g, '');
			merge(functions, new Function('return ' + text)());
		} catch (e) {
			error$1('parse script ' + text + ' in tag ' + element.tagName, e);
		}
	});
	return functions;
}

on('--zino-unmount-tag', unmountTag);
on('--zino-mount-tag', mount);

var urlRegistry = {};
var Zino = void 0;
var tagObserver = new MutationObserver(function (records) {
	records.forEach(function (record) {
		var added = record.addedNodes,
		    removed = record.removedNodes;

		if (added.length > 0) {
			[].forEach.call(added, function (tag) {
				(tag.children && find('*', tag) || []).concat(tag).forEach(function (subTag) {
					return trigger('--zino-mount-tag', subTag);
				});
			});
		} else if (removed.length > 0) {
			[].forEach.call(removed, function (tag) {
				(tag.children && find('[__ready]', tag) || []).concat(tag).forEach(function (subTag) {
					return trigger('--zino-unmount-tag', subTag);
				});
			});
		}
	});
});

var zino = Zino = {
	on: on, one: one, off: off, trigger: trigger,

	fetch: function fetch(url, callback, cache) {
		if (cache && urlRegistry[url] && !urlRegistry[url].callback) {
			return callback(urlRegistry[url]);
		} else if (isObj(urlRegistry[url])) {
			return urlRegistry[url].callback.push(callback);
		}
		urlRegistry[url] = {
			callback: [callback]
		};
		var req = new XMLHttpRequest();
		req.open('GET', url, true);
		req.onreadystatechange = function () {
			if (req.readyState === 4) {
				var callbacks = urlRegistry[url].callback;
				if (req.status === 200 && cache) {
					urlRegistry[url] = req.responseText;
				}
				if (!cache) delete urlRegistry[url];
				callbacks.forEach(function (cb) {
					return cb(req.responseText);
				});
			}
		};
		req.send();
	},
	import: function _import(path) {
		var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : emptyFunc;

		var url = (this.path || '') + path;
		Zino.fetch(url, function (data) {
			registerTag(data, url, document.body);
			callback();
		}, true);
	}
};

on('publish-style', function (data) {
	if (typeof data === 'string' && data.length > 0) {
		var style = document.createElement('style');
		style.innerHTML = data;
		data = style;
	}
	data && document.head.appendChild(data);
});
on('publish-script', document.head.appendChild);
trigger('publish-style', '[__ready] { contain: content; }');
find('[rel="zino-tag"]', document).forEach(function (tag) {
	return Zino.import(tag.href);
});
tagObserver.observe(document.body, {
	subtree: true,
	childList: true
});

return zino;

})));
//# sourceMappingURL=zino.js.map
