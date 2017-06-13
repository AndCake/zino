import {isFn} from './utils';

let eventQueue = {};

export function trigger(name, data) {
	if (!eventQueue[name]) return;
	for (let index in eventQueue[name]) {
		name.indexOf('--event-') && trigger('--event-trigger', {name, fn: eventQueue[name][index], data});
		let result = eventQueue[name][index](data);
		if (result === false) break;
	}
}

export function on(name, fn) {
	if (!eventQueue[name]) {
		eventQueue[name] = [];
	}
	eventQueue[name].push(fn);
	name.indexOf('--event-') && trigger('--event-register', {name, fn});
}

export function off(name, fn) {
	if (!isFn(fn)) {
		delete eventQueue[name];
		return name.indexOf('--event-') && trigger('--event-unregister', {name});
	}
	for (let index in eventQueue[name]) {
		if (eventQueue[name][index] === fn) {
			delete eventQueue[name][index];
			return name.indexOf('--event-') && trigger('--event-unregister', {name, fn});
		}
	}
}

export function one(name, fn) {
	on(name, function self() {
		fn.apply(this, arguments);
		off(name, self);
	});
}

export function attachEvent (el, events, host) {
	if (!isFn(el.addEventListener)) return;
	let findEl = (selector, target) => {
		let node = [].slice.call(el.querySelectorAll(selector));
		while (node.length > 0 && target !== host) {
			if (node.indexOf(target) >= 0) return node[node.indexOf(target)];
			target = target.parentNode;
		}
		return false;
	};
	events.forEach(eventObj => {
		Object.keys(eventObj.handlers).forEach(event => {
			el.addEventListener(event, e => {
				let target;
				if (eventObj.selector === ':host' || (target = findEl(eventObj.selector, e.target))) {
					target && (target.getHost = () => host.getHost());
					eventObj.handlers[event].call(target || host, e);
				}
			}, false);
		});
	});
}
