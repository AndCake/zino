import {uuid} from './utils';
import {initializeNode} from './core';

let tagFilter = [];
let tagsCreated = [];

function isArray(obj) {
	return Object.prototype.toString.call(obj) === '[object Array]';
}

export function Tag(tagName, attributes, children) {
	tagName = tagName.toLowerCase();
	let tag = {
		tagName,
		attributes: attributes || {},
		children: children || []
	};
	if (tagFilter.indexOf(tagName) >= 0) tagsCreated.push(tag);
	return tag;
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
			let attributes = [''].concat(Object.keys(child.attributes).map((attr) => attr+'="' + child.attributes[attr] + '"'));
			return `<${child.tagName}${attributes.join(' ')}>${getInnerHTML(child)}</${child.tagName}>`;
		}
	}).join('');
}

function createElement(node) {
	let tag;
	if (typeof node !== 'object') {
		tag = document.createTextNode('' + node);
	} else {
		tag = document.createElement(node.tagName);
		Object.keys(node.attributes).forEach((attr) => {
			tag.setAttribute(attr, node.attributes[attr]);
		});
		if (node.__vdom) {
			initializeNode(tag, node);
		}
		tag.innerHTML = getInnerHTML(node);
	}

	return tag;
}

export function applyDOM(dom, vdom, dataRegistry) {
	if (!isArray(vdom)) {
		if (!isArray(vdom.children)) vdom.children = [vdom.children];
		if (vdom.tagName !== dom.tagName.toLowerCase()) {
			dom.parentNode.replaceChild(createElement(vdom), dom);
		} else {
			Object.keys(vdom.attributes).forEach(attr => {
				if (typeof vdom.attributes[attr] !== 'object') {
					if (dom.getAttribute(attr) != vdom.attributes[attr]) {
						dom.setAttribute(attr, vdom.attributes[attr]);
					}
				} else {
					if (dom.getAttribute(attr) && dataRegistry[dom.getAttribute(attr).replace(/^--|--$/g, '')] !== vdom.attributes[attr]) {
						let id = uuid();
						// unregister old entry
						delete dataRegistry[dom.getAttribute(attr).replace(/^--|--$/g, '')];
						// register new one
						dataRegistry[id] = vdom.attributes[attr];
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
		if (isArray(node)) return applyDOM(dom, node, dataRegistry);
		if (typeof dom.childNodes[index] === 'undefined') {	// does not exist
			dom.appendChild(createElement(node));
		} else if (dom.childNodes[index].nodeType === 3) {	// is a text node
			if (typeof node === 'string' && dom.childNodes[index].nodeValue !== node) {
				dom.childNodes[index].nodeValue = node;
			} else if (typeof node !== 'string') {
				dom.replaceChild(createElement(node), dom.childNodes[index]);
			}
		} else if (dom.childNodes[index].nodeType === 1) {	// is a normal HTML tag
			if (typeof node === 'object') {
				applyDOM(dom.childNodes[index], node, dataRegistry);
			} else {
				dom.replaceChild(createElement(node), dom.childNodes[index]);
			}
		}
	});
	if (dom.childNodes.length > children.length) {
		// remove superfluous child nodes
		[].slice.call(dom.childNodes, children.length).forEach(child => dom.removeChild(child));
	}
}
