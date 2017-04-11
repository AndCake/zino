// zino.js
/*This library enables you to use custom tags, similar to web components, without any additional polyfills.*/
(function(exports, win, doc) {
	'use strict';

	var tagLibrary = {},

		// read utilities
		utils 		= require('utils'),
		$ 			= utils.domQuery,
		merge 		= utils.merge,
		fetch 		= utils.fetch,
		_ 			= utils.safeAccess,
		emptyFunc 	= utils.emptyFunc,
		checkParams = utils.checkParams,
		error 		= utils.error,

		// retrieves all attributes that can be used for rendering
		getAttributes 	= require('attributes'),
		parser 			= require('parser'),
		loader 			= require('loader'),

		/**
		 * Sets the internal state of the current element and triggers re-rendering.
		 * @param {String|Object} name  the property name or an object with all property names and their values to be updated
		 * @param {Mixed} value 		the value of the property to be updated, if an object is provided as name, the value is ignored.
		 */
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
						tag.querySelectorAll && $('*', tag).concat(tag).forEach(unmountTag);
					});
				}
			});
		}),

		unmountTag = function(subTag) {
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
		},

		/**
		 * renders an element instance from scratch
		 * @param  {Object} tagDescription 		the element's registry details
		 * @param  {DOMElement} tag            	the element itself in the current DOM
		 */
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

			$('*[__ready]', tag).forEach(unmountTag);

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

		/**
		 * augments the element's DOM node with Zino functionality, then mounts and renders the element
		 * 
		 * @param  {DOMElement} tag   	the DOM node of the element to be initialized
		 * @param  {Object} props 		initial state of the element (optional)
		 */
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

		/**
		 * retrieves DOM tree from some HTML fragment; filters out any recursive mentions of itself, scripts and style elements
		 * 
		 * @param  {String} code 	the HTML fragment
		 * @return {DOMNode}      	the first element child of the HTML fragment
		 */
		getTagFromCode = function(code) {
			var dom = new DOMParser().parseFromString(code, 'text/html');
			var firstEl = dom.body.firstElementChild;
			code = code.replace(new RegExp('<\\/?' + firstEl.tagName + '(?:\s+[^>]+)?>', 'ig'), '').replace(/<(style|script)[^>]*>(?:[^\s]|[^\S])*?<\/\1>/g, '');
			firstEl.code = code;
			return firstEl;
		},

		/**
		 * registers a tag in the tag library
		 * @param  {String} code          the HTML fragment containing the tag's definition
		 * @param  {Boolean} initializeAll whether or not to initialize all existing instances of this tag in the DOM (optional, default value = true)
		 */
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

			try {
				tagLibrary[name] = {
					functions: loader.handleScripts(name, $('script', code), doc.head.appendChild, setProps, merge, code.path),
					code: code.code,
					path: code.path
				};
			} catch(e) {
				console.error(e.message);
			}

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

	/**
	 * imports and registers a tag on demand, if it has not been registered already
	 * @param  {String}   url   the URL to find the tag to be registered at
	 * @param  {Function} cb    Callback to run once the tag has been registered and all instances been initialized (optional)
	 * @param  {Object}   props initial state of all existing instances (optional)
	 */
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
	/**
	 * triggers a custom event on the window scope (if none other is bound to it)
	 * @param  {String} eventName the custom event's name to trigger
	 * @param  {Object} data      any data to be transmitted to anyone who is listening
	 */
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
	/**
	 * registers an event listener for the provided custom event
	 * @param  {String}   eventName the custom event's name
	 * @param  {Function} cb        callback to be called when the custom event was triggered. Any data transmitted in the trigger will be handed into the callback as first argument.
	 */
	exports.on = function(eventName, cb) {
			checkParams(arguments, ['string', 'function'], 'Zino.on');
			this.addEventListener(eventName, function(e) {
				cb(e.detail);
			}, false);
		}.bind(win);
	/**
	 * registers an event listener for the provided custom event but listens only for the first time the event occurs
	 * @param  {String}   eventName the custom event's name
	 * @param  {Function} cb        callback to be called when the custom event was triggered. Any data transmitted in the trigger will be handed into the callback as first argument.
	 */
	exports.one = function(eventName, cb) {
			checkParams(arguments, ['string', 'function'], 'Zino.one');
			var _this = this,
				remove = function(e) {
					cb(e.detail);
					_this.removeEventListener(eventName, remove);
				};
			_this.addEventListener(eventName, remove, false);
		}.bind(win);
	/**
	 * removes a registered event handler for the provided custom event
	 * @param  {String}   event the custom event's name
	 * @param  {Function} cb    the event handler to remove
	 */
	exports.off = function(event, cb) {
			checkParams(arguments, ['string', 'function'], 'Zino.off');
			this.removeEventListener(event, cb);
		}.bind(win);
	// some util functions
	exports.fetch = fetch;
}(this.exports || (window.Zino = (window.Zino || {})), window, document));
