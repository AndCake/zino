'use strict';

import {parse as html} from './htmlparser';
import {merge} from './utils';
import mustache from './mustacheparser';

function handleElement(element, data) {
	if (typeof element.text !== 'undefined') {
		element.text = mustache(element.text, data);
		return;
	}
	element.attributes.forEach(attr => {
		element.setAttribute(attr.name, mustache(attr.value, data));
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
				child.setAttribute(attr.name, mustache(attr.value, data));
			});
			handleElement(child, data);
		}
	}
}

export function parse(code) {
	let dom = html(code);
	let lastClone;
	return data => {
		let clone;
		if (!lastClone) {
			clone = dom.cloneNode();
		} else {
			// do a diff on the data
			if (data === lastClone.data) return lastClone;
			let diff = objectDiff(lastClone.data, data);

		}
		handleElement(clone, data);
		clone.data = data;
		return clone;
	}
}
