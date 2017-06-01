import * as stache from './stache';
import {parse as html, find as $} from './htmlparser';
import {emptyFunc, isFn, isObj, error, uuid, merge, applyDiff, objectDiff} from './utils';
import {trigger, on, attachEvent} from './events';

let tagRegistry = {},
	dataRegistry = {},
	defaultFunctions = {
		'props': {},
		'mount': emptyFunc,
		'unmount': emptyFunc,
		'render': emptyFunc,

		getHost() { return this; },
		setProps(name, value) {
			let tag = this.getHost();
			if (isObj(name)) {
				merge(tag.props, name);
			} else {
				tag.props[name] = value;
			}
			if (!tag.mounting) {
				trigger('--zino-rerender-tag', tag);
			}
		}
	};

export let renderOptions = {
	resolveData(key, value) {
		let id = uuid();
		dataRegistry[id] = value;
		return id;
	}
};

export function registerTag(code, path, document) {
	let firstElement = html(code).children[0],
		tagName = firstElement.tagName,
		functions;

	// clean up path
	path = path.replace(/[^\/]+$/g, '');
	// remove recursive tag use and all style/script nodes
	code = code.replace(new RegExp('<\\/?' + tagName + '(?:\s+[^>]+)?>', 'ig'), '').replace(/<(style|script)[^>]*>(?:[^\s]|[^\S])*?<\/\1>/g, '');
	code = stache.parse(code);

	if (tagRegistry[tagName]) {
		// tag is already registered
		return;
	}

	handleStyles(firstElement);
	functions = handleScripts(firstElement, path);
	tagRegistry[tagName] = {functions, code, path, tagName};

	// initialize all occurences in provided context
	document && $(tagName, document).forEach(tag => initializeTag(tag, tagRegistry[tagName]));
}

export function mount(tag, ignoreRender) {
	if (!tag.tagName) return;
	let entry = tagRegistry[tag.tagName.toLowerCase()];
	if (!entry || tag.getAttribute('__ready')) return;
	if (ignoreRender) entry.functions.render = emptyFunc;
	return initializeTag.call(ignoreRender ? {noEvents: true} : this, tag, entry);
}

export function render(tag) {
	let subEvents = renderTag(tag);
	attachSubEvents(subEvents, tag);
}

export function flushRegisteredTags() {
	tagRegistry = {};
}

function initializeTag(tag, registryEntry) {
	// check if the tag has been initialized already
	if (tag['__s'] || !registryEntry) return;
	let functions = registryEntry.functions,
		isRendered;

	// copy all defined functions/attributes
	for (let all in functions) {
		let entry = functions[all];
		if (['mount', 'unmount', 'events', 'render'].indexOf(all) < 0) {
			if (isFn(entry)) {
				tag[all] = entry.bind(tag);
			} else {
				tag[all] = entry;
			}
		}
	}
	// if it has been pre-rendered
	if (tag.children.length > 0 && tag.children[0].className === '-shadow-root') {
		let sibling = tag.children[1];
		// remove original HTML content
		if (sibling && sibling.className === '-original-root') {
			tag.__i = sibling.innerHTML;
			setElementAttr(sibling, tag);
			sibling.parentNode.removeChild(sibling);
		}
		isRendered = true;
	} else {
		tag.__i = tag.innerHTML;
		setElementAttr(tag);
		tag.innerHTML = '<div class="-shadow-root"></div>';
	}
	// define basic properties
	Object.defineProperty(tag, 'body', {
		set(val) {
			tag.__i = val;
			setElementAttr(tag);
			trigger('--zino-rerender-tag', tag.getHost());
		},
		get() { return tag.__i; }
	});
	tag.__s = tag.setAttribute;
	tag.setAttribute = function(attr, val) {
		tag.__s(attr, val);
		trigger('--zino-rerender-tag', tag.getHost());
	};

	tag.__vdom = {};
	// call mount callback
	tag.props = merge({}, functions.props, getAttributes(tag, true));
	try {
		tag.mounting = true;
		functions.mount.call(tag);
		delete tag.mounting;
	} catch (e) {
		error('mount', tag.tagName, e);
	}

	// render the tag's content
	let subEvents = !isRendered && renderTag.call(this, tag) || {events:[]};

	// attach events
	let hostEvents = [],
		events = functions.events || [],
		childEvents = Object.keys(events).filter(all => {
			let isNotSelf = all !== ':host' && all !== tag.tagName;
			if (!isNotSelf) hostEvents.push({handlers: events[all], selector: all});
			return isNotSelf;
		}).map(e => ({selector: e, handlers: events[e]}));

	subEvents.events = subEvents.events.concat({childEvents, hostEvents, tag: this && this.noEvents ? tag.tagName : tag})

	if (!tag.attributes.__ready) {
		tag.__s('__ready', true);
	}
	if (!this || this.noEvents !== true) {
		// attach sub events
		attachSubEvents(subEvents, tag);
	} else {
		return subEvents;
	}
}

