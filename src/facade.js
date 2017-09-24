import {registerTag, render, mount, unmount, flushRegisteredTags} from './core';
import {emptyFunc, identity, isObj, toArray, isFn} from './utils';
import {on, one, off, trigger} from './events';

let document,
	loadComponent = emptyFunc;

export let Zino = {
	on, one, off, trigger,
	fetch: emptyFunc,

	import: function(path, callback = emptyFunc) {
		loadComponent((this.path || '') + path, code => {
			if (code) {
				isFn(code.setDocument) && code.setDocument(document);
				registerTag(code, document.body, Zino);
			}
			callback();
		})
	}
};

export let actions = {mount, render, unmount};
export function setDocument(doc) { document = doc; }
export function setComponentLoader(fn) { loadComponent = fn; }
export {flushRegisteredTags};

on('publish-style', data => {
	if (typeof data.tagName === 'string' && data.styles && data.styles.length > 0) {
		if (document.getElementById('style:' + data.tagName)) return;
		let style = document.createElement('style');
		style.innerHTML = data.styles;
		style.setAttribute('id', 'style:' + data.tagName);
		document.head.appendChild(style);
	}
});
