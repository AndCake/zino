import {merge, isFn, isObj, identity} from './utils';

const
	syntax = /\{\{\s*([^\}]+)\s*\}\}\}?/g,

	getValue = (name, data, noRun) => {
		let parts = ['.'],
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

	handleBlock = (match, data, code, options, depth, startIdx) => {
		let ch = match[0],
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
			for (let all in condition) {
				if (all === 'isArray') continue;
				let el = condition[all];
				parsed = parse(
						code,
						merge({}, data, el, {
							'.index': all,
							'.length': condition.length,
							'.': el
						}),
						merge({key, condition}, options),
						depth,
						startIdx
					);
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
			parsed = parse(code, data, merge({key, condition}, options), depth, startIdx);
		}

		return [parsed.lastIndex, result];
	},

	parse = function(code, data, options = {}, depth = 0, startIdx = 0) {
		let result = '',
			lastPos = startIdx,
			lastBlock = '',
			match, key, len, ch,

			transform = val => isFn(val) ? transform(val.apply(data)) : val + (typeof val === 'number' && val !== null ? (data.styles && data.styles.defaultUnit || 'px') : ''),
			renderStyle = name => {
				let value = getValue(name, data),
					style = '';

				if (isObj(value)) {
					for (var all in value) {
						style += all.replace(/[A-Z]/g, g => '-' + g.toLowerCase()) + ':' + transform(value[all]) + ';';
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

		while ((match = syntax.exec(code))) {
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
				let cresult;
				lastBlock = [key, lastPos, match.index];
				[lastPos, cresult] = handleBlock(match[1], data, code, options, depth + 1, lastPos);
				result += cresult;
			} else if (ch === '/') {
				// end of block
				if (depth <= 0) {
					throw new Error('Unexpected end of block ' + key);
				}
				return {lastIndex: lastPos, content: result};
			}/* else if (ch === '>') {	// removed support for partials since it's never used...
				result += (options.resolvePartial || identity)(key, data);
			}*/ else if (ch === '!') {
				// comment - don't do anything
				result += '';
			} else if (ch === '%') {
				// interpret given values separated by comma as styling
				result += key.split(/\s*,\s*/).map(renderStyle).join('');
			} else if (ch === '+') {
				var value = getValue(key, data);
				let id = (options.resolveData || identity)(key, value);
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
		}
	};

// parses mustache-like template code
export default function(code, data, options) {
	var result = parse(code, data, options);
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
