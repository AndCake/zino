// zino.js
/**
	This library enables you to use custom tags, similar to web components, without any additional polyfills.

	Importing custom tags on page via:

		<link type="zino/tag" href="..."/>

	Properties

	events
	props
	render
	mount
	unmount
	styles
	setProps
	...

	Exports:

		- import(url[, callback[, props]])
			- url - URL to load the element from, if not loaded yet
			- callback - callback function to call when the tag has been loaded

		- trigger(event[, data])
			- event - name of the event to trigger
			- data - data to send with the event (optional)

			Triggers the given event

		- on(event, callback)
			- event - name of the event to listen for
			- callback - callback function to call when the event is triggered

			Listens for the given event and calls the callback for every occurrence.
			Any data sent with the trigger will be directly given into the callback.

		- one(event, callback)
			- event - name of the event to listen for
			- callback - callback function to call when the event is triggered

			Listens for the given event and calls the callback only for the first
			occurrence. Any data sent with the trigger will be directly given into
			the callback.

		- off(event, callback)
			- event - name of the event to listen for
			- callback - function to remove as event listener

			Removes the event listener for the given event

		- fetch(url, callback)
			- url - from where to fetch some content/data?
			- callback(data, err) - function to call once successful

			Do a very simple AJAX call (supports only GET). The response body will
			be handed into the callback function as data. If an error occurs, the err parameter will be filled with the server's response status code.
*/
(function(exports, win, doc) {
	'use strict';

	var tagLibrary = {},

		// read utilities
		utils 		= (function(module) {
	var urlLibrary = {};
	return module.exports = {

		// merges any objects given into the function
		merge: function() {
			var args = arguments,
				target = args[0];

			[].slice.call(args, 1).forEach(function(arg) {
				for (var all in arg) {
					target[all] = arg[all];
				}
			});

			return target;
		},

		// returns an array of elements that match the given selector in the given context
		domQuery: function(selector, context) {
			return [].slice.call((context || doc).querySelectorAll(selector));
		},

		// simplified GET AJAX request
		fetch: function(url, callback, cache) {
			if (cache && urlLibrary[url] && !urlLibrary[url].cb) {
				return callback(urlLibrary[url]);
			} else if (typeof urlLibrary[url] === 'object') {
				return urlLibrary[url].cb.push(callback);
			}
			urlLibrary[url] = {
				cb: [callback]
			};
			var req = new XMLHttpRequest();
			req.open('GET', url, true);
			req.onreadystatechange = function() {
				if (req.readyState === 4) {
					var callbacks = urlLibrary[url].cb;
					if (req.status === 200 && cache) {
						urlLibrary[url] = req.responseText;
					}
					if (!cache) delete urlLibrary[url];
					for (var all in callbacks) {
						callbacks[all](req.responseText);
					}
				}
			};
			req.send();
		},

		error: function(method, tag, parentException) {
			if (parentException) {
				throw new Error('Error while calling ' + method + ' function of ' + tag + ': ' + parentException.message, parentException.fileName, parentException.lineNumber);
			} else {
				parentException = tag;
				throw new Error(method + ': ' + parentException.message, parentException.fileName, parentException.lineNumber);
			}
		},

		checkParams: function(args, types, api) {
			for (var all in args) {
				if (types[all] && typeof args[all] !== types[all]) {
					throw new Error('API mismatch while using ' + api + ': Parameter ' + all + ' was supposed to be ' + types[all] + ' but ' + (typeof args[all]) + ' was given.');
				}
			}
		},

		safeAccess: function(obj) {
			return obj || {};
		},

		emptyFunc: function(){}
	};
}(typeof window === 'undefined' ? module : {}))
,
		$ 			= utils.domQuery,
		merge 		= utils.merge,
		fetch 		= utils.fetch,
		_ 			= utils.safeAccess,
		emptyFunc 	= utils.emptyFunc,
		checkParams = utils.checkParams,
		error 		= utils.error,

		// retrieves all attributes that can be used for rendering
		getAttributes 	= (function(module) {
	'use strict';

	return module.exports = function(tag, propsOnly) {
		var attrs = {props: tag.props, element: tag.element, styles: tag.styles, body: tag['__i']},
			props = {};

		[].slice.call(tag.attributes).forEach(function(attribute) {
			var isComplex = attribute.name.indexOf('data-') >= 0 && attribute.value.substr(0, 2) === '--' && Zino.__data;
			attrs[attribute.name] || (attrs[attribute.name] = isComplex ? Zino.__data[attribute.value.replace(/^--|--$/g, '')] : attribute.value);
			if (isComplex) {
				props[attribute.name.replace(/^data-/g, '').replace(/(\w)-(\w)/g, function(g, m1, m2) {
					return m1 + m2.toUpperCase();
				})] = attrs[attribute.name];
			}
		});

		if (propsOnly) return props;

		return attrs;
	};
}(typeof window === 'undefined' ? module : {}))
,
		parser 			= (function(module, Zino) {
	// PARSER.JS
	'use strict';
	var syntax = /\{\{\s*([^\}]+)\s*\}\}\}?/g,
		merge = 0,
		identity = function(a) { return a; },
		uuid = function(c) { var r = Math.random() * 16 | 0; return (c == 'x' ? r : r & 0x3 | 0x8).toString(16); },
		partial = identity,
		isFn = function(obj) { return typeof obj === 'function'; },
		isObj = function(obj) { return typeof obj === 'object'; },

		getValue = function(name, data, noRun) {
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
		},

		parse = function(code, data, depth, startIdx) {
			var result = '',
				lastPos = startIdx || 0,
				match, key, condition, parsed, len, ch,

				renderStyle = function(name) {
					var value = getValue(name, data),
						style = '',

						transform = function(val) {
							if (typeof val === 'number' && val !== 0) {
								return val + (data.styles && data.styles.defaultUnit || 'px');
							}
							if (isFn(val)) {
								return transform(val.apply(data));
							}
							return val;
						};

					if (isObj(value)) {
						for (var all in value) {
							style += all.replace(/[A-Z]/g, function(g) { return '-' + g.toLowerCase(); }) + ':' + transform(value[all]) + ';';
						}
					}

					return style;
				};

			depth = depth || 0;
			startIdx = startIdx || 0;

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

				if ('#^@'.indexOf(ch) >= 0) {
					// begin of block
					condition = getValue(key, data, true);
					if (ch === '^' && (!condition || condition && condition.length <= 0)) {
						condition = true;
					} else if (ch === '^') {
						condition = false;
					}

					parsed = '';

					if (condition) {
						if (!isObj(condition)) {
							condition = [condition];
						}
						for (var all in condition) {
							if (all === 'isArray') continue;
							var el = condition[all];
							parsed = parse(
									code,
									merge({}, data, el, {
										'.index': all,
										'.length': condition.length,
										'.': el
									}),
									depth + 1,
									match.index + len
								);
							if (isFn(el)) {
								try {
									result += el(parsed.content);
								} catch (e) {
									throw 'Unable to run condition function ' + parsed.content + ' while parsing template: ' + e.message;
								}
							} else {
								result += parsed.content;
							}
						}
					}

					if (!isObj(parsed)) {
						parsed = parse(code, data, depth + 1, match.index + len);
					}

					lastPos = parsed.lastIndex;
					continue;
				} else if (ch === '/') {
					// end of block
					if (depth <= 0) {
						throw 'Unexpected end of block ' + match[1].substr(1);
					}
					return {lastIndex: len + match.index, content: result};
				} else if (ch === '>') {
					result += partial(key, data);
				} else if (ch === '!') {
					// comment - don't do anything
					result += '';
				} else if (ch === '%') {
					// interpret given values separated by comma as styling
					result += key.split(/\s*,\s*/).map(renderStyle).join(';');
				} else if (ch === '+') {
					var value = getValue(key, data);
					var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, uuid.bind({data:value}));
					if (!Zino.__data) Zino.__data = {};
					Zino.__data[id] = value;
					result += '--' + id + '--';
				} else if (ch === '{') {
					// unescaped content
					result += getValue(key, data);
				} else {
					// escaped content
					result += ('' + getValue(match[1], data) || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
				}

				lastPos = match.index + len;
			}
			result += code.substr(lastPos);
			return {
				content: result,
				lastIndex: code.length - 1
			}
		};

	// parses mustache-like template code
	module.exports = function(code, data, mergeFn) {
		merge = mergeFn || function(){};
		var result = parse(code, data);
		return result && result.content || '';
	};
	module.exports.loadPartial = function(fn) {
		partial = fn || identity;
	};
	module.exports.setZino = function(zino) {
		Zino = zino;
	};
	module.exports.setUUID = function(fn) {
		uuid = fn;
	};
	return module.exports;
}.apply(null, typeof window === 'undefined' ? [module, {}] : [{}, window.Zino]))
,
		loader 			= (function(module) {
	'use strict';

	var emptyFunc = function(){};

	return module.exports = {
		/* requires link to be an array or null */
		/* requires styles to be an array or null */
		handleStyles: function(tagName, styles) {
			return (styles || []).map(function(style) {
				var code = style.innerHTML;
				if (style.parentNode && typeof style.parentNode.removeChild === 'function') style.parentNode.removeChild(style);
				return code.replace(/[\r\n]+([^@%\{;\}]+?)\{/gm, function (g, m) {
					var selectors = m.split(',').map(function (selector) {
						selector = selector.trim();
						if (selector.match(/:host\b/) || selector.match(new RegExp('^\\s*' + tagName + '\\b'))) { return selector; }
						if (selector.match(/^\s*(?:(?:\d+%)|(?:from)|(?:to)|(?:@\w+)|\})\s*$/)) {
							return selector;
						}
						return tagName + ' ' + selector;
					});
					return g.replace(m, selectors.join(','));
				}).replace(/:host\b/gm, tagName) + '\n';
			}).join('\n');
		},

		handleScripts: function(tagName, scripts, externalAction, setProps, merge, path) {
			var Zino,
				functions = {
					'props': {},
					'mount': emptyFunc,
					'unmount': emptyFunc,
					'render': emptyFunc,
					'setProps': setProps,
					'setState': setProps
				};

			Zino = typeof window === 'undefined' ? global.Zino : merge({}, window.Zino, {import: window.Zino.import.bind({path: path})});

			scripts.forEach(function(script) {
				if (script.src) {
					script.id = tagName + '-external-script';
					externalAction(script);
					return {};
				}
				try {
					//jshint evil:true
					merge(functions, eval(script.text));
					//jshint evil:false
				} catch(e) {
					throw new Error(e.message + ' while parsing ' + tagName + ' script: ' + script.text);
				}
				if (script.parentNode && typeof script.parentNode.removeChild === 'function') script.parentNode.removeChild(script);
			});

			return functions;
		}
	};
}(typeof window === 'undefined' ? module : {}))
,

		setProps = function(name, value) {
			if (typeof name === 'object') {
				merge(this.props, name);
			} else {
				this.props[name] = value;
			}
			renderInstance(tagLibrary[this.tagName], this);
		},

		tagObserver = new MutationObserver(function(records) {
			records.forEach(function(record) {
				var added = record.addedNodes, removed = record.removedNodes;
				if (added.length > 0) {
					[].forEach.call(added, function(tag) {
						tag.querySelectorAll && $('*', tag).concat(tag).forEach(function(subTag) {
							if (tagLibrary[subTag.tagName]) {
								try {
									initializeInstance(subTag);
								} catch (e) {
									error('Unable to mount tag ' + subTag.tagName, e);
								}
							}
						});
					});
				} else if (removed.length > 0) {
					[].forEach.call(removed, function(tag) {
						tag.querySelectorAll && $('*', tag).concat(tag).forEach(function(subTag) {
							if (tagLibrary[subTag.tagName]) {
								[].forEach.call(subTag.attributes, function(attr) {
									// cleanup saved data
									if (attr.name.indexOf('data-') >= 0 && Zino.__data) {
										delete Zino.__data[attr.value];
									}
								});
								try {
									tagLibrary[subTag.tagName].functions.unmount.call(subTag);
								} catch (e) {
									error('Unable to unmount tag ' + subTag.tagName, e);
								}
							}
						});
					});
				}
			});
		}),

		// renders an element instance from scratch
		renderInstance = function(tagDescription, tag) {
			var events = tagDescription.functions.events || [],

				attachEvent = function(el, events) {
					events = typeof events !== 'number' ? events : this;
					el.getHost = function() { return tag; };
					for (var each in events) {
						checkParams([events[each]], ['function'], 'event ' + each + ' for tag ' + tag.tagName);
						el.addEventListener(each, events[each].bind(el), false);
					}
				},

				getFocus = function(el, /*private*/selector) {
					if (!el) {
						return null;
					}
					selector = 	el.nodeName +
						(el.id && ('#' + el.id) || '') +
						(el.name && ('[name=' + el.name + ']') || '') +
						(el.className && ('.' + el.className.replace(/\s/g, '.')) || '');

					return {
						selector: el.parentNode && el.parentNode !== tag ? getFocus(el.parentNode).selector + ' > ' + selector : selector,
						value: el.value
					};
				},
				restoreFocus = function(path, /*private*/el) {
					if (path) {
						el = $(path.selector, tag)[0];
						if (el) {
							el.value = path.value || '';
							el.focus();
						}
					}
					return el || tag;
				},

				path = _(doc.activeElement).nodeName === 'INPUT' && getFocus(doc.activeElement),

				code = parser(tagDescription.code, getAttributes(tag), merge),
				content = doc.createDocumentFragment(),
				div = doc.createElement('div'),
				isNew = false;

			if (!tag.isRendered) {
				div.className = '-shadow-root';
				content.appendChild(div);
				$('div', content)[0].innerHTML = code;
				tag.replaceChild(content, tag.firstChild);
			} else {
				delete tag.isRendered;
			}

			try {
				if (tagDescription.functions.render.call(tag) !== false && !tag.getAttribute('__ready')) {
					tag['__s']('__ready', true);
					if (typeof tag.onready === 'function') {
						try {
							tag.onready.apply(tag);
						} catch(e) {
							error('onready', tag.tagName, e);
						};
					}
					isNew = true;
				}
			} catch(e) {
				error('render', tag.tagName, e);
			}
			restoreFocus(path);

			// attach events
			checkParams([events], ['object'], 'event definition for tag ' + tag.tagName);
			for (var all in events) {
				if (all !== ':host' && all !== tag.tagName) {
					$(all, tag).forEach(attachEvent, events[all]);
				} else if (isNew) {
					attachEvent(tag, events[all]);
				}
			}
		},

		initializeInstance = function(tag, props) {
			var tagDescription = tagLibrary[tag.tagName],
				firstEl,

				getBaseAttrs = function(obj) {
					var baseAttrs = {};
					[].forEach.call(obj.children, function (el) {
						var name = el.nodeName.toLowerCase();
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
					return baseAttrs;
				};
			if (tag['__s']) return;

			for (var all in tagDescription.functions) {
				if (['events', 'mount', 'unmount'].indexOf(all) < 0) {
					if (typeof tagDescription.functions[all] !== 'function') {
						tag[all] = tagDescription.functions[all];
					} else {
						tag[all] = tagDescription.functions[all].bind(tag);
					}
				}
			}

			tag['__s'] = tag['__s'] || tag.setAttribute;
			tag['__i'] = '';
			firstEl = tag.firstElementChild;
			if (_(firstEl).className === '-shadow-root') {
				var sibling = firstEl.nextSibling, copy;
				while (sibling && sibling.className !== '-original-root') { sibling = sibling.nextSibling; }
				if (sibling) {
					tag['__i'] = sibling.innerHTML;
					copy = sibling.cloneNode(true);
					sibling.parentNode.removeChild(sibling);
					tag.element = getBaseAttrs(copy);
				}

				tag.isRendered = true;
			} else {
				tag['__i'] = tag.innerHTML;
				tag.element = getBaseAttrs(tag);
				tag.innerHTML = '<div class="-shadow-root"></div>';
			}

			Object.defineProperty(tag, 'body', {
				set: function(val) {
					tag['__i'] = val;
					renderInstance(tagDescription, tag);
				},
				get: function() { return tag['__i']; }
			});
			try {
				Object.defineProperty(tag, 'innerHTML', {
					set: function(val) {
						tag['__i'] = val;
						renderInstance(tagDescription, tag);
					},
					get: function() { return tag['__i']; }
				});
			} catch(e) {
				// browser does not support overriding innerHTML
				console.warn(e, 'Your browser does not support overriding innerHTML. Please use `element.body` instead of `element.innerHTML`.');
			}
			tag.setAttribute = function(attr, val) {
				tag['__s'](attr, val);
				renderInstance(tagDescription, tag);
			};

			// pre-set props, if given
			tag.props = merge({}, tagDescription.functions.props, getAttributes(tag, true), props || {});

			// fire the mount event callback
			try {
				tagDescription.functions.mount.call(tag);
			} catch (e) {
				error('mount', tag.tagName, e);
			}

			// render the tag's content
			renderInstance(tagDescription, tag);
		},

		getTagFromCode = function(code) {
			var frag = doc.createDocumentFragment(),
				firstEl;
			frag.appendChild(doc.createElement('div'));
			frag.firstChild.innerHTML = code;
			firstEl = frag.firstChild.firstElementChild;
			code = code.replace(/<([^>]+)>/g, function(g, m) {
				var tagName = m.split(' ')[0];
				if (tagName[0] === '/') tagName = tagName.substr(1);
				if (tagName === firstEl.tagName.toLowerCase() || tagName.toLowerCase() === 'link') {
					return '';
				}
				return g;
			}).replace(/<style[^>]*>(?:[^\s]|[^\S])*?<\/style>/g, '').replace(/<script[^>]*>(?:[^\s]|[^\S])*?<\/script>/g, '');
			firstEl.code = code;
			return firstEl;
		},

		registerTag = function(code, initializeAll) {
			var name = code.tagName;
			if (tagLibrary[name]) {
				return;
			}

			($('link', code) || []).forEach(function(link) {
				if (link.type === 'stylesheet') {
					link.id = name + '-external-styles';
					doc.head.appendChild(link);
				}
			});
			var style = doc.createElement('style');
			style.id = name + '-styles';
			style.innerHTML = loader.handleStyles(name, $('style', code));
			doc.head.appendChild(style);

			tagLibrary[name] = {
				functions: loader.handleScripts(name, $('script', code), doc.head.appendChild, setProps, merge, code.path),
				code: code.code,
				path: code.path
			};

			if (initializeAll !== false) {
				$(name).forEach(function(tag) {
					!tag['__s'] && initializeInstance(tag);
				});
			}
		};

	// initialize all tags that are supposed to be pre-loaded via link tag
	$('link[rel="zino-tag"]').forEach(function(tag) {
		fetch(tag.href, function(code) {
			code = getTagFromCode(code);
			if (code) code.path = tag.href.replace(/[^\/]+$/g, '');
			registerTag(code);
		}, true);
	});

	tagObserver.observe(doc.body, {
		subtree: true,
		childList: true
	});

	// export the dynamic tag loading & mounting functions
	exports.import = function(url, cb, props) {
		var me = this;
		checkParams(arguments, ['string'], 'Zino.import: URL expected');
		cb = cb || emptyFunc;
		fetch((me.path || '') + url, function(code) {
			var tag = getTagFromCode(code);
			if (tag) tag.path = (me.path || '') + url.replace(/[^\/]+$/g, '');
			registerTag(tag, false);
			$(tag.tagName).forEach(function(el) {
				initializeInstance(el, props);
			});
			cb();
		}, true);
	};
	// event handling
	exports.trigger = function(eventName, data) {
			var eventObj;
			checkParams(arguments, ['string'], 'Zino.trigger');
			try {
				eventObj = new CustomEvent(eventName, {detail: data})
			} catch(ex) {
				eventObj = document.createEvent('CustomEvent');
				eventObj.initCustomEvent(eventName, false, false, data);
			}
			this.dispatchEvent(eventObj);
		}.bind(win);
	exports.on = function(eventName, cb) {
			checkParams(arguments, ['string', 'function'], 'Zino.on');
			this.addEventListener(eventName, function(e) {
				cb(e.detail);
			}, false);
		}.bind(win);
	exports.one = function(eventName, cb) {
			checkParams(arguments, ['string', 'function'], 'Zino.one');
			var _this = this,
				remove = function(e) {
					cb(e.detail);
					_this.removeEventListener(eventName, remove);
				};
			_this.addEventListener(eventName, remove, false);
		}.bind(win);
	exports.off = function(event, cb) {
			checkParams(arguments, ['string', 'function'], 'Zino.off');
			this.removeEventListener(event, cb);
		}.bind(win);
	// some util functions
	exports.fetch = fetch;
}(this.exports || (window.Zino = (window.Zino || {})), window, document));
