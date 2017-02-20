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

		- mount(element[, url][, props])
			- element - the DOM element to be mounted
			- url - URL to load the element from, if not loaded yet (optional)
			- props - initially set properties (optional)

			Mounts the given element, optionally, loaded from the
			server, if it has not been loaded already.

		- mountAll([baseElement])
			- baseElement - DOM element to start mounting from (optional, default = document.body)

			Mounts all loaded tags on the page, starting from the given position

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
		urlLibrary = {},
		innerHTML = 'innerHTML',

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
									exports.mount(subTag);
								} catch (e) {
									throw new Error('Unable to mount tag ' + subTag.tagName + ': ' + e.message);
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
									throw new Error('Unable to unmount tag ' + subTag.tagName + ': ' + e.message);
								}
							}
						});
					});
				}
			});
		}),

		// returns an array of elements that match the given selector in the given context
		$ = function(selector, context) {
			return [].slice.call((context || doc).querySelectorAll(selector));
		},

		// merges any objects given into the function
		merge = function() {
			var args = arguments,
				target = args[0];

			for (var i = 1; i < args.length; i += 1) {
				for (var all in args[i]) {
					target[all] = args[i][all];
				}
			}

			return target;
		},

		// simplified GET AJAX request
		fetch = function(url, callback, cache) {
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

		// retrieves all attributes that can be used for rendering
		getAttributes = (function(module) {
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
		parser = (function(module) {
	// PARSER.JS
	'use strict';
	var syntax = /\{\{\s*([^\}]+)\s*\}\}\}?/g,
		merge = 0,

		getValue = function(name, data) {
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


			if (typeof obj === 'function') {
				obj = obj.apply(data);
			}
			return obj !== undefined && obj !== null ? obj : '';
		},

		parse = function parseTemplate(code, data, depth, startIdx, tag) {
			var result = '',
				lastPos = startIdx || 0,
				match, key, condition, parsed,

				renderStyle = function(name) {
					var value = getValue(name, data),
						style = '',
						replaced = function(g) { return '-' + g.toLowerCase(); },

						transformValue = function(val) {
							if (typeof val === 'number' && val !== 0) {
								return val + 'px';
							}
							if (typeof val === 'function') {
								return transformValue(val.apply(data));
							}
							return val;
						};

					if (typeof value === 'object') {
						for (var all in value) {
							style += all.replace(/[A-Z]/g, replaced) + ':' + transformValue(value[all]) + ';';
						}
					}

					return style;
				};

			depth = depth || 0;
			startIdx = startIdx || 0;
			tag = tag || {};

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
				key = match[1].substr(1);

				if (match[1][0] === '#' || match[1][0] === '^') {
					// begin of block
					condition = getValue(key, data);
					if (match[1][0] === '^' && (!condition || condition && condition.length <= 0)) {
						condition = true;
					} else if (match[1][0] === '^') {
						condition = false;
					}

					parsed = '';

					if (condition) {
						if (typeof condition === 'object') {
							for (var all in condition) {
								if (all === 'isArray') continue;
								parsed = parseTemplate(
										code,
										merge({
											'.index': all,
											'.length': condition.length,
											'.': condition[all]
										}, data, condition[all]),
										depth + 1,
										match.index + match[0].length
									);
								result += parsed.content;
							}
						} else {
							parsed = parseTemplate(
								code,
								merge({
									'.index': 0,
									'.length': 1,
									'.': condition
								}, data, condition),
								depth + 1,
								match.index + match[0].length
							);

							if (typeof condition === 'function') {
								try {
									result += condition(parsed.content);
								} catch (e) {
									throw 'Unable to run condition function ' + parsed.content + ' while parsing template: ' + e.message;
								}
							} else {
								result += parsed.content;
							}
						}
					}

					if (typeof parsed !== 'object') {
						parsed = parseTemplate(code, data, depth + 1, match.index + match[0].length);
					}

					lastPos = parsed.lastIndex;
					continue;
				} else if (match[1][0] === '/') {
					// end of block
					if (depth <= 0) {
						throw 'Unexpected end of block ' + match[1].substr(1);
					}
					return {lastIndex: match[0].length + match.index, content: result};
				} else if (match[1][0] === '>') {
					// keep imports as is
					result += match[0];
				} else if (match[1][0] === '!') {
					// comment - don't do anything
					result += '';
				} else if (match[1][0] === '%') {
					// interpret given values separated by comma as styling
					result += key.split(/\s*,\s*/).map(renderStyle).join(';');
				} else if (match[1][0] === '+') {
					var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0;return (c=='x'?r:r&0x3|0x8).toString(16);});
					if (!Zino.__data) Zino.__data = {};
					Zino.__data[id] = getValue(key, data);
					result += '--' + id + '--';
				} else if (match[1][0] === '{') {
					// unescaped content
					result += getValue(key, data);
				} else {
					// escaped content
					result += ('' + getValue(match[1], data) || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
				}

				lastPos = match.index + match[0].length;
			}
			result += code.substr(lastPos);
			return {
				content: result,
				lastIndex: code.length - 1
			}
		};

	// parses mustache-like template code
	return module.exports = function(code, data, mergeFn, tag) {
		merge = mergeFn || function(){};
		var result = parse(code, data, null, null, tag);
		return result && result.content || '';
	};
}(typeof window === 'undefined' ? module : {}))
,

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

				getFocus = function(el) {
					var selector;

					if (!el) {
						return null;
					}
					selector = 	el.nodeName +
						(el.id && ('#' + el.id) || '') +
						(el.name && ('[name=' + el.name + ']') || '') +
						(el.className && ('.' + el.className) || '');

					if (el.parentNode !== tag && el.parentNode) {
						return {
							selector: getFocus(el.parentNode).selector + ' > ' + selector,
							value: el.value
						};
					}
					return {
						selector: selector,
						value: el.value
					};
				},
				restoreFocus = function(path) {
					var el;
					if (path) {
						el = $(path.selector, tag)[0];
						if (el) {
							el.value = path.value || '';
							el.focus();
						}
					}
					return el || tag;
				},

				path = doc.activeElement && doc.activeElement.nodeName === 'INPUT' && getFocus(doc.activeElement),

				code = parser(tagDescription.code, getAttributes(tag), merge, tag),
				content = doc.createDocumentFragment(),
				div = doc.createElement('div'),
				isNew = false;

			if (!tag.isRendered) {
				div.className = '-shadow-root';
				content.appendChild(div);
				$('div', content)[0][innerHTML] = code;
				tag.replaceChild(content, tag.firstChild);
			} else {
				delete tag.isRendered;
			}

			try {
				if (tagDescription.functions.render.call(tag) !== false && !tag.getAttribute('__ready')) {
					tag['__s']('__ready', true);
					isNew = true;
				}
			} catch(e) {
				throw new Error('Error while calling render function of ' + tag.tagName + ': ' + e.message, e.fileName, e.lineNumber);
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
			if (tag.firstElementChild && tag.firstElementChild.className === '-shadow-root') {
				var sibling = tag.firstElementChild.nextSibling, copy;
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
				console.error(e, 'Your browser does not support overriding innerHTML. Please use `element.body` instead of `element.innerHTML`.');
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
				throw new Error('Unable to call mount() for tag ' + tag.tagName + ': ' + e.message, e.fileName, e.lineNumber);
			}

			// render the tag's content
			renderInstance(tagDescription, tag);
		},

		getTagFromCode = function(code) {
			var frag = doc.createDocumentFragment();
			frag.appendChild(doc.createElement('div'));
			frag.firstChild.innerHTML = code;
			code = code.replace(/<([^>]+)>/g, function(g, m) {
				var tagName = m.split(' ')[0];
				if (tagName[0] === '/') tagName = tagName.substr(1);
				if (tagName === frag.firstChild.firstElementChild.tagName.toLowerCase() || tagName.toLowerCase() === 'link') {
					return '';
				}
				return g;
			}).replace(/<style[^>]*>(?:[^\s]|[^\S])*?<\/style>/g, '').replace(/<script[^>]*>(?:[^\s]|[^\S])*?<\/script>/g, '');
			frag.firstChild.firstElementChild.code = code;
			return frag.firstChild.firstElementChild;
		},

		loader = (function(module) {
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

		registerTag = function(code, initializeAll) {
			if (tagLibrary[code.tagName]) {
				return;
			}

			($('link', code) || []).forEach(function(link) {
				if (link.type === 'stylesheet') {
					link.id = code.tagName + '-external-styles';
					doc.head.appendChild(link);
				}
			});
			var style = doc.createElement('style');
			style.id = code.tagName + '-styles';
			style.innerHTML = loader.handleStyles(code.tagName, $('style', code));
			doc.head.appendChild(style);

			tagLibrary[code.tagName] = {
				functions: loader.handleScripts(code.tagName, $('script', code), doc.head.appendChild, setProps, merge, code.path),
				code: code.code,
				path: code.path
			};

			if (initializeAll !== false) {
				$(code.tagName).forEach(function(tag) {
					!tag['__s'] && initializeInstance(tag);
				});
			}
		},

		initializeInstances = function(el, props) {
			if (!(el instanceof NodeList)) el = [el];
			[].forEach.call(el, function(el) {
				!el['__s'] && initializeInstance(el, props);
			});
		},

		checkParams = function(args, types, api) {
			for (var all in args) {
				if (types[all] && typeof args[all] !== types[all]) {
					throw new Error('API mismatch while using ' + api + ': Parameter ' + all + ' was supposed to be ' + types[all] + ' but ' + (typeof args[all]) + ' was given.');
				}
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
		cb = cb || function(){};
		fetch((me.path || '') + url, function(code) {
			var tag = getTagFromCode(code);
			if (tag) tag.path = (me.path || '') + url.replace(/[^\/]+$/g, '');
			registerTag(tag, false);
			initializeInstances(doc.body.querySelectorAll(tag.tagName), props);
			cb();
		}, true);
	};
	exports.mount = function(el, url, props) {
			checkParams(arguments, ['object'], 'Zino.mount: DOM node expected');
			if (url && typeof url === 'string') {
				exports.import(url, null, props);
			} else {
				initializeInstances(el, url);
			}
		};
	exports.mountAll = function(startEl) {
			startEl = startEl || doc.body;
			checkParams(arguments, ['object'], 'Zino.mountAll: DOM node expected');

			Object.keys(tagLibrary).forEach(function(tag) {
				initializeInstances($(tag, startEl));
			});
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
			checkParams(arguments, ['string'], 'Zino.on');
			this.addEventListener(eventName, function(e) {
				cb(e.detail);
			}, false);
		}.bind(win);
	exports.one = function(eventName, cb) {
			checkParams(arguments, ['string'], 'Zino.one');
			var _this = this,
				remove = function(e) {
					cb(e.detail);
					_this.removeEventListener(eventName, remove);
				};
			_this.addEventListener(eventName, remove, false);
		}.bind(win);
	exports.off = function(event, cb) {
			checkParams(arguments, ['string'], 'Zino.off');
			this.removeEventListener(event, cb);
		}.bind(win);
	// some util functions
	exports.fetch = fetch;
}(this.exports || (window.Zino = (window.Zino || {})), window, document));
