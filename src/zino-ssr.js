import {Zino, setComponentLoader, actions, setDocument, flushRegisteredTags} from './facade';
import Document from 'nano-dom';

let basePath = './';
let extBasePath = '';
let staticBasePath = '';
let componentRegistry = {};
let document = null;
let collector = function(callback) { callback(); };

if (typeof global !== 'undefined') {
	global.Zino = Zino;
}

function SyncPromise(fn) {
	let resolveValue, rejectValue;

	this.then = function(resolve, reject) {
		return new SyncPromise(function(resFn, rejFn) {
			if (!rejectValue) {
				resFn(resolve(resolveValue));
			} else {
				rejFn(reject(rejectValue));
			}
		});
	};
	this.catch = function(reject) {
		if (rejectValue) {
			reject(rejectValue);
		}
	};

	function resolveFn(data) {
		resolveValue = data;
	}
	function rejectFn(data) {
		rejectValue = data || 'Error';
	}
	fn(resolveFn, rejectFn);
}

let Promised = typeof Promise === 'undefined' ? SyncPromise : Promise;

setComponentLoader((path, fn) => {
	let originalExtBasePath = extBasePath;
	if (originalExtBasePath.length > 0 && originalExtBasePath.split('').pop() !== '/') originalExtBasePath += '/';
	extBasePath += path.split('/').slice(0, -1).join('/');
	try {
		let code = require(basePath + originalExtBasePath + path);
		let element = code(() => {}, Zino);
		let isDeep = false;
		if (typeof element === 'function') {
			element = element(() => {}, Zino);
			isDeep = true;
		}
		componentRegistry[element.tagName] = {path: originalExtBasePath + path, code: code.toString()};
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

/** renders a single component */
export function renderComponent(name, path, props) {
	flushRegisteredTags();

	document = new Document('<' + name + '></' + name + '>');
	let renderedComponents = [];
	let linkTags = [];

	(typeof global !== 'undefined' ? global : this).document = document;
	setDocument(document);
	// initialize props
	document.body.children[0].props = props;
	// import and render component
	Zino.import(path);

	return new Promised((resolve, reject) => {
		collector(function(err) {
			if (err) {
				reject(err);
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
			let styles = document.head.innerHTML;
			let output = document.body.innerHTML;
			let preloader = '<script>window.zinoTagRegistry = window.zinoTagRegistry || {};\n' + renderedComponents.join(';\n') + '</script>';

			resolve(styles + output + preloader);
		});
	});
}