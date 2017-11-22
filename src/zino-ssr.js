import {Zino, setComponentLoader, actions, setDocument, flushRegisteredTags} from './facade';
import {getDataRegistry, setDataRegistry} from './core';
import Document from 'nano-dom';
import NowPromise from 'now-promise';

let basePath = './';
let extBasePath = '';
let staticBasePath = '';
let componentRegistry = {};
let document = null;
let collector = function(callback) { callback(); };

if (typeof global !== 'undefined') {
	global.Zino = Zino;
}

Zino.isBrowser = false;
Zino.isServer = true;

setComponentLoader((path, fn) => {
	let originalExtBasePath = extBasePath;
	if (originalExtBasePath.length > 0 && originalExtBasePath.split('').pop() !== '/') originalExtBasePath += '/';
	extBasePath += path.split('/').slice(0, -1).join('/') + '/';
	try {
		let code = require(basePath + originalExtBasePath + path);
		let element = code(() => {}, Zino);
		let isDeep = false;
		if (typeof element === 'function') {
			element = element(() => {}, Zino);
			isDeep = true;
		}
		let tagName = element.tagName || (isDeep ? code() : code).name.replace(/([a-z])([A-Z])/g, (g, end, beginning) => end + '-' + beginning).toLowerCase();
		componentRegistry[tagName] = {path: originalExtBasePath + path, code: code.toString()};
		fn(isDeep ? code() : code);
	} catch(e) {
		e.message = 'Unable to load component ' + path + ': ' + e.message;
		throw e;
	} finally {
		extBasePath = originalExtBasePath;
	}
});
Zino.on('--zino-rerender-tag', actions.render);

export function setBasePath(path) {
	basePath = path;
	if (basePath[basePath.length - 1] !== '/') {
		basePath += '/';
	}
}
export function setStaticBasePath(path) {
	staticBasePath = path;
	if (staticBasePath[staticBasePath.length - 1] !== '/') {
		staticBasePath += '/';
	}
}

export function setCollector(fn) {
	collector = fn;
}

export var zino = Zino;

function toJSON(obj) {
	if (typeof obj === 'string') {
		return `"${obj.replace(/"/g, '\\"')}"`;
	}
	if (obj === null) return 'null';
	if (obj === undefined) return 'undefined';
	if (typeof obj !== 'object') {
		return obj.toString();
	}
	if (Object.prototype.toString.call(obj) === '[object Array]') {
		return '[' + obj.map(entry => toJSON(entry)) + ']';
	}
	return '{' + Object.keys(obj).map(entry => {
		return `"${entry}": ${toJSON(obj[entry])}`;
	}).join(',') + '}';
}

/** renders a single component */
export function renderComponent(name, path, props) {
	flushRegisteredTags();
	setDataRegistry({});

	document = new Document('<' + name + '></' + name + '>');
	let renderedComponents = [];
	let linkTags = [];

	setDocument(document);
	// initialize props
	document.body.children[0].props = props;

	return new NowPromise((resolve, reject) => {
		// import and render component
		try {
			Zino.import(path);
		} catch(e) {
			return reject(e);
		}
		collector(function(err) {
			if (err) {
				reject(err);
				return;
			}
			let registryList = [];
			document.body.querySelectorAll('[__ready]').forEach(component => {
				if (component.__i) {
					let div = document.createElement('div');
					div.setAttribute('class', '-original-root');
					div.innerHTML = component.__i;
					component.appendChild(div);
				}
				let name = component.tagName;
				if (componentRegistry[name] && registryList.indexOf(name) < 0) {
					registryList.push(name);
					renderedComponents.push('window.zinoTagRegistry["' + staticBasePath + componentRegistry[name].path + '"]=' + JSON.stringify(componentRegistry[name].code));
				}
			});
			let dataRegistry = getDataRegistry();
			let styles = document.head.innerHTML;
			let output = document.body.innerHTML;
			let preloader = '<script>window.zinoDataRegistry = window.zinoDataRegistry || {}; ';
			preloader += 'window.zinoTagRegistry = window.zinoTagRegistry || {};\n';
			preloader += renderedComponents.join(';\n') + ';\n';
			preloader += Object.keys(dataRegistry).map(entry => `window.zinoDataRegistry["${entry}"] = ${toJSON(dataRegistry[entry])}`).join(';\n');
			preloader += '</script>';

			let result = {
				styles,
				preloader,
				body: output,
				components: componentRegistry
			};
			result.toString = function() {
				return styles + output + preloader;
			};

			resolve(result);
		});
	});
}
