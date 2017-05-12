/**
 * Merges all objects provided as parameters into the first parameter object
 *
 * @param  {...Object} args list of arguments
 * @return {Object}         the merged object (same as first argument)
 */
export function merge (target, ...args) {
	args.forEach(arg => {
		for (let all in arg) {
			if ((typeof HTMLElement !== 'undefined' && arg instanceof HTMLElement) || typeof propDetails(arg, all).value !== 'undefined' && (!target[all] || propDetails(target, all).writable)) {
				target[all] = arg[all];
			}
		}
	});

	return target;
}

function propDetails(obj, attribute) {
	return Object.getOwnPropertyDescriptor(obj, attribute) || {};
}

/**
 * Creates a diff of two JS objects. Includes attribute position check.
 *
 * @param  {Object} objA	the object to be compared
 * @param  {Object} objB 	the object to compare with
 * @return {Object,Boolean} false if both objects are deep equal, else the values of what is different
 */
export function objectDiff(objA, objB) {
	let result = {},
		partialDiff;
	Object.keys(objA).forEach((key, index) => {
		if (!isValue(objA, key)) return;
		if (typeof objB[key] === 'undefined') {
			result[key] = objA[key];
		} else if (Object.keys(objB)[index] !== key) {
			let bKey = Object.keys(objB)[index];
			result[bKey] = objB[bKey];
			result[key] = objA[key];
		} else if (typeof objA[key] !== 'object' || typeof objB[key] !== 'object') {
			if (objA[key] !== objB[key]) {
				result[key] = objB[key];
			}
		} else if (partialDiff = objectDiff(objA[key], objB[key])) {
			result[key] = partialDiff;
		}
	});
	Object.keys(objB).forEach((key, index) => {
		if (!isValue(objB, key)) return;
		if (typeof objA[key] === 'undefined') {
			result[key] = objB[key];
		}
	});
	if (Object.keys(result).length > 0) return result;
	return false;
}

export function error(method, tag, parentException) {
	if (parentException) {
		throw new Error('Error while calling ' + method + ' function of ' + tag + ': ' + (parentException.message || parentException), parentException.fileName, parentException.lineNumber);
	} else {
		parentException = tag;
		throw new Error(method + ': ' + (parentException.message || parentException), parentException.fileName, parentException.lineNumber);
	}
}

/**
 * Checks if the given arguments are the provided types, if they do no match, an exception is thrown.
 *
 * @param  {Array} args 	list of arguments provided to callee
 * @param  {Array} types 	list of data types expected for the provided arguments
 * @param  {String} api  	name of the API (callee name)
 */
export function checkParams(args, types, api) {
	for (var all in args) {
		if (types[all] && typeof args[all] !== types[all]) {
			throw new Error('API mismatch while using ' + api + ': Parameter ' + all + ' was supposed to be ' + types[all] + ' but ' + (typeof args[all]) + ' was given.');
		}
	}
}

/**
 * makes sure that accessing attributes on an unknown data value is safe
 *
 * @param  {Mixed} obj 	data to made safe for attribute access
 * @return {Object}     will always return an object
 */
export function safeAccess(obj) {
	return obj || {};
}

export function uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		let r = Math.random() * 16 | 0;
		return (c == 'x' ? r : r & 0x3 | 0x8).toString(16);
	});
}
export var isObj = obj => typeof obj === 'object';
export var isFn = fn => typeof fn === 'function';
export var emptyFunc = () => {};
export var identity = a => a;

function isValue(obj, key) {
	let descriptor = Object.getOwnPropertyDescriptor(obj, key);
	return typeof descriptor.value !== 'undefined' && !isFn(descriptor.value);
}
