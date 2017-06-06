import {registerTag, render} from './core';
import {emptyFunc, isObj} from './utils';
import {find as $} from './htmlparser';
import {on, one, off, trigger} from './events';

let urlRegistry = window.zinoTagRegistry || {},
	Zino,
	dirtyTags = [],
	tagObserver = new MutationObserver(records => {
		records.forEach(record => {
			let added = record.addedNodes,
				removed = record.removedNodes;

			if (added.length > 0) {
				[].forEach.call(added, tag => {
					(tag.children && $('*', tag) || []).concat(tag).forEach(subTag => trigger('--zino-mount-tag', subTag));
				});
			} else if (removed.length > 0) {
				[].forEach.call(removed, tag => {
					(tag.children && $('[__ready]', tag) || []).concat(tag).forEach(subTag => trigger('--zino-unmount-tag', subTag));
				});
			}
		});
	});

export default Zino = {
	on, one, off, trigger,

	fetch(url, callback, cache, code) {
		if (cache && urlRegistry[url] && !urlRegistry[url].callback) {
			return callback(urlRegistry[url], 200);
		} else if (isObj(urlRegistry[url])) {
			return urlRegistry[url].callback.push(callback);
		}
		urlRegistry[url] = code || {
			callback: [callback]
		};
		if (code) return;
		let req = new XMLHttpRequest();
		req.open('GET', url, true);
		req.onreadystatechange = () => {
			if (req.readyState === 4) {
				let callbacks = urlRegistry[url].callback;
				if (req.status === 200) {
					urlRegistry[url] = req.responseText;
				}
				if (!cache) delete urlRegistry[url];
				callbacks.forEach(cb => cb(req.responseText, req.status));
			}
		};
		req.send();
	},

	import(path, callback = emptyFunc) {
		let url = (this.path || '') + path;
		Zino.fetch(url, (data, status) => {
			if (status === 200) {
				registerTag(data, url, document.body);
				callback();
			}
		}, true);
	}
};
window.Zino = Zino;
on('publish-style', data => {
	if (typeof data === 'string' && data.length > 0) {
		let style = document.createElement('style');
		style.innerHTML = data;
		data = style;
	}
	data && document.head.appendChild(data);
});
on('publish-script', document.head.appendChild);
on('--zino-rerender-tag', tag => dirtyTags.push(tag));
trigger('publish-style', '[__ready] { contain: content; }');
$('[rel="zino-tag"]', document).forEach(tag => Zino.import(tag.href));
tagObserver.observe(document.body, {
	subtree: true,
	childList: true
});

requestAnimationFrame(function reRender() {
	dirtyTags.forEach(render);
	dirtyTags = [];
	requestAnimationFrame(reRender);
});
