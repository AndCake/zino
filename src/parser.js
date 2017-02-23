(function(module) {
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
