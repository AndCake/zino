const tagRegExp = /<(\/?)([\w-]+)([^>]*?)(\/?)>/g;
const attrRegExp = /([\w_-]+)=(?:'([^']*?)'|"([^"]*?)")/g;
const commentRegExp = /<!--(?:[^-]|-[^-])*-->/g;
const syntax = /\{\{\s*([^\}]+)\s*\}\}\}?/g;
const safeAccess = 'function safeAccess(t,e,r){if(!e)return t;if("."===e[0])return t[e];for(e=e.split(".");e.length>0&&void 0!==(t=t[e.shift()]););return"string"==typeof t&&r===!0?t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;").replace(/>/g,"&gt;"):"function"==typeof t?t.call(__i):"number"==typeof t?t:t||""}'/*`function safeAccess(obj, attrs, escape) {
	if (!attrs) return obj;
	if (attrs[0] === '.') {
		return obj[attrs];
	}
	attrs = attrs.split('.');
	while (attrs.length > 0 && typeof (obj = obj[attrs.shift()]) !== 'undefined');
	if (typeof obj === 'string' && escape === true) {
		return obj.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/>/g, '&gt;');
	} else if (typeof obj === 'function') {
		return obj.call(instance);
	} else {
		return typeof obj === 'number' ? obj : (obj || '');
	}
}`*/;
const toArray = 'function toArray(t,e){var r=safeAccess(t,e);return r?"[object Array]"===Object.prototype.toString.call(r)?r:"function"==typeof r?r():[r]:[]}'/*`function toArray(data, value) {
	var dataValue = safeAccess(data, value);
	if (dataValue) {
		if (Object.prototype.toString.call(dataValue) === '[object Array]') {
			return dataValue;
		} else if (typeof dataValue === 'function') {
			return dataValue();
		} else return [dataValue];
	} else {
		return [];
	}
}`*/;
const spread = 'function spread(t){var e=[];return t.forEach(function(t){e=e.concat(t)}),e}'/*`function spread(array) {
	var result = [];
	array.forEach(function(entry) {
		result = result.concat(entry);
	});
	return result;
}`*/;
const merge = 'function merge(t){return[].slice.call(arguments,1).forEach(function(e){for(var r in e)t[r]=e[r]}),t}'/*`function merge(target) {
	[].slice.call(arguments, 1).forEach(function (arg) {
		for (var all in arg) {
			target[all] = arg[all];
		}
	});

	return target;
}`*/;
const renderStyle = 'function renderStyle(t,r){var e="";if(transform=function(t){return"function"==typeof t?transform(t.apply(r)):t+("number"==typeof t&&null!==t?r.styles&&r.styles.defaultUnit||"px":"")},"object"==typeof t)for(var n in t)e+=n.replace(/[A-Z]/g,function(t){return"-"+t.toLowerCase()})+":"+transform(t[n])+";";return e}'/*`function renderStyle(value, context) {
	var style = '';
		transform = function(val) {
			if (typeof val === 'function') return transform(val.apply(context));
			return val + (typeof val === 'number' && val !== null ? context.styles && context.styles.defaultUnit || 'px' : '');
		};

	if (typeof value === 'object') {
		for (var all in value) {
			style += all.replace(/[A-Z]/g, function(g){ return '-' + g.toLowerCase()}) + ':' + transform(value[all]) + ';';
		}
	}

	return style;
}`*/;
const baseCode = 'function (Tag){var __i;{{helperFunctions}};return{tagName:"{{tagName}}",{{styles}}render:function(data){return __i=this,[].concat({{render}})},functions:{{functions}}}}'/*`function(Tag) {
	var instance = null;
	{{helperFunctions}}

	return {
		tagName: '{{tagName}}',
		{{styles}}
		render: function(data) {
			instance = this;
			return [].concat({{render}})
		},

		functions: {{functions}}
	};
}`*/;

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

	function handleText(text, isAttr) {
		let match, result = '', lastIndex = 0;
		let cat = isAttr ? ' + ' : ', ';
		if (!text.match(syntax)) {
			return result += "'" + text.substr(lastIndex).replace(/\n/g, '').replace(/'/g, '\\\'') + "'" + cat;
		}
		while (match = syntax.exec(text)) {
			if (match.index < lastIndex) continue;
			let frag = text.substring(lastIndex, match.index).trim()
			if (frag.length > 0) {
				result += "'" + frag.replace(/\n/g, '').replace(/'/g, '\\\'') + "'" + cat;
			}
			lastIndex = match.index + match[0].length;
			let key = match[1];
			let value = key.substr(1);
			if (key[0] === '#') {
				result += `spread(toArray(${getData()}, '${value}').map(function (e, i, a) {
						var data$${level + 1} = merge({}, data${0 <= level ? '' : '$' + level}, {'.': e, '.index': i, '.length': a.length}, e);
						return [`;
				level += 1;
				usesMerge = true;
				usesSpread = true;
			} else if (key[0] === '/') {
				result += '\'\']; }))' + (isAttr ? '.join("")' : '') + cat;
				level -= 1;
				if (level < 0) {
					throw new Error('Unexpected end of block: ' + key.substr(1));
				}
			} else if (key[0] === '!') {
				// ignore comments
				result += '';
			} else if (key[0] === '^') {
				result += `(safeAccess(${getData()}, '${value}') && (typeof safeAccess(${getData()}, '${value}') === 'boolean' || safeAccess(${getData()}, '${value}').length > 0)) ? '' : spread([1].map(function() { var data$${level + 1} = merge({}, data${0 <= level ? '' : '$' + level}); return [`;
				usesSpread = true;
				level += 1;
			} else if (key[0] === '%') {
				result += key.substr(1).split(/\s*,\s*/).map(value => `renderStyle(safeAccess(${getData()}, '${value}'), ${getData()})`).join(' + ');
				usesRenderStyle = true;
			} else if (key[0] === '+') {
				result += `safeAccess(${getData()}, '${value}')${cat}`;
			} else if (key[0] !== '{') {
				value = key;
				result += `''+safeAccess(${getData()}, '${value}', true)${cat}`
			} else {
				result += `''+safeAccess(${getData()}, '${value}')${cat}`;
			}
		}
		if (text.substr(lastIndex).length > 0) {
			result += "'" + text.substr(lastIndex).replace(/\n/g, '').replace(/'/g, '\\\'') + "'" + cat;
		}
		return result;
	}

	function makeAttributes(attrs) {
		let attributes = '{';
		let attr;

		while ((attr = attrRegExp.exec(attrs))) {
			if (attributes !== '{') attributes += ', ';
			attributes += '"' + attr[1].toLowerCase() + '": ' + handleText(attr[2] || attr[3], true).replace(/\s*[,+]\s*$/g, '');
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

	if (!data.match(tagRegExp)) {
		throw new Error('No proper component provided');
	}
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
	if (level > 0) {
		throw new Error('Unexpected end of block');
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
	return baseCode.replace(/\{\{([^\}]+)\}\}/g, (g, m) => resultObject[m]);
}
