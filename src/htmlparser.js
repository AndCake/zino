const
	tagRegExp = /<(\/?)([\w-]+)([^>]*?)(\/?)>/g,
	attrRegExp = /([\w_-]+)=(?:'([^']*?)'|"([^"]*?)")/g,
	commentRegExp = /<!--(?:[^-]|-[^-])*-->/g,
	selfClosingTags = 'br,img,input,source,hr,link,meta,wainclude'.split(',');

function parseAttributes(match) {
	let attributes = [];
	let attr;

	while ((attr = attrRegExp.exec(match))) {
		let idx = attributes.push({name: attr[1].toLowerCase(), value: attr[2] || attr[3]}) - 1;
		attributes[attributes[idx].name] = attributes[idx].value;
	}
	return attributes;
}

function DOM(tagName, match, parentNode) {
	let attributes = parseAttributes(match);

	// make sure all tag names are lower cased
	tagName = tagName && tagName.toLowerCase();

	return {
		tagName,
		attributes,
		children: [],
		parentNode,
		get outerHTML() {
			let attributes = [''].concat(this.attributes.map(attr => attr.name + '="' + attr.value + '"'));
			if (selfClosingTags.indexOf(this.tagName) >= 0) {
				return '<' + this.tagName + attributes.join(' ') + '/>';
			} else {
				return '<' + this.tagName + attributes.join(' ') + '>' + this.innerHTML + '</' + this.tagName + '>';
			}
		},
		get innerHTML() {
			return this.children.map(child => child.text || child.outerHTML).join('');
		},
		set innerHTML(value) {
			this.children = parse(value).children;
		},
		get className() {
			return this.attributes['class'] || '';
		},
		getAttribute(name) {
			return this.attributes[name];
		},
		setAttribute(name, value) {
			this.attributes = this.attributes.filter(attr => attr.name !== name);
			value !== null && this.attributes.push({name, value});
			this.attributes[name] = value;
		},
		removeChild(ref) {
			for (var all in this.children) {
				if (this.children[all] === ref) {
					delete this.children[all]; // remove element
					break;
				}
			}
		}
	};
}

export function parse(html, dom = new DOM('root')) {
	let match, lastIndex = 0,
		currentDOM = dom;

	// remove all comments in code & clean up scripts
	html = html.replace(commentRegExp, '').replace(/<(script|style)[^>]*?>((?:.|\n)*?)<\/\1>/g, (g, x, m) => g.replace(m, m.replace(/(['"])(.*?)\1/g, (g, m1, m2) => m1+m2.replace(/</g, '\\x3c')+m1))).trim();
	while (null !== (match = tagRegExp.exec(html))) {
		let child;
		let text = html.substring(lastIndex, match.index).replace(/^[ \t]+|[ \t]$/g, ' ');
		lastIndex = match.index + match[0].length;
		if (text.length > 0) {
			// if we have any text in between the tags, add it as text node
			currentDOM.children.push({text});
		}
		if (match[1]) {
			// closing tag
			child = currentDOM;
			currentDOM = currentDOM.parentNode;
		} else {
			// opening tag
			child = new DOM(match[2], match[3], currentDOM);
			currentDOM.children.push(child);
			if (!match[4] && selfClosingTags.indexOf(child.tagName) < 0) {
				// if it's not a self-closing tag, create a nesting level
				currentDOM = child;
			}
		}
	}
	// capture the text after the last found tag
	let text = html.substr(lastIndex);
	text && dom.children.push({text});

	return dom;
}

export function find(selector, dom) {
	const evaluateMatch = (value, operator, expected) => {
		if (!operator) return value === expected;
		if (operator === '^') return value.indexOf(expected) === 0;
		if (operator === '$') return value.lastIndexOf(expected) + expected.length === value.length;
		if (operator === '*') return value.indexOf(expected) >= 0;
		return false;
	};
	let result = [];

	// for regular Browser DOM
	if (dom && typeof dom.ownerDocument !== 'undefined') {
		return [].slice.call(dom.querySelectorAll(selector));
	}

	// for virtual DOM
	dom && dom.children.forEach(child => {
		let attr;
		if (child.text) return;
		if (selector[0] === '#' && child.attributes.id === selector.substr(1) ||
			(attr = selector.match(/^\[(\w+)\]/)) && child.attributes[attr[1]] ||
			(attr = selector.match(/^\[(\w+)(\^|\$|\*)?=(?:'([^']*)'|"([^"]*)"|([^\]])*)\]/)) && child.attributes[attr[1]] && evaluateMatch(child.attributes[attr[1]], attr[2], attr[3] || attr[4] || attr[5]) ||
			selector[0] === '.' && child.className.split(' ').indexOf(selector.substr(1)) >= 0 ||
			child.tagName === selector.split(/\[\.#/)[0]) {
			result.push(child);
		}
		result = result.concat(find(selector, child));
	});
	return result;
}
