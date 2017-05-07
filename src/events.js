import {find} from './htmlparser';

let eventQueue = {};

export function trigger(name, data) {
	if (!eventQueue[name]) return;
	for (let index in eventQueue[name]) {
		let event = eventQueue[name][index];
		let result = event(data);
		if (result === false) break;
	}
}

export function on(name, fn) {
	if (!eventQueue[name]) {
		eventQueue[name] = [];
	}
	eventQueue[name].push(fn);
}

export function off(name, fn) {
	if (typeof fn !== 'function') {
		delete eventQueue[name];
		return;
	}
	for (let index in eventQueue[name]) {
		if (eventQueue[name][index] === fn) {
			delete eventQueue[name][index];
			return;
		}
	}
}

export function one(name, fn) {
	let self;
	on(name, self = () => {
		fn.apply(this, arguments);
		off(name, self);
	});
}

export function attachEvent (el, events, host) {
	if (typeof el.addEventListener !== 'function') return;
	events.forEach((eventObj) => {
		Object.keys(eventObj.handlers).forEach((event) => {
			el.addEventListener(event, e => {
				if (find(eventObj.selector, el).indexOf(e.target) >= 0) {
					e.target.getHost = () => host;
					eventObj.handlers[event].call(e.target, e);
				}
			}, false);
		});
	});
}
