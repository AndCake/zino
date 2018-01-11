import {isFn, isObj, toArray} from './utils';

function attachEvent (el, events, host) {
	if (!isFn(el.addEventListener)) return;
	let findEl = (selector, target) => {
		let node = toArray(el.querySelectorAll(selector));
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

export function attachSubEvents(events) {
	let {subEvents, tag} = events;
	let count = {};
	// make sure that we only attach events if we are actually in browser context
	if (tag.addEventListener.toString().indexOf('[native code]') >= 0) {
		subEvents.events.forEach(event => {
			let el = event.tag;
			if (!isObj(el)) {
				// we have a selector rather than an element
				count[el] = (count[el] || 0) + 1;
				// turn the selector into the corresponding element
				el = tag.querySelectorAll(el)[count[el] - 1];
			}
			// if no events have been attached yet
			if (el && el.children.length > 0 && !el.children[0].__eventsAttached) {
				// attach children tag events to the shadow root
				attachEvent(el.children[0], event.childEvents, el);
				// attach host events directly to the component!
				attachEvent(el, event.hostEvents, el);
				el.children[0].__eventsAttached = true;
			}
		});
	}
}