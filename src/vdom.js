import {uuid, toArray} from './utils';
import {trigger} from './events';

let tagFilter = [];
let tagsCreated = [];
let dataResolver = (attr, value) => {
	return attr;
};

function isArray(obj) {
	return Object.prototype.toString.call(obj) === '[object Array]';
}

export function hashCode(str) {
	let hash = 0, i, chr;
	for (i = 0; i < str.length; i++) {
		chr   = str.charCodeAt(i);
		hash  = ((hash << 5) - hash) + chr;
		hash |= 0;
	}
	return hash;
}

export function setDataResolver(resolver) {
	dataResolver = resolver;
}

export function Tag(tagName, attributes, ...children) {
	tagName = tagName.toLowerCase();
	attributes = attributes || {};
	let attributeHash = '';
	Object.keys(attributes).forEach(attr => {
		attributes[attr] = {name: attr, value: typeof attributes[attr] !== 'object' ? attributes[attr] : ('--' + dataResolver(attr, attributes[attr]) + '--')};
		attributeHash += attr + attributes[attr].value;
	});
	children = children.length === 1 && Array.isArray(children[0]) ? children[0] : children;
	let tag = {
		tagName,
		attributes,
		children: children.filter(child => child),
		__hash: hashCode(tagName + '!' + attributeHash + '@' + children.map(child => (child && child.__hash || child)).join('!'))
	};
	if (tagFilter.indexOf(tagName) >= 0) tagsCreated.push(tag);
	return tag;
}

/**
 * defines which VDOM nodes should be captured for getTagsCreated()
 * @param {Array} filter - an array of strings representing the tag names of the tags to be captured
 */
export function setFilter(filter) {
	tagFilter = filter;
}

/**
 * retrieves the list of tags that have been created since the last call of getTagsCreated()
 * @return {Array} - an array of VDOM nodes that were created
 */
export function clearTagsCreated() {
	tagsCreated = [];
}

/**
 * retrieves the list of tags that have been created since the last call of getTagsCreated()
 * @return {Array} - an array of VDOM nodes that were created
 */
export function getTagsCreated() {
	let created = tagsCreated;
	return created;
}

/**
 * Calculates the HTML structure as a String represented by the VDOM
 *
 * @param  {Object} node - the VDOM node whose inner HTML to generate
 * @return {String} - the HTML structure representing the VDOM
 */
export function getInnerHTML(node) {
	if (!node.children) return '';
	if (!isArray(node.children) && (typeof HTMLCollection !== 'undefined' && !(node.children instanceof HTMLCollection))) node.children = [node.children];

	return (isArray(node) && node || (typeof HTMLCollection !== 'undefined' && node.children instanceof HTMLCollection ? [].slice.call(node.children) : node.children)).map(child => {
		if (typeof child !== 'object') {
			return '' + child;
		} else if (isArray(child)) {
			return getInnerHTML(child);
		} else {
			let attributes = [''].concat(Object.keys(child.attributes).map(attr => attr+'="' + child.attributes[attr].value + '"'));
			if (['img', 'link', 'meta', 'input', 'br', 'area', 'base', 'param', 'source', 'hr', 'embed'].indexOf(child.tagName) < 0) {
				return `<${child.tagName}${attributes.join(' ')}>${getInnerHTML(child)}</${child.tagName}>`;
			} else {
				return `<${child.tagName}${attributes.join(' ')}/>`;
			}
		}
	}).join('');
}

function setAttribute(name, value) {
	// ignore setAttribute definition for custom tags
	if (this.tagName.indexOf('-') >= 0) return;
	HTMLElement.prototype.setAttribute.call(this, name, value);
	var el = this;
	do {
		delete el.__hash;
		el = el.parentNode;
	} while (el && el.__hash);
}

function attachSetAttribute(node) {
	node.setAttribute = setAttribute.bind(node);
	for (var index = 0, length = node.children.length, child; child = node.children[index], index < length; index += 1) {
		attachSetAttribute(child);
	}
}

/**
 * Creates a new DOM node
 *
 * @param  {Object|String} node - a VDOM node
 * @param  {Document} document - the document in which to create the DOM node
 * @return {Node} - the DOM node created (either a text element or an HTML element)
 */
function createElement(node, document) {
	let tag;
	if (typeof node !== 'object') {
		// we have a text node, so create one
		tag = document.createTextNode('' + node);
	} else {
		tag = document.createElement(node.tagName);
		// add all required attributes
		Object.keys(node.attributes).forEach((attr) => {
			tag.setAttribute(attr, node.attributes[attr].value);
		});
		// define it's inner structure
		tag.innerHTML = getInnerHTML(node);
		tag.__hash = node.__hash;
		attachSetAttribute(tag);
	}

	return tag;
}

