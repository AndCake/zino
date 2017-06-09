import {uuid} from './utils';
import {trigger} from './events';

let tagFilter = [];
let tagsCreated = [];
let dataResolver = (attr, value) => {
	return attr;
};

function isArray(obj) {
	return Object.prototype.toString.call(obj) === '[object Array]';
}

export function setDataResolver(resolver) {
	dataResolver = resolver;
}

export function Tag(tagName, attributes, children) {
	tagName = tagName.toLowerCase();
	children = children && (typeof children !== 'object' || children.tagName) ? [children] : children || [];
	let tag = {
		tagName,
		attributes: attributes || {},
		children: children,
		__complexity: children.reduce(((a, b) => a + (b.__complexity || 1)), 0) + children.length
	};
	if (tagFilter.indexOf(tagName) >= 0) tagsCreated.push(tag);
	return tag;
}

export function getElementsByTagName(name, dom) {
	let result = [];
	name = (name || '').toLowerCase();
	if (typeof dom.getElementsByTagName === 'function') return [].slice.call(dom.getElementsByTagName(name));

	if (dom.children) {
		result = result.concat(dom.children.filter(child => child.tagName && child.tagName.toLowerCase() === name));
		dom.children.forEach(child => {
			result = result.concat(getElementsByTagName(name, child));
		});
	}
	return result;
}

export function setFilter(filter) {
	tagFilter = filter;
}

export function getTagsCreated() {
	let created = tagsCreated;
	tagsCreated = [];
	return created;
}

export function getInnerHTML(node) {
	if (!node.children) return '';
	if (!isArray(node.children)) node.children = [node.children];

	return (isArray(node) && node || node.children).map(child => {
		if (typeof child !== 'object') {
			return '' + child;
		} else if (isArray(child)) {
			return getInnerHTML(child);
		} else {
			let attributes = [''].concat(Object.keys(child.attributes).map((attr) => {
				if (typeof child.attributes[attr] === 'object') {
					return attr + '="--' + dataResolver(attr, child.attributes[attr]) + '--"';
				} else {
					return attr+'="' + child.attributes[attr] + '"';
				}
			}));
			return `<${child.tagName}${attributes.join(' ')}>${getInnerHTML(child)}</${child.tagName}>`;
		}
	}).join('');
}

function createElement(node, document) {
	let tag;
	if (typeof node !== 'object') {
		tag = document.createTextNode('' + node);
	} else {
		tag = document.createElement(node.tagName);
		Object.keys(node.attributes).forEach((attr) => {
			tag.setAttribute(attr, node.attributes[attr]);
		});
		if (node.__vdom) {
			trigger('--zino-initialize-node', {tag, node});
		}
		tag.innerHTML = getInnerHTML(node);
	}

	return tag;
}

export function applyDOM(dom, vdom, document) {
	if (!isArray(vdom)) {
		if (!isArray(vdom.children)) vdom.children = [vdom.children];
		if (vdom.tagName !== dom.tagName.toLowerCase()) {
			dom.parentNode.replaceChild(createElement(vdom, document), dom);
		} else {
			Object.keys(vdom.attributes).forEach(attr => {
				if (typeof vdom.attributes[attr] !== 'object') {
					if (dom.getAttribute(attr) != vdom.attributes[attr]) {
						dom.setAttribute(attr, vdom.attributes[attr]);
					}
				} else {
					if (dom.getAttribute(attr) && dom.getAttribute(attr).match(/^--|--$/g)) {
						let id = dataResolver(attr, vdom.attributes[attr], dom.getAttribute(attr).replace(/^--|--$/g, ''));
						dom.setAttribute(attr, `--${id}--`);
					}
				}
			});
			if (dom.attributes.length > Object.keys(vdom.attributes)) {
				[].forEach.call(dom.attributes, attr => {
					if (typeof vdom.attributes[attr.name] === 'undefined') {
						dom.removeAttribute(attr.name);
					}
				})
			}
		}
	}
	let children = (isArray(vdom) ? vdom : vdom.children);
	children.forEach((node, index) => {
		if (isArray(node)) return applyDOM(dom, node, document);
		let domChild = dom.childNodes[index];
		if (typeof domChild === 'undefined') {	// does not exist
			dom.appendChild(createElement(node, document));
		} else if (domChild.nodeType === 3) {	// is a text node
			if (typeof node === 'string' && domChild.nodeValue !== node) {
				domChild.nodeValue = node;
			} else if (typeof node !== 'string') {
				dom.replaceChild(createElement(node, document), domChild);
			}
		} else if (domChild.nodeType === 1) {	// is a normal HTML tag
			if (typeof node === 'object') {
				applyDOM(domChild, node, document);
			} else {
				dom.replaceChild(createElement(node, document), domChild);
			}
		}
	});
	if (dom.childNodes.length > children.length) {
		// remove superfluous child nodes
		[].slice.call(dom.childNodes, children.length).forEach(child => dom.removeChild(child));
	}
}
