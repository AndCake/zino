(function(module, Zino) {
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
								return val + 'px';
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
