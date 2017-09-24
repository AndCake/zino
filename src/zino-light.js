import {isObj, toArray, identity} from './utils';
import {Zino, actions, setDocument, setComponentLoader} from './facade';

let urlRegistry = window.zinoTagRegistry || {},
	dirtyTags = [],
	parseCode = identity,
	tagObserver = new MutationObserver(records => {
		records.forEach(record => {
			let added = record.addedNodes,
				removed = record.removedNodes;

			if (added.length > 0) {
				[].forEach.call(added, actions.mount);
			} else if (removed.length > 0) {
				[].forEach.call(removed, tag => {
					(tag.children && toArray(tag.querySelectorAll('[__ready]')) || []).concat(tag).forEach(actions.unmount);
				});
			}
		});
	});

window.Zino = Zino;
Zino.fetch = function(url, callback, cache, code) {
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
};
setComponentLoader((url, fn) => {
	Zino.fetch(url, (data, status) => {
		let path = url.replace(/[^\/]+$/g, '');
		if (status === 200) {
			let code;
			try {
				data = parseCode(data);
				code = new Function('return ' + data.replace(/url\((\\*['"])?(.*?)\1\)/g, function(g, quote, url) {
						if (url.indexOf('data:') === 0 || url.indexOf('http') === 0 || url.indexOf('//') === 0 || url.indexOf('/') === 0) return g;
						return 'url(' + path + url + ')';
					}).replace(/\bZino.import\s*\(/g, 'Zino.import.call({path: ' + JSON.stringify(path) + '}, ').trim().replace(/;$/, ''))();
				if (typeof code(() => {}, Zino) === 'function') {
					code = code();
				}
			} catch(e) {
				e.message = 'Unable to import tag ' + url.replace(/.*\//g, '') + ': ' + e.message;
				throw e;
			}
			fn(code);
		}
	}, true);
});
setDocument(window.document);

export {Zino};
export function setParser(fn) { parseCode = fn; }

Zino.on('--zino-rerender-tag', tag => dirtyTags.indexOf(tag) < 0 && dirtyTags.push(tag));
Zino.trigger('publish-style', '[__ready] { contain: content; }');
toArray(document.querySelectorAll('[rel="zino-tag"]')).forEach(tag => Zino.import(tag.href));
tagObserver.observe(document.body, {
	subtree: true,
	childList: true
});

requestAnimationFrame(function reRender() {
	while (dirtyTags.length > 0) {
		actions.render(dirtyTags.shift());
	}
	requestAnimationFrame(reRender);
});
