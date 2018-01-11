import {isFn} from './utils';

let eventQueue = {};

function publishEvent(type, data) {
	data.name.indexOf('--event-') && trigger('--event-' + type, data);
}

export function trigger(name, data) {
	publishEvent('trigger', {name, data});
	if (!eventQueue[name]) return;
	for (let index in eventQueue[name]) {
		let result = eventQueue[name][index](data);
		if (result === false) break;
	}
}

export function on(name, fn) {
	if (!eventQueue[name]) {
		eventQueue[name] = [];
	}
	eventQueue[name].push(fn);
	publishEvent('register', {name, fn});
}

export function off(name, fn) {
	if (!isFn(fn)) {
		delete eventQueue[name];
		return publishEvent('unregister', {name});
	}
	for (let index in eventQueue[name]) {
		if (eventQueue[name][index] === fn) {
			delete eventQueue[name][index];
			return publishEvent('unregister', {name, fn});
		}
	}
}

export function one(name, fn) {
	on(name, function self() {
		fn.apply(this, arguments);
		off(name, self);
	});
}