function applyText(domChild, dom, node, document) {
	// simply apply the value
	if ((node || '').match(/<[\w:_-]+[^>]*>/)) {
		if (dom.childNodes.length === 1) {
			dom.innerHTML = node;
		} else {
			let html = document.createElement('span');
			html.innerHTML = node;
			dom.replaceChild(html, domChild);
		}
	} else {
		// it's just a text node, so simply replace the element with the text node
		dom.replaceChild(createElement((node || '').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'), document), domChild);
	}
}

/**
 * Applies a VDOM to an actual DOM, meaning that the state of the VDOM will be recreated on the DOM.
 * The end result is, that the DOM structure is the same as the VDOM structure. Existing elements will
 * be repurposed, new elements created where necessary.
 *
 * @param  {DOM} dom - the DOM to which the VDOM should be applied
 * @param  {Object} vdom - the VDOM to apply to the DOM
 * @param  {Document} document - the document that the DOM is based on, used for createElement() and createTextNode() calls
 */
export function applyDOM(dom, vdom, document) {
	if (!dom || !vdom) return;
	if (!isArray(vdom)) {
		// if we have a node
		if (!isArray(vdom.children)) vdom.children = [vdom.children];
		if (dom.__hash !== vdom.__hash) {
			// if the tag name is not the same
			if (vdom.tagName !== dom.tagName.toLowerCase()) {
				// replace the node entirely
				dom.parentNode.replaceChild(createElement(vdom, document), dom);
			} else {
				let attributes = Object.keys(vdom.attributes);
				// check all vdom attributes
				for (let attr, index = 0, len = attributes.length; attr = vdom.attributes[attributes[index]], index < len; index += 1) {
					// if the VDOM attribute is a non-object
					if (typeof attr.value !== 'object') {
						// check if it differs
						if (dom.getAttribute(attr.name) != attr.value) {
							// if so, apply it
							dom.setAttribute(attr.name, attr.value);
						}
					} else {
						// the attribute is an object
						if (dom.getAttribute(attr.name) && dom.getAttribute(attr.name).match(/^--|--$/g)) {
							// if it has a complex value, use the data resolver to define it on the DOM
							let id = dataResolver(attr.name, attr.value, dom.getAttribute(attr.name).replace(/^--|--$/g, ''));
							// only set the ID with markers so that we know it is supposed to be a complex value
							dom.setAttribute(attr.name, `--${id}--`);
						}
					}
				}
				// if we have too many attributes in our DOM
				let index = 0;
				while (dom.attributes.length > attributes.length) {
					let attr = dom.attributes[index];
					// if the respective attribute does not exist on the VDOM
					if (typeof vdom.attributes[attr.name] === 'undefined') {
						// remove it
						dom.removeAttribute(attr.name);
						index = 0;
						continue;
					}
					index += 1;
				}
			}
		}
	}

	// deal with the vdom's children
	let children = (isArray(vdom) ? vdom : vdom.__hash !== dom.__hash ? vdom.children : []);
	for (let index = 0, node, len = children.length; node = children[index], index < len; index += 1) {
		if (isArray(node)) return applyDOM(dom, node, document);
		let domChild = dom.childNodes[index];
		if (typeof domChild === 'undefined') {
			// does not exist, so it needs to be appended
			dom.appendChild(createElement(node, document));
		} else if (domChild.nodeType === 3) {
			// is a text node
			// if the VDOM node is also a text node
			if (typeof node === 'string' && domChild.nodeValue !== node) {
				applyText(domChild, dom, node, document);
			} else if (typeof node !== 'string') {
				// else replace with a new element
				dom.replaceChild(createElement(node, document), domChild);
			}
		} else if (domChild.nodeType === 1) {
			// is a normal HTML tag
			if (typeof node === 'object') {
				// the VDOM is also a tag, apply it recursively
				applyDOM(domChild, node, document);
			} else {
				applyText(domChild, dom, node, document);
			}
		}
	}
	if (dom.__hash !== vdom.__hash && dom.childNodes.length > children.length) {
		// remove superfluous child nodes
		for (let index = children.length, len = dom.childNodes.length; index < len; index += 1) {
			dom.removeChild(dom.childNodes[index]);
			len -= 1;
			index -= 1;
		}
	}
	dom.__hash = vdom.__hash;
	dom.setAttribute = setAttribute.bind(dom);
}
