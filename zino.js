// zino.js

/**
	This library enables you to use custom tags, similar to web components, without any additional polyfills.

	Definition of a new tag:

		<my-new-tag>
			<div>This is some content</div>
			<p>{{props.myprop}}</p>

			<script>
				({
					props: {
						myprop: "test"
					},
					events: {
						div: {
							click: function(e) { this.getHost().setState('myprop', prompt('new name:')); }
						}
					},
					mount: function() {
						alert('element has been added to the DOM');
					},
					unmount: function() {
						alert('element has been removed from the DOM');
					}
				})
			</script>
			<style>
				my-new-tag {
					display: block;
					background: red;
				}
			</style>
		</my-new-tag>

	Usage of a new tag:

		<my-new-tag/>

	If you want to dynamically add a new tag using Javascript into the DOM, please use this method:

		<script>
			var tag = document.createElement('my-new-tag');
			document.body.appendChild(tag);
			mount('my-new-tag', tag);
		</script>
*/
(function(exports, win, doc) {
	'use strict';

	var tagLibrary = {},
		urlLibrary = {},

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
		fetch = function(url, callback) {
			if (urlLibrary[url]) {
				return callback(urlLibrary[url]);
			}
			var req = new XMLHttpRequest();
			req.open('GET', url, true);
			req.onreadystatechange = function() {
				if (req.readyState === 4 && req.status === 200) {
					urlLibrary[url] = req.responseText;
					callback(req.responseText);
				}
			};
			req.send();
		},

		// parses mustache-like template code
		parseTemplate = function(code, data, depth, startIdx) {
			var syntax = /\{\{\s*([^\}]+)\s*\}\}\}?/g,
				result = '',
				lastPos = startIdx || 0,
				match, key, condition, parsed,

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
					return obj || '';
				},

				renderStyle = function(name) {
					var value = getValue(name, data),
						style = '',
						replaced = function(g) { return '-' + g.toLowerCase(); };

					if (typeof value === 'object') {
						for (var all in value) {
							style += all.replace(/[A-Z]/g, replaced) + ':' + value[all] + ';';
						}
					}
					return style;
				};

			depth = depth || 0;
			startIdx = startIdx || 0;

			// reset regexp so that recursion works
			if (!code.match(syntax)) {
				return code;
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
					}

					parsed = '';

					if (condition) {
						if (typeof condition === 'object') {
							for (var all in condition) {
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
								result += condition(parsed.content);
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
				} else if (match[1][0] === '%') {
					// interpret given values separated by comma as styling
					result += key.split(/\s*,\s*/).map(renderStyle).join(';');
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
			};
		},

		// retrieves all attributes that can be used for rendering
		getAttributes = function(tag) {
			var attrs = {props: {}, element: tag.__baseElementAttrs, styles: {}};

			[].slice.call(tag.attributes).forEach(function(attribute) {
				attrs[attribute.name] = attribute.value;
			});

			if (tag.styles) {
				merge(attrs.styles, tag.styles);
			}

			merge(attrs.props, tag.props);
			return attrs;
		},

		// renders an element instance from scratch
		renderInstance = function(tagDescription, tag) {
			var events = tagDescription.functions.events || [],

				attachEvent = function(el, events) {
					events = typeof events !== 'number' ? events : this;
					el.getHost = function() { return tag; };
					for (var each in events) {
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
						el = tag.querySelector(path.selector);
						if (el) {
							el.value = path.value || '';
							el.focus();
						}
					}
					return el || tag;
				},

				path = doc.activeElement.nodeName === 'INPUT' && getFocus(doc.activeElement);

			tag.innerHTML = parseTemplate(tagDescription.code, merge(getAttributes(tag), {
				body: tag.__originalInnerHTML
			})).content;
			tagDescription.functions.render.call(tag);
			restoreFocus(path);

			// attach events
			for (var all in events) {
				if (all !== ':host' && all !== tag.tagName) {
					$(all, tag).forEach(attachEvent, events[all]);
				} else {
					attachEvent(tag, events[all]);
				}
			}
		},

		initializeInstance = function(name, tag, props) {
			var tagDescription = tagLibrary[name],
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

			tag.__baseElementAttrs = baseAttrs;
			tag.__originalInnerHTML = tag.innerHTML;
			tag.__oldSetAttribute = tag.__oldSetAttribute || tag.setAttribute;
			tag.setAttribute = function(attr, val) {
				tag.__oldSetAttribute(attr, val);
				renderInstance(tagDescription, tag);
			};
			tag.remove = function() {
				tagDescription.functions.unmount.call(tag);
				tag.parentNode.removeChild(tag);
			};

			// pre-set props, if given
			if (props) {
				tag.props = merge(tagDescription.functions.props, props);
			}

			// render the tag's content
			renderInstance(tagDescription, tag);

			// fire the mount event callback
			tagDescription.functions.mount.call(tag);
		},

		handleStyles = function(tag, links, styles) {
			var style = doc.createElement('style');

			links.forEach(function(link) {
				if (link.type === 'stylesheet') {
					link.id = tag + '-external-styles';
					doc.head.appendChild(link);
				}
			});

			style.id = tag + '-styles';
			style.innerHTML = (styles || []).map(function(style) {
				var code = style.innerHTML;
				style.parentNode.removeChild(style);
				return code.replace(/[\r\n]+([^\{]+?)\{[^\}]+?\}/gm, function (g, m) {
					var selectors = m.split(',').map(function (selector) {
						if (selector.match(/:host\b/) || selector.indexOf(tag) >= 0) { return selector; }
						return tag + ' ' + selector;
					});
					return g.replace(m, selectors.join(','));
				}).replace(/:host\b/gm, tag) + '\n';
			}).join('\n');
			doc.head.appendChild(style);
		},

		handleScripts = function(tag, scripts) {
			var functions = {
				props: {},
				mount: function() {},
				unmount: function() {},
				render: function() {},
				setState: function(name, value) {
					this.props[name] = value;
					renderInstance(tagLibrary[this.tagName], this);
				}
			};

			scripts.forEach(function(script) {
				if (script.src) {
					script.id = tag + '-external-script';
					doc.head.appendChild(script);
					return {};
				}
				//jshint evil:true
				merge(functions, eval(script.innerHTML));
				//jshint evil:false
				script.parentNode.removeChild(script);
			});

			return functions;
		},

		registerTag = function(code, initializeAll) {
			if (tagLibrary[code.tagName]) {
				return;
			}

			handleStyles(code.tagName, $('link', code), $('style', code));

			tagLibrary[code.tagName] = {
				functions: handleScripts(code.tagName, $('script', code)),
				code: code.innerHTML
			};

			if (initializeAll !== false) {
				$(code.tagName).forEach(function(tag) {
					initializeInstance(tag.tagName, tag);
				});
			}
		},

		getTagFromCode = function(code) {
			var frag = doc.createDocumentFragment();
			frag.appendChild(doc.createElement('div'));
			frag.firstChild.innerHTML = code;
			return frag.firstChild.firstElementChild;
		};

	// initialize all tags that are supposed to be pre-loaded via link tag
	$('link[type="zinotag"]').forEach(function(tag) {
		fetch(tag.href, function(code) {
			registerTag(getTagFromCode(code));
		});
	});

	// export the mount function to enable dynamic mounting
	exports.mount = function(tag, el, url, props) {
			if (url && typeof url === 'string') {
				fetch(url, function(code) {
					registerTag(getTagFromCode(code), false);
					initializeInstance(tag.toUpperCase(), el, props);
				});
			} else {
				initializeInstance(tag.toUpperCase(), el, url);
			}
		};
	exports.mountAll = function(startEl) {
			startEl = startEl || doc.body;

			Object.keys(tagLibrary).forEach(function(tag) {
				$(tag, startEl).forEach(function(el) {
					initializeInstance(tag, el);
				});
			});
		};
	// event handling
	exports.trigger = function(event, data) {
			this.dispatchEvent(new CustomEvent(event, {detail: data}));
		}.bind(win);
	exports.on = function(event, cb) {
			this.addEventListener(event, function(e) {
				cb(e.detail);
			}, false);
		}.bind(win);
	exports.one = function(event, cb) {
			var _this = this,
				remove = function(e) {
					cb(e.detail);
					_this.removeEventListener(event, remove);
				};
			_this.addEventListener(event, remove, false);
		}.bind(win);
	exports.off = function(event, cb) {
			this.removeEventListener(event, cb);
		}.bind(win);
}((this.window.Zino = this.window && (this.window.Zino || {})) || exports, window, document));
