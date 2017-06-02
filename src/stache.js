'use strict';

import {parse as html} from './htmlparser';
import {merge, isValue, isFn, isObj} from './utils';
import mustache from './mustacheparser';

function handleElement(element, data, options) {
	if (typeof element.text !== 'undefined') {
		element.text = mustache(element.text, data);
		return;
	}
	element.attributes.forEach(attr => {
		element.setAttribute(attr.name, mustache(attr.value, data, options));
	});
	for (let idx = 0, len = element.children.length, child; child = element.children[idx], idx < len; idx += 1) {
		if (typeof child.text !== 'undefined') {
			try {
				//if (data.test === false) { debugger; }
				child.text = mustache(child.text, data);
			} catch (e) {
				if (e.name === 'BlockEndError') {
					let index = idx + 1;
					let endBlock = new RegExp('{{\\s*/' + e.block + '\\s*}}', 'g');
					let match = null;
					while (element.children[index]) {
						if (element.children[index].text) {
							match = element.children[index].text.match(endBlock);
							if (match) break;
						}
						index += 1;
					}
					if (match) {
						// found it!

						// create copy of current node
						let blockStart = [child.cloneNode()];
						blockStart[0].text = blockStart[0].text.substr(e.position);

						let blockEnd = [element.children[index].cloneNode()];
						blockEnd[0].text = blockEnd[0].text.split(match[0])[0];

						// remove block start from current node
						child.text = child.text.substr(0, e.position - (e.block.length + 5));
						// remove block end from end node
						element.children[index].text = element.children[index].text.split(match[0]).pop();

						// create list of contents
						let list = element.children.slice(idx + 1, index);
						list = (blockStart[0].text.length > 0 ? blockStart : []).concat(list, blockEnd[0].text.length > 0 ? blockEnd : []);

						// remove existing elements
						element.children.splice(idx + 1, index - (idx + 1));

						// handle block
						if (e.condition !== false) {
							if (typeof e.condition !== 'object') {
								e.condition = [e.condition];
							}
							for (let all in e.condition) {
								let newList = list.map((el, index) => {
									let xData = merge({}, e.data, e.condition[all], {'.index': all, '.length': e.condition.length, '.': e.condition[all]});
									el = el.cloneNode();
									handleElement(el, xData);
									return el;
								});
								element.children.splice(idx + 1, 0, ...newList);
								idx += list.length;
							}
						}

						len = element.children.length;
						handleElement(element.children[idx + 1], data);
					}
				}
			}
		} else {
			// a regular tag
			child.attributes.forEach(attr => {
				child.setAttribute(attr.name, mustache(attr.value, data, options));
			});
			handleElement(child, data);
		}
	}
}

function cleanTextNodes(node) {
	if (node.children) {
		node.children.forEach((child, idx, list) => {
			if (child.children) {
				cleanTextNodes(child);
			} else if (typeof child.text !== 'undefined') {
				let indexDiff = 1;
				while (list[idx + indexDiff] && !list[idx + indexDiff].children && (typeof list[idx + indexDiff].text !== 'undefined')) {
					child.text += list[idx + indexDiff].text;
					indexDiff += 1;
				}
				list.splice(idx + 1, indexDiff - 1);
			}
		});
	}
}

export function parse(code, options) {
	let dom = html(code);
	return data => {
		let clone = dom.cloneNode();
		handleElement(clone, data, options);
		cleanTextNodes(clone);
		return clone;
	}
}

export function applyDOM(target, src, newSrc, context = '') {
	let removed = 0;
	Object.keys(src).forEach(key => {
		if (!isValue(src, key) || key === 'parentNode' || key === 'tagName') return;
		let isNode = (target instanceof Node || target[key] instanceof Node);
		let isComplex = isObj(src[key]);
		if (typeof document !== 'undefined' && isComplex && isNode) {
			// is complex and node
			if (typeof target[key] === 'undefined') {
				// does not exist in target
				if (context === 'attributes') {
					// has to be ignored
				} else {
					if (!newSrc[key]) {
						// does not exist in new version, remove it
						if (target.childNodes[key - removed]) {
							target.removeChild(target.childNodes[key - removed]);
							removed++;
						}
					} else if (typeof src[key].tagName !== 'undefined' && typeof newSrc[key].tagName !== 'undefined') {
						// is new tag
						let tag = document.createElement('i');
						tag.innerHTML = newSrc[key].outerHTML;
						key = parseInt(key, 10);
						if (target.childNodes[key]) {
							target.replaceChild(tag.children[0], target.childNodes[key]);
						} else {
							if (key >= target.childNodes.length) {
								target.appendChild(tag.children[0]);
							} else {
								target.insertBefore(tag.children[0], target.childNodes[key]);
							}
						}
					} else if (context === 'children' && src[key].children && typeof newSrc[key].children !== 'undefined') {
						// investigate children
						applyDOM(target.childNodes[key], src[key], newSrc[key] || newSrc, context);
					} else if (context === 'children' && typeof src[key].text !== 'undefined') {
						// is text
						let text = document.createTextNode(src[key].text);
						key = parseInt(key, 10);
						if (target.childNodes[key]) {
							target.replaceChild(text, target.childNodes[key]);
						} else {
							if (key >= target.childNodes.length) {
								target.appendChild(text);
							} else {
								target.insertBefore(text, target.childNodes[key]);
							}
						}
					} else if (context === 'children' && src[key].attributes) {
						// is attribute change
						applyDOM(target.childNodes[key], src[key], newSrc[key] || newSrc, context);
					} else {
						// is neither of all, just copy
						target[key] = src[key];
					}
				}
			} else {
				// target key exists
				if (context === 'children' && 1*key >= 0) {
					// checkout the child', key, src, target
					applyDOM(target.childNodes[1*key], src[key], newSrc[key] || newSrc, context);
				} else if (key === 'children' || key === 'attributes') {
					// Found children
					applyDOM(target, src[key], newSrc[key] || newSrc, ['children', 'attributes'].indexOf(context) >= 0 && key !== 'attributes' ? context : key);
				} else {
					// Found sth else
					applyDOM(target[key], src[key], newSrc[key] || newSrc, ['children', 'attributes'].indexOf(context) >= 0 && key !== 'attributes' ? context : key);
				}
			}
		} else {
			// no complex or no node
			if (context === 'attributes') {
				// set attribute
				isFn(target.setAttribute) && target.setAttribute(key, src[key]);
			} else {
				// copy it over
				target[key] = src[key];
			}
		}
	});
}
