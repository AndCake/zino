var Zino = (function () {
'use strict';

var tagRegExp = /<(\/?)([\w-]+)([^>]*?)(\/?)>/g;
var attrRegExp = /([\w_-]+)=(?:'([^']*?)'|"([^"]*?)")/g;
var commentRegExp = /<!--(?:[^-]|-[^-])*-->/g;
var selfClosingTags = 'br,img,input,source,hr,link,meta,wainclude'.split(',');

function parseAttributes(match) {
	var attributes = [];
	var attr = void 0;

	while (attr = attrRegExp.exec(match)) {
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
			return this.children.map(function (child) {
				return child.text || child.outerHTML;
			}).join('');
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
			var _this = this;

			if (this.attributes[name] !== value) {
				this.attributes = this.attributes.filter(function (attr) {
					return attr.name !== name;
				});
				value !== null && this.attributes.push({ name: name, value: value });
				this.attributes.forEach(function (attr, idx) {
					return _this.attributes[_this.attributes[idx].name] = _this.attributes[idx].value;
				});
			}
		},
		removeChild: function removeChild(ref) {
			for (var all in this.children) {
				if (this.children[all] === ref) {
					delete this.children[all]; // remove element
					break;
				}
			}
		},
		cloneNode: function cloneNode() {
			var clone = DOM(this.tagName, '', this.parentNode);
			this.attributes.forEach(function (attr) {
				return clone.setAttribute(attr.name, attr.value);
			});
			this.children.forEach(function (child) {
				return clone.children.push(child.cloneNode());
			});
			return clone;
		}
	};
}

function Text(text, parentNode) {
	var content = text;
	return {
		get text() {
			return content;
		},
		set text(value) {
			content = value;
		},
		parentNode: parentNode,
		cloneNode: function cloneNode() {
			return Text(content, this.parentNode);
		}
	};
}

