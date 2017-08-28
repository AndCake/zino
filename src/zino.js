import {registerTag, render} from './core';
import {parse} from './mustacheparser';
import {emptyFunc, isObj} from './utils';
import {on, one, off, trigger} from './events';

let urlRegistry = window.zinoTagRegistry || {},
	Zino,
	dirtyTags = [],
	tagObserver = new MutationObserver(records => {
		records.forEach(record => {
			let added = record.addedNodes,
				removed = record.removedNodes;

			if (added.length > 0) {
				[].forEach.call(added, tag => trigger('--zino-mount-tag', tag));
			} else if (removed.length > 0) {
				[].forEach.call(removed, tag => {
					(tag.children && $('[__ready]', tag) || []).concat(tag).forEach(subTag => trigger('--zino-unmount-tag', subTag));
				});
			}
		});
	});

function $(selector, context) {
	return [].slice.call(context.querySelectorAll(selector));
}

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

	import: function(path, callback = emptyFunc) {
		const register = (code) => {
			code && registerTag(code, document.body, Zino);
			callback();
		};

		let url = (this.path || '') + path;
		if (typeof path !== 'string') return register(path); 
		Zino.fetch(url, (data, status) => {
			let path = url.replace(/[^\/]+$/g, '');
			if (status === 200) {
				let code;
				try {
					// if we have HTML input
					if (data.trim().indexOf('<') === 0) {
						// convert it to JS
						data = parse(data);
					}
					code = new Function('return ' + data.replace(/url\((['"]?)(.*?)\1\)/g, function(g, quote, url) {
							if (url.indexOf('data:') === 0 || url.indexOf('http') === 0 || url.indexOf('//') === 0 || url.indexOf('/') === 0) return g;
							return g.replace(url, path + url);
						}).replace(/\bZino.import\s*\(/g, 'Zino.import.call({path: ' + JSON.stringify(path) + '}, ').trim().replace(/;$/, ''))();
				} catch(e) {
					e.message = 'Unable to import tag ' + url.replace(/.*\//g, '') + ': ' + e.message;
					throw e;
				}
				register(code);
			}
		}, true);
	}
};
window.Zino = Zino;
on('publish-style', data => {
	if (typeof data.tagName === 'string' && data.styles.length > 0) {
		if (document.getElementById('style:' + data.tagName)) return;
		let style = document.createElement('style');
		style.innerHTML = data.styles;
		style.id = 'style:' + data.tagName;
		document.head.appendChild(style);
	}
});
on('--zino-rerender-tag', tag => dirtyTags.indexOf(tag) < 0 && dirtyTags.push(tag));
trigger('publish-style', '[__ready] { contain: content; }');
$('[rel="zino-tag"]', document).forEach(tag => Zino.import(tag.href));
tagObserver.observe(document.body, {
	subtree: true,
	childList: true
});

requestAnimationFrame(function reRender() {
	while (dirtyTags.length > 0) {
		render(dirtyTags.shift());
	}
	requestAnimationFrame(reRender);
});
