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
			if (this.attributes[name] !== value) {
				this.attributes = this.attributes.filter(attr => attr.name !== name);
				value !== null && this.attributes.push({name, value});
				this.attributes.forEach((attr, idx) => this.attributes[this.attributes[idx].name] = this.attributes[idx].value);
			}
		},
		removeChild(ref) {
			for (var all in this.children) {
				if (this.children[all] === ref) {
					delete this.children[all]; // remove element
					break;
				}
			}
		},
		cloneNode() {
			let clone = DOM(this.tagName, '', this.parentNode);
			this.attributes.forEach(attr => clone.setAttribute(attr.name, attr.value));
			this.children.forEach(child => clone.children.push(child.cloneNode()));
			return clone;
		}
	};
}

function Text(text, parentNode) {
	var content = text;
	return {
		get text() {
			return content;
		},
		set text(value) {
			content = value;
		},
		parentNode,
		cloneNode() {
			return Text(content, this.parentNode);
		}
	};
}

export function parse(html, dom = DOM('root')) {
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
			currentDOM.children.push(Text(text, currentDOM));
		}
		if (match[1]) {
			// closing tag
			child = currentDOM;
			currentDOM = currentDOM.parentNode;
		} else {
			// opening tag
			child = DOM(match[2], match[3], currentDOM);
			currentDOM.children.push(child);
			if (!match[4] && selfClosingTags.indexOf(child.tagName) < 0) {
				// if it's not a self-closing tag, create a nesting level
				currentDOM = child;
			}
		}
	}
	// capture the text after the last found tag
	let text = html.substr(lastIndex);
	text && dom.children.push(Text(text, dom));

	return dom;
}

export function find(selector, dom) {
	let result = [];

	// for regular Browser DOM
	if (dom && typeof dom.ownerDocument !== 'undefined') {
		return [].slice.call(dom.querySelectorAll(selector));
	}

	// for virtual DOM
	dom && dom.children.forEach(child => {
		let attr;
		if (typeof child.text !== 'undefined') return;
		if (selector[0] === '#' && child.attributes.id === selector.substr(1) ||
			(attr = selector.match(/^\[(\w+)\]/)) && child.attributes[attr[1]] ||
			selector[0] === '.' && child.className.split(' ').indexOf(selector.substr(1)) >= 0 ||
			child.tagName === selector.split(/\[\.#/)[0]) {
			result.push(child);
		}
		result = result.concat(find(selector, child));
	});
	return result;
}