function parse$1(html) {
	var dom = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DOM('root');

	var match = void 0,
	    lastIndex = 0,
	    currentDOM = dom;

	// remove all comments in code & clean up scripts
	html = html.replace(commentRegExp, '').replace(/<(script|style)[^>]*?>((?:.|\n)*?)<\/\1>/g, function (g, x, m) {
		return g.replace(m, m.replace(/(['"])(.*?)\1/g, function (g, m1, m2) {
			return m1 + m2.replace(/</g, '\\x3c') + m1;
		}));
	}).trim();
	while (null !== (match = tagRegExp.exec(html))) {
		var child = void 0;
		var _text = html.substring(lastIndex, match.index).replace(/^[ \t]+|[ \t]$/g, ' ');
		lastIndex = match.index + match[0].length;
		if (_text.length > 0) {
			// if we have any text in between the tags, add it as text node
			currentDOM.children.push(Text(_text, currentDOM));
		}
		if (match[1]) {
			// closing tag
			child = currentDOM;
			currentDOM = currentDOM.parentNode;
		} else {
			// opening tag
			child = DOM(match[2], match[3], currentDOM);
			currentDOM.children.push(child);
			if (!match[4] && selfClosingTags.indexOf(child.tagName) < 0) {
				// if it's not a self-closing tag, create a nesting level
				currentDOM = child;
			}
		}
	}
	// capture the text after the last found tag
	var text = html.substr(lastIndex);
	text && dom.children.push(Text(text, dom));

	return dom;
}

function find(selector, dom) {
	var result = [];

	// for regular Browser DOM
	if (dom && typeof dom.ownerDocument !== 'undefined') {
		return [].slice.call(dom.querySelectorAll(selector));
	}

	// for virtual DOM
	dom && dom.children.forEach(function (child) {
		var attr = void 0;
		if (typeof child.text !== 'undefined') return;
		if (selector[0] === '#' && child.attributes.id === selector.substr(1) || (attr = selector.match(/^\[(\w+)\]/)) && child.attributes[attr[1]] || selector[0] === '.' && child.className.split(' ').indexOf(selector.substr(1)) >= 0 || child.tagName === selector.split(/\[\.#/)[0]) {
			result.push(child);
		}
		result = result.concat(find(selector, child));
	});
	return result;
}

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













var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
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
				target[all] = arg[all];
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
function objectDiff(objA, objB) {
	var result = {},
	    partialDiff = void 0;

	if (!objA) return objB || false;
	if (!objB) return objA || false;
	Object.keys(objA).forEach(function (key, index) {
		if (['__vdom', 'element', 'parentNode', 'innerHTML', 'outerHTML', 'className'].indexOf(key) >= 0 || isFn(objA[key])) return;
		if (typeof objB[key] === 'undefined') {
			result[key] = objA[key];
		} else if (Object.keys(objB)[index] !== key) {
			var bKey = Object.keys(objB)[index];
			result[bKey] = objB[bKey];
			result[key] = objA[key];
		} else if (_typeof(objA[key]) !== 'object' || _typeof(objB[key]) !== 'object') {
			if (objA[key] !== objB[key]) {
				result[key] = objB[key];
			}
		} else if (partialDiff = objectDiff(objA[key], objB[key])) {
			result[key] = partialDiff;
		}
	});
	Object.keys(objB).forEach(function (key, index) {
		if (['__vdom', 'element', 'parentNode', 'innerHTML', 'outerHTML', 'className'].indexOf(key) >= 0 || isFn(objB[key])) return;
		if (typeof objA[key] === 'undefined') {
			result[key] = objB[key];
		}
	});
	if (Object.keys(result).length > 0) return result;
	return false;
}

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

function isValue(obj, key) {
	var descriptor = Object.getOwnPropertyDescriptor(obj, key);
	return typeof descriptor.value !== 'undefined' && !isFn(descriptor.value);
}

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
			parsed = parse$2(code, merge({}, data, el, {
				'.index': all,
				'.length': condition.length,
				'.': el
			}), merge({ key: key, condition: condition }, options), depth, startIdx);
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
		parsed = parse$2(code, data, merge({ key: key, condition: condition }, options), depth, startIdx);
	}

	return [parsed.lastIndex, result];
};
var parse$2 = function parse(code, data) {
	var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
	var depth = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
	var startIdx = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;

	var result = '',
	    lastPos = startIdx,
	    lastBlock = '',
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

	while (match = syntax.exec(code)) {
		if (match.index < lastPos) {
			continue;
		}

		result += code.substr(lastPos, match.index - lastPos);
		ch = match[1][0];
		key = match[1].substr(1).trim();
		len = match[0].length;
		lastPos = match.index + len;

		if ('#^'.indexOf(ch) >= 0) {
			// begin of block
			var cresult = void 0;
			lastBlock = [key, lastPos, match.index];

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
		} /* else if (ch === '>') {	// removed support for partials since it's never used...
    result += (options.resolvePartial || identity)(key, data);
    }*/else if (ch === '!') {
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
		throw new BlockEndError(options.key, startIdx, result, data, options.condition);
	}

	return {
		content: result,
		lastIndex: code.length - 1
	};
};

// parses mustache-like template code
var mustache = function (code, data, options) {
	var result = parse$2(code, data, options);
	return result && result.content || '';
};

function BlockEndError(block, position, result, data, condition) {
	this.message = 'Unable to locate end of block ' + block;
	this.block = block;
	this.result = result;
	this.data = data;
	this.position = position;
	this.condition = condition;
	this.name = 'BlockEndError';
}

function handleElement(element, data, options) {
	if (typeof element.text !== 'undefined') {
		element.text = mustache(element.text, data);
		return;
	}
	element.attributes.forEach(function (attr) {
		element.setAttribute(attr.name, mustache(attr.value, data, options));
	});

	var _loop = function _loop(_idx, _len, child) {
		if (typeof child.text !== 'undefined') {
			try {
				//if (data.test === false) { debugger; }
				child.text = mustache(child.text, data);
			} catch (e) {
				if (e.name === 'BlockEndError') {
					var index = _idx + 1;
					var endBlock = new RegExp('{{\\s*/' + e.block + '\\s*}}', 'g');
					var match = null;
					while (element.children[index]) {
						if (element.children[index].text) {
							match = element.children[index].text.match(endBlock);
							if (match) break;
						}
						index += 1;
					}
					if (match) {
						// found it!

						// create copy of current node
						var blockStart = [child.cloneNode()];
						blockStart[0].text = blockStart[0].text.substr(e.position);

						var blockEnd = [element.children[index].cloneNode()];
						blockEnd[0].text = blockEnd[0].text.split(match[0])[0];

						// remove block start from current node
						child.text = child.text.substr(0, e.position - (e.block.length + 5));
						// remove block end from end node
						element.children[index].text = element.children[index].text.split(match[0]).pop();

						// create list of contents
						var list = element.children.slice(_idx + 1, index);
						list = (blockStart[0].text.length > 0 ? blockStart : []).concat(list, blockEnd[0].text.length > 0 ? blockEnd : []);

						// remove existing elements
						element.children.splice(_idx + 1, index - (_idx + 1));

						// handle block
						if (e.condition !== false) {
							if (_typeof(e.condition) !== 'object') {
								e.condition = [e.condition];
							}

							var _loop2 = function _loop2(all) {
								var _element$children;

								var newList = list.map(function (el, index) {
									var xData = merge({}, e.data, e.condition[all], { '.index': all, '.length': e.condition.length, '.': e.condition[all] });
									el = el.cloneNode();
									handleElement(el, xData);
									return el;
								});
								(_element$children = element.children).splice.apply(_element$children, [_idx + 1, 0].concat(toConsumableArray(newList)));
								_idx += list.length;
							};

							for (var all in e.condition) {
								_loop2(all);
							}
						}

						_len = element.children.length;
						handleElement(element.children[_idx + 1], data);
					}
				}
			}
		} else {
			// a regular tag
			child.attributes.forEach(function (attr) {
				child.setAttribute(attr.name, mustache(attr.value, data, options));
			});
			handleElement(child, data);
		}
		idx = _idx;
		len = _len;
	};

	for (var idx = 0, len = element.children.length, child; child = element.children[idx], idx < len; idx += 1) {
		_loop(idx, len, child);
	}
}

function cleanTextNodes(node) {
	if (node.children) {
		node.children.forEach(function (child, idx, list) {
			if (child.children) {
				cleanTextNodes(child);
			} else if (typeof child.text !== 'undefined') {
				var indexDiff = 1;
				while (list[idx + indexDiff] && !list[idx + indexDiff].children && typeof list[idx + indexDiff].text !== 'undefined') {
					child.text += list[idx + indexDiff].text;
					indexDiff += 1;
				}
				list.splice(idx + 1, indexDiff - 1);
			}
		});
	}
}

function parse$$1(code, options) {
	var dom = parse$1(code);
	return function (data) {
		var clone = dom.cloneNode();
		handleElement(clone, data, options);
		cleanTextNodes(clone);
		return clone;
	};
}

function applyDOM(target, src, newSrc) {
	var context = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';

	var removed = 0;
	Object.keys(src).forEach(function (key) {
		if (!isValue(src, key) || key === 'parentNode' || key === 'tagName') return;
		var isNode = target instanceof Node || target[key] instanceof Node;
		var isComplex = isObj(src[key]);
		if (typeof document !== 'undefined' && isComplex && isNode) {
			// is complex and node
			if (typeof target[key] === 'undefined') {
				// does not exist in target
				if (context === 'attributes') {
					// has to be ignored
				} else {
					if (!newSrc[key]) {
						// does not exist in new version, remove it
						if (target.childNodes[key - removed]) {
							target.removeChild(target.childNodes[key - removed]);
							removed++;
						}
					} else if (typeof src[key].tagName !== 'undefined' && typeof newSrc[key].tagName !== 'undefined') {
						// is new tag
						var tag = document.createElement('i');
						tag.innerHTML = newSrc[key].outerHTML;
						key = parseInt(key, 10);
						if (target.childNodes[key]) {
							target.replaceChild(tag.children[0], target.childNodes[key]);
						} else {
							if (key >= target.childNodes.length) {
								target.appendChild(tag.children[0]);
							} else {
								target.insertBefore(tag.children[0], target.childNodes[key]);
							}
						}
					} else if (context === 'children' && src[key].children && typeof newSrc[key].children !== 'undefined') {
						// investigate children
						applyDOM(target.childNodes[key], src[key], newSrc[key] || newSrc, context);
					} else if (context === 'children' && typeof src[key].text !== 'undefined') {
						// is text
						var text = document.createTextNode(src[key].text);
						key = parseInt(key, 10);
						if (target.childNodes[key]) {
							target.replaceChild(text, target.childNodes[key]);
						} else {
							if (key >= target.childNodes.length) {
								target.appendChild(text);
							} else {
								target.insertBefore(text, target.childNodes[key]);
							}
						}
					} else if (context === 'children' && src[key].attributes) {
						// is attribute change
						applyDOM(target.childNodes[key], src[key], newSrc[key] || newSrc, context);
					} else {
						// is neither of all, just copy
						target[key] = src[key];
					}
				}
			} else {
				// target key exists
				if (context === 'children' && 1 * key >= 0) {
					// checkout the child', key, src, target
					applyDOM(target.childNodes[1 * key], src[key], newSrc[key] || newSrc, context);
				} else if (key === 'children' || key === 'attributes') {
					// Found children
					applyDOM(target, src[key], newSrc[key] || newSrc, ['children', 'attributes'].indexOf(context) >= 0 && key !== 'attributes' ? context : key);
				} else {
					// Found sth else
					applyDOM(target[key], src[key], newSrc[key] || newSrc, ['children', 'attributes'].indexOf(context) >= 0 && key !== 'attributes' ? context : key);
				}
			}
		} else {
			// no complex or no node
			if (context === 'attributes') {
				// set attribute
				isFn(target.setAttribute) && target.setAttribute(key, src[key]);
			} else {
				// copy it over
				target[key] = src[key];
			}
		}
	});
}

var eventQueue = {};

function trigger(name, data) {
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
}

function off(name, fn) {
	if (!isFn(fn)) {
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
	on(name, function self() {
		fn.apply(this, arguments);
		off(name, self);
	});
}

function attachEvent(el, events, host) {
	if (!isFn(el.addEventListener)) return;
	var findEl = function findEl(selector, target) {
		var node = find(selector, el);
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
		if (!tag.mounting) {
			trigger('--zino-rerender-tag', tag);
		}
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
	code = parse$$1(code, renderOptions);

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
	var functions = registryEntry.functions,
	    isRendered = void 0;

	// copy all defined functions/attributes
	for (var all in functions) {
		var entry = functions[all];
		if (['mount', 'unmount', 'events', 'render'].indexOf(all) < 0) {
			if (isFn(entry)) {
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
		isRendered = true;
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
			trigger('--zino-rerender-tag', tag.getHost());
		},
		get: function get() {
			return tag.__i;
		}
	});
	tag.__s = tag.setAttribute;
	tag.setAttribute = function (attr, val) {
		this.__s(attr, val);
		trigger('--zino-rerender-tag', this);
	};

	tag.__vdom = {};
	// call mount callback
	tag.props = merge({}, functions.props, getAttributes(tag, true));
	try {
		tag.mounting = true;
		functions.mount.call(tag);
		delete tag.mounting;
	} catch (e) {
		error$1('mount', tag.tagName, e);
	}

	// render the tag's content
	var subEvents = !isRendered && renderTag.call(this, tag) || { events: [] };

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
		tag.__s('__ready', true);
	}
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
	var renderedDOM = registryEntry.code(data);
	renderedDOM.tagName = 'div';
	renderedDOM.setAttribute('class', '-shadow-root');

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
	if (tag.attributes.__ready && tag.ownerDocument) {
		// has been rendered before, so just apply diff
		var diff = objectDiff(tag.__vdom, renderedDOM);
		if (diff !== false) {
			applyDOM(tag.children[0], diff, renderedDOM);
		}
	} else {
		// simply render everything inside
		tag.children[0].innerHTML = renderedDOM.innerHTML;
	}
	tag.__vdom = renderedDOM;

	renderedSubElements.length > 0 && find('[__ready]', tag).forEach(function (subEl, index) {
		merge(subEl, renderedSubElements[index]);
		renderedSubElements[index].getHost = defaultFunctions.getHost.bind(subEl);
		subEl.setAttribute = function (attr, val) {
			HTMLElement.prototype.setAttribute.call(subEl, attr, val);
			trigger('--zino-rerender-tag', subEl);
		};
	});

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
		if (!el.children[0].__eventsAttached) {
			attachEvent(el.children[0], event.childEvents, el);
			attachEvent(el, event.hostEvents, el);
			el.children[0].__eventsAttached = true;
		}
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
	find('link', element).forEach(function (link) {
		if (link.attributes.type === 'stylesheet') {
			trigger('publish-style', link);
		}
	});
	trigger('publish-style', find('style', element).map(function (style) {
		var code = style.innerHTML.replace(/<br>/g, '');
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
		var text = script.innerHTML.trim();
		if (script.attributes.src) {
			return trigger('publish-script', script);
		}
		try {
			text = text.replace(/\bZino\.import\s*\(/g, 'Zino.import.call({path: "' + path + '"}, ');
			merge(functions, new Function('return ' + text)());
		} catch (e) {
			error$1('parse script ' + text + ' in tag ' + element.tagName, e);
		}
	});
	return functions;
}

on('--zino-unmount-tag', unmountTag);
on('--zino-mount-tag', mount);

var urlRegistry = window.zinoTagRegistry || {};
var Zino = void 0;
var dirtyTags = [];
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

	fetch: function fetch(url, callback, cache, code) {
		if (cache && urlRegistry[url] && !urlRegistry[url].callback) {
			return callback(urlRegistry[url]);
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
window.Zino = Zino;
on('publish-style', function (data) {
	if (typeof data === 'string' && data.length > 0) {
		var style = document.createElement('style');
		style.innerHTML = data;
		data = style;
	}
	data && document.head.appendChild(data);
});
on('publish-script', document.head.appendChild);
on('--zino-rerender-tag', function (tag) {
	return dirtyTags.indexOf(tag) < 0 && dirtyTags.push(tag);
});
trigger('publish-style', '[__ready] { contain: content; }');
find('[rel="zino-tag"]', document).forEach(function (tag) {
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
