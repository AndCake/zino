const tagRegExp = /<(\/?)([\w-]+)([^>]*?)(\/?)>/g;
const attrRegExp = /([\w_-]+)=(?:'([^']*?)'|"([^"]*?)")/g;
const commentRegExp = /<!--(?:[^-]|-[^-])*-->/g;
const syntax = /\{\{\s*([^\}]+)\s*\}\}\}?/g;
const safeAccess = `function safeAccess(obj, attrs) {
	if (!attrs) return obj;
	if (attrs[0] === '.') {
		return obj[attrs];
	}
	attrs = attrs.split('.');
	while (attrs.length > 0 && typeof (obj = obj[attrs.shift()]) !== 'undefined');
	if (typeof obj === 'string') {
		return obj.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/>/g, '&gt;');
	} else {
		return obj || '';
	}
}`;
const toArray = `function toArray(data, value) {
	var dataValue = safeAccess(data, value);
	if (dataValue) {
		if (Object.prototype.toString.call(dataValue) === '[object Array]') {
			return dataValue;
		} else return [dataValue];
	} else {
		return [];
	}
}`;
const spread = `function spread(array) {
	var result = [];
	array.forEach(function(entry) {
		result = result.concat(entry);
	});
	return result;
}`;
const merge = `function merge(target) {
	[].slice.call(arguments, 1).forEach(function (arg) {
		for (var all in arg) {
			target[all] = arg[all];
		}
	});

	return target;
}`;
const renderStyle = `function renderStyle(value, context) {
	var style = '';
		transform = function(val) {
			if (typeof val === 'function') return transform(val.apply(context));
			return val + (typeof val === 'number' && val !== null ? context.styles && context.styles.defaultUnit || 'px' : '');
		};

	if (typeof value === 'object') {
		for (var all in value) {
			style += all.replace(/[A-Z]/g, g => '-' + g.toLowerCase()) + ':' + transform(value[all]) + ';';
		}
	}

	return style;
}`;
const baseCode = `function(Tag) {
	{{helperFunctions}}

	return {
		tagName: '{{tagName}}',
		{{styles}}
		render: function(data) {
			return [].concat({{render}})
		},

		functions: {{functions}}
	};
}`;

export function parse(data) {
	let resultObject = {
		styles: [],
		helperFunctions: [safeAccess],
		tagName: '',
		render: '',
		functions: ''
	};
	let usesMerge = false, usesRenderStyle = false, usesSpread = false;
	let match, lastIndex = 0, level = 0, tagStack = [];

	function getData() {
		return `data${level === 0 ? '' : '$' + level}`;
	}

	function handleText(text) {
		let match, result = '', lastIndex = 0;
		while (match = syntax.exec(text)) {
			if (match.index < lastIndex) continue;
			let frag = text.substring(lastIndex, match.index).trim()
			if (frag.length > 0) {
				result += "'" + frag.replace(/\n/g, '').replace(/'/g, '\\\'') + "', ";
			}
			lastIndex = match.index + match[0].length;
			let key = match[1];
			let value = key.substr(1);
			if (key[0] === '#') {
				result += `spread(toArray(${getData()}, '${value}').map(function (entry, index, arr) {
						var data$${level + 1} = merge({}, data${0 <= level ? '' : '$' + level}, {'.': entry, '.index': index, '.length': arr.length}, entry);
						return [`;
				level += 1;
				usesMerge = true;
				usesSpread = true;
			} else if (key[0] === '/') {
				result += '\'\']; })), ';
				level -= 1;
				if (level < 0) {
					throw new Error('Unexpected end of block ' + key.substr(1));
				}
			} else if (key[0] === '^') {
				result += `(safeAccess(${getData()}, '${value}') && safeAccess(${getData()}, '${value}').length > 0) ? '' : spread([1].map(function() { var data$${level + 1} = merge({}, data${0 <= level ? '' : '$' + level}); return [`;
				usesSpread = true;
				level += 1;
			} else if (key[0] === '%') {
				result += key.substr(1).split(/\s*,\s*/).map(value => `renderStyle(safeAccess(${getData()}, '${value}'), ${getData()})`).join(' + ');
				usesRenderStyle = true;
			} else if (key[0] === '+') {
				result += `safeAccess(${getData()}, '${value}'), `;
			} else if (key[0] !== '{') {
				value = key;
				result += `safeAccess(${getData()}, '${value}', true), `
			} else {
				result += `safeAccess(${getData()}, '${value}'), `;
			}
		}
		if (text.substr(lastIndex).length > 0) {
			result += "'" + text.substr(lastIndex).replace(/\n/g, '').replace(/'/g, '\\\'') + "', ";
		}
		return result;
	}

	function makeAttributes(attrs) {
		let attributes = '{';
		let attr;

		while ((attr = attrRegExp.exec(attrs))) {
			if (attributes !== '{') attributes += ', ';
			attributes += '"' + attr[1].toLowerCase() + '": ' + handleText(attr[2] || attr[3]).replace(/,\s*$/, '');
		}
		return attributes + '}';
	}

 	// clean up code
	data = data.replace(commentRegExp, '').replace(/<(script|style)[^>]*?>((?:.|\n)*?)<\/\1>/gi, (g, x, m) => {
		if (x === 'style') {
			resultObject.styles.push(m);
		} else {
			resultObject.functions += m.trim().replace(/;$/, '');
		}
		return '';
	}).trim();

	resultObject.tagName = data.match(/^<([\w_-]+)>/)[1].toLowerCase();

	while (match = tagRegExp.exec(data)) {
		if (match.index < lastIndex) continue;
		let text = data.substring(lastIndex, match.index).replace(/^[ \t]+|[ \t]$/g, ' ').trim();
		lastIndex = match.index + match[0].length;
		if (text.length > 0) {
			resultObject.render += handleText(text);
		}
		if (match[2] === resultObject.tagName) continue;
		if (match[1]) {
			// closing tag
			let expected = tagStack.pop();
			if (expected !== match[2]) {
				throw new Error('Unexpected end of tag: ' + match[2] + '; expected to end ' + expected);
			}
			resultObject.render = resultObject.render.replace(/,\s*$/g, '') + ')), ';
		} else {
			// opening tag
			tagStack.push(match[2]);
			let attributes = makeAttributes(match[3]);
			resultObject.render += `new Tag('${match[2]}', ${attributes}`;
			if (!match[4]) {
				resultObject.render += ', [].concat(';
			} else {
				resultObject.render += '), ';
				tagStack.pop();
			}
		}
	}
	if (tagStack.length > 0) {
		throw new Error('Unclosed tags: ' + tagStack.join(', '));
	}
	if (data.substr(lastIndex).trim().length > 0) {
		resultObject.render += handleText(data.substr(lastIndex).replace(/^[ \t]+|[ \t]$/g, ' ').trim());
	}
	resultObject.render = resultObject.render.replace(/,\s*$/g, '');

	if (usesMerge) {
		resultObject.helperFunctions.push(merge);
		resultObject.helperFunctions.push(toArray);
	}
	if (usesSpread) {
		resultObject.helperFunctions.push(spread);
	}
	if (usesRenderStyle) {
		resultObject.helperFunctions.push(renderStyle);
	}
	resultObject.functions = resultObject.functions || '{}';
	resultObject.styles = resultObject.styles.length > 0 ? 'styles: ' + JSON.stringify(resultObject.styles) + ',' : '';
	resultObject.helperFunctions = resultObject.helperFunctions.join('\n');
	return baseCode.replace(syntax, (g, m) => resultObject[m]);
}