function renderTag(tag, registryEntry = tagRegistry[tag.tagName.toLowerCase()]) {
	let events = [],
		renderCallbacks = [];

	// do the actual rendering of the component
	let data = getAttributes(tag);
	let renderedDOM = registryEntry.code(data);
	renderedDOM.tagName = 'div';
	renderedDOM.setAttribute('class', '-shadow-root');

	// render all contained sub components
	for (let all in tagRegistry) {
		$(all, renderedDOM).forEach(subEl => {
			let subElEvents = initializeTag.call({
				noRenderCallback: true,
				noEvents: true
			}, subEl, tagRegistry[all]);
			events = events.concat(subElEvents.events);
			renderCallbacks = renderCallbacks.concat(subElEvents.renderCallbacks);
		});
	}

	// unmount all existing sub tags
	$('[__ready]', tag).forEach(unmountTag);
	let renderedSubElements = $('[__ready]', renderedDOM);
	if (tag.ownerDocument) {
		let diff = objectDiff(tag.__vdom, renderedDOM);
		if (diff !== false) {
			applyDiff(tag.children[0], diff);
			tag.__vdom = renderedDOM;
		}
	} else {
		tag.children[0].innerHTML = renderedDOM.innerHTML;
	}
	// simply render everything inside
	//tag.children[0].innerHTML = renderedDOM.innerHTML;

	renderedSubElements.length > 0 && $('[__ready]', tag).forEach((subEl, index) => {
		merge(subEl, renderedSubElements[index])
		renderedSubElements[index].getHost = defaultFunctions.getHost.bind(subEl);
	});

	if (!this || !this.noRenderCall) {
		renderCallbacks.forEach(callback => callback());
		registryEntry.functions.render.call(tag);
	} else {
		renderCallbacks.push(registryEntry.functions.render.bind(tag));
	}
	return {events, renderCallbacks, data};
}

function attachSubEvents(subEvents, tag) {
	let count = {};
	subEvents.events.forEach(event => {
		let el = event.tag;
		if (!isObj(el)) {
			count[el] = (count[el] || 0) + 1;
			el = $(el, tag)[count[el] - 1];
		}
		attachEvent(el.children[0], event.childEvents, el);
		attachEvent(el, event.hostEvents, el);
		isFn(el.onready) && el.onready();
	});
}

function unmountTag(tag) {
	let name = (tag.tagName || '').toLowerCase(),
		entry = tagRegistry[name];
	if (entry) {
		[].forEach.call(tag.attributes, attr => {
			// cleanup saved data
			if (attr.name.indexOf('data-') >= 0) {
				delete dataRegistry[attr.value];
			}
		});
		try {
			entry.functions.unmount.call(tag);
		} catch (e) {
			error('Unable to unmount tag ' + name, e);
		}
	}
}

function getAttributes(tag, propsOnly) {
	let attrs = {props: tag.props, element: tag.element, styles: tag.styles, body: tag.__i},
		props = {};

	[].forEach.call(tag.attributes, attribute => {
		let isComplex = attribute.name.indexOf('data-') >= 0 && attribute.value.substr(0, 2) === '--';
		attrs[attribute.name] || (attrs[attribute.name] = isComplex ? dataRegistry[attribute.value.replace(/^--|--$/g, '')] : attribute.value);
		if (attribute.name.indexOf('data-') === 0) {
			props[attribute.name.replace(/^data-/g, '').replace(/(\w)-(\w)/g, (g, m1, m2) => m1 + m2.toUpperCase())] = attrs[attribute.name];
		}
	});

	if (propsOnly) return props;
	return attrs;
}

function setElementAttr(source, target = source) {
	let baseAttrs = {};
	[].forEach.call(source.children, el => {
		if (el.text) return;
		let name = el.tagName.toLowerCase();
		if (baseAttrs[name]) {
			if (!baseAttrs[name].isArray) {
				baseAttrs[name] = [baseAttrs[name]];
				baseAttrs[name].isArray = true;
			}
			baseAttrs[name].push(el);
		} else {
			baseAttrs[name] = el;
		}
	});
	target.element = baseAttrs;
}

function handleStyles(element) {
	let tagName = element.tagName;
	$('link', element).forEach(link => {
		if (link.attributes.type === 'stylesheet') {
			trigger('publish-style', link);
		}
	});
	trigger('publish-style',
		$('style', element).map(style => {
			let code = style.innerHTML.replace(/<br>/g, '');
			return code.replace(/[\r\n]*([^@%\{;\}]+?)\{/gm, (global, match) => {
				var selectors = match.split(',').map(selector => {
					selector = selector.trim();
					if (selector.match(/:host\b/) ||
						selector.match(new RegExp(`^\\s*${tagName}\\b`)) ||
						selector.match(/^\s*(?:(?:\d+%)|(?:from)|(?:to)|(?:@\w+)|\})\s*$/)) {
						return selector;
					}
					return tagName + ' ' + selector;
				});
				return global.replace(match, selectors.join(','));
			}).replace(/:host\b/gm, tagName) + '\n';
		}).join('\n')
	);
}

function handleScripts(element, path) {
	let functions = merge({}, defaultFunctions);
	$('script', element).forEach(script => {
		let text = script.innerHTML.trim();
		if (script.attributes.src) {
			return trigger('publish-script', script);
		}
		try {
			text = text.replace(/\bZino\.import\s*\(/g, 'Zino.import.call({path: "' + path + '"}, ');
			merge(functions, new Function('return ' + text)());
		} catch (e) {
			error(`parse script ${text} in tag ${element.tagName}`, e);
		}
	});
	return functions;
}

on('--zino-unmount-tag', unmountTag);
on('--zino-mount-tag', mount);
