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

		- mount(tagName, element[, url][, props])
			- tagName - name of the tag to be mounted
			- element - the DOM element to be mounted
			- url - URL to load the element from, if not loaded yet (optional)
			- props - initially set properties (optional)

			Mounts the given element as the given tag name, optionally, loaded from the
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
		originalInnerHTML = '__i',
		oldSetAttribute = '__s',

		setProps = function(name, value) {
			if (typeof name === 'object') {
				merge(this['props'], name);
			} else {
				this['props'][name] = value;
			}
			renderInstance(tagLibrary[this.tagName], this);
		},

		tagObserver = new MutationObserver(function(records) {
			records.forEach(function(record) {
				var added = record.addedNodes, removed = record.removedNodes;
				if (added.length > 0) {
					added.forEach(function(tag) {
						tag.querySelectorAll && $('*', tag).concat(tag).forEach(function(subTag) {
							if (tagLibrary[subTag.tagName]) {
								try {
									exports['mount'](subTag);
								} catch (e) {
									throw new Error('Unable to mount tag ' + subTag.tagName + ': ' + e.message);
								}
							}
						});
					});
				} else if (removed.length > 0) {
					removed.forEach(function(tag) {
						tag.querySelectorAll && $('*', tag).concat(tag).forEach(function(subTag) {
							if (tagLibrary[subTag.tagName]) {
								try {
									tagLibrary[subTag.tagName].functions['unmount'].call(subTag);
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
		getAttributes = require('attributes'),
		parser = require('parser'),

		// renders an element instance from scratch
		renderInstance = function(tagDescription, tag) {
			var events = tagDescription.functions['events'] || [],

				attachEvent = function(el, events) {
					events = typeof events !== 'number' ? events : this;
					el['getHost'] = function() { return tag; };
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

				path = doc.activeElement.nodeName === 'INPUT' && getFocus(doc.activeElement),

				code = parser(tagDescription.code, getAttributes(tag), merge),
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
				if (tagDescription.functions['render'].call(tag) !== false && !tag.getAttribute('__ready')) {
					tag[oldSetAttribute]('__ready', true);
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
				baseAttrs = {};

			for (var all in tagDescription.functions) {
				if (['events', 'mount', 'unmount'].indexOf(all) < 0) {
					if (typeof tagDescription.functions[all] !== 'function') {
						tag[all] = tagDescription.functions[all];
					} else {
						tag[all] = tagDescription.functions[all].bind(tag);
					}
				}
			}

			[].forEach.call(tag.children, function (el) {
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

			tag.element = baseAttrs;
			tag[oldSetAttribute] = tag[oldSetAttribute] || tag.setAttribute;
			if (tag.firstElementChild && tag.firstElementChild.className === '-shadow-root') {
				tag.originalInnerHTML = '';
				tag.rendered = true;
			} else {
				tag[originalInnerHTML] = tag.innerHTML;
				tag.innerHTML = '<div class="-shadow-root"></div>';
			}
			Object.defineProperty(tag, 'body', {
				set: function(val) {
					tag[originalInnerHTML] = val;
					renderInstance(tagDescription, tag);
				},
				get: function() { return tag[originalInnerHTML]; }
			});
			try {
				Object.defineProperty(tag, 'innerHTML', {
					set: function(val) {
						tag[originalInnerHTML] = val;
						renderInstance(tagDescription, tag);
					},
					get: function() { return tag[originalInnerHTML]; }
				});
			} catch(e) {
				// browser does not support overriding innerHTML
				console.error(e, 'Your browser does not support overriding innerHTML. Please use `element.body` instead of `element.innerHTML`.');
			}
			tag.setAttribute = function(attr, val) {
				tag[oldSetAttribute](attr, val);
				renderInstance(tagDescription, tag);
			};

			// pre-set props, if given
			if (props) {
				tag['props'] = merge(tagDescription.functions['props'], props);
			}

			// fire the mount event callback
			try {
				tagDescription.functions['mount'].call(tag);
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
			return frag.firstChild.firstElementChild;
		},

		loader = require('loader'),

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
				code: code[innerHTML],
				path: code.path
			};

			if (initializeAll !== false) {
				$(code.tagName).forEach(function(tag) {
					!tag[oldSetAttribute] && initializeInstance(tag);
				});
			}
		},

		initializeInstances = function(el, props) {
			if (!(el instanceof NodeList)) el = [el];
			[].forEach.call(el, function(el) {
				!el[oldSetAttribute] && initializeInstance(el, props);
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
			var code = getTagFromCode(code);
			if (code) code.path = tag.href.replace(/\/[^/]+$/g, '');
			registerTag(code);
		}, true);
	});

	tagObserver.observe(doc.body, {
		subtree: true,
		childList: true
	});

	// export the dynamic tag loading & mounting functions
	exports['import'] = function(url, cb, props) {
		checkParams(arguments, ['string'], 'Zino.import: URL expected');
		cb = cb || function(){};
		fetch(((this.path && this.path + '/') || '') + url, function(code) {
			var tag = getTagFromCode(code);
			registerTag(tag, false);
			initializeInstances(doc.body.querySelectorAll(tag.tagName), props);
			cb();
		}, true);
	};
	exports['mount'] = function(el, url, props) {
			checkParams(arguments, ['object'], 'Zino.mount: DOM node expected');
			if (url && typeof url === 'string') {
				exports.import(url, null, props);
			} else {
				initializeInstances(el, url);
			}
		};
	exports['mountAll'] = function(startEl) {
			startEl = startEl || doc.body;
			checkParams(arguments, ['object'], 'Zino.mountAll: DOM node expected');

			Object.keys(tagLibrary).forEach(function(tag) {
				initializeInstances($(tag, startEl));
			});
		};
	// event handling
	exports['trigger'] = function(eventName, data) {
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
	exports['on'] = function(eventName, cb) {
			checkParams(arguments, ['string'], 'Zino.on');
			this.addEventListener(eventName, function(e) {
				cb(e.detail);
			}, false);
		}.bind(win);
	exports['one'] = function(eventName, cb) {
			checkParams(arguments, ['string'], 'Zino.one');
			var _this = this,
				remove = function(e) {
					cb(e.detail);
					_this.removeEventListener(eventName, remove);
				};
			_this.addEventListener(eventName, remove, false);
		}.bind(win);
	exports['off'] = function(event, cb) {
			checkParams(arguments, ['string'], 'Zino.off');
			this.removeEventListener(event, cb);
		}.bind(win);
	// some util functions
	exports['fetch'] = fetch;
}(this.exports || (window['Zino'] = (window['Zino'] || {})), window, document));
