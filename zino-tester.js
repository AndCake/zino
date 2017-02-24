(function() {
    'use strict';

    var cheerio = require('cheerio'),
        colors = require('colors'),
        diff = require('fast-diff'),
        readline = require('readline-sync'),
        fs = require('fs'),
        path = require('path'),
        sha1 = data => require('crypto').createHash('sha1').update(data).digest('hex'),

        utils = (function(module) {
	var urlLibrary = {};
	return module.exports = {

		// merges any objects given into the function
		merge: function() {
			var args = arguments,
				target = args[0];

			for (var i = 1; i < args.length; i += 1) {
				for (var all in args[i]) {
					target[all] = args[i][all];
				}
			}

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
		merge = utils.merge,
		emptyFunc = utils.emptyFunc,

        loadedTags = {};

    /* make a tag known in the registry */
    var importTag = function(tagFile) {
            var tagContent = fs.readFileSync(tagFile, 'utf-8'),
                tag = {},
                $ = cheerio.load(tagContent),
                tagRoot = $.root().children().first(),
                scripts = $('script').map(function() { return {text: $(this).text()}}).get();

            global.Zino = {
                trigger: emptyFunc,
                on: emptyFunc,
                off: emptyFunc,
                one: emptyFunc,
                import: emptyFunc,
                fetch: emptyFunc,
                mount: emptyFunc,
                mountAll: emptyFunc
            };
            tag = (function(module) {
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
.handleScripts(tagRoot.get(0).tagName, scripts, emptyFunc, emptyFunc, merge);
            $('script, style, link').remove();
            tagContent = tagRoot.html();

            loadedTags[tagRoot.get(0).tagName] = {
                tag,
                tagContent,
                ref: $,
                tagFile
            };
        },

        renderTag = (html, data) => {
            var tag = cheerio.load(html),
                tagName,
                instance = {};

            tag = tag.root().children().first();
            tagName = tag.get(0).tagName;

            if (!loadedTags[tagName]) {
                throw new Error(tagName + ' is not imported. Please import it before using it.');
            }
            loadedTags[tagName].tag.__i = tag.html();

            loadedTags[tagName].tag.mount.call(merge(instance, loadedTags[tagName].tag));
            data = (function(module) {
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
(merge({
                attributes: Object.keys(tag.get(0).attribs).map(attr => ({name: attr, value: tag.get(0).attribs[attr]}))
            }, instance, data));

            return {
                html: (function(module) {
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
(loadedTags[tagName].tagContent, data, merge),
                data,
                tagName,
                registry: loadedTags[tagName]
            };
        },

        /* renders a tag with the given data and checks if it matches a previously-set snapshot */
        matchesSnapshot = (html, data) => {
            var result = renderTag(html, data),
                resultString = '',
                filename = './test/snapshots/' + result.tagName + '-' + sha1(html + JSON.stringify(data)).substr(0, 5) + '.json',

				events = result.registry.tag && result.registry.tag.events || {};

			events = Object.keys(events).map(function(el) {
				var obj = {};
					if (events[el]) {
						obj[el] = Object.keys(events[el]).map(function(event) {
							return event + ' = [' + typeof events[el][event] + ']' + events[el][event].name;
						});
					}
					return obj;
				});

            if (!fs.existsSync(path.dirname(filename))) {
                fs.mkdirSync(path.dirname(filename));
            }


            resultString = result.html.trim() + '\n' + JSON.stringify({data: result.data, events: events, tagName: result.tagName}, null, 2);

            if (!fs.existsSync(filename)) {
                fs.writeFileSync(filename, resultString);
            } else {
                result = fs.readFileSync(filename, 'utf-8');
                if (result !== resultString) {
                    result = diff(result, resultString);
                    result.forEach(part => {
                        var color = part[0] === diff.DELETE ? 'red' : part[0] === diff.INSERT ? 'green' : 'gray';
                        process.stderr.write(part[1][color]);
                    });
                    if (readline.question('\nThe snapshots don\'t match.\nDo you want to take the new one as the reference snapshot (y/N)?') === 'y') {
                        fs.writeFileSync(filename, resultString);
                        return;
                    }
                    throw new Error('Snapshots don\'t match.');
                }
            }
        };

    module.exports = {
        matchesSnapshot,
        importTag
    };
}());
