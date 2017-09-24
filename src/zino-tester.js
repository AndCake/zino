import * as core from './core';
import * as vdom from './vdom';
import {emptyFunc, merge, isObj} from './utils';
import {on, off, one, trigger} from './events';
import {parse} from './mustacheparser';
import fs from 'fs';
import path from 'path';
import colors from 'colors';
import Document from 'nano-dom';
import diff from 'fast-diff';
import {createHash} from 'crypto';
import readline from 'readline-sync';

const sha1 = data => createHash('sha1').update(data).digest('hex');
let fileName = null,
	tagPath,
	eventList = [];

merge(global, {
	Zino: {
		trigger, on, off, one,
		import: emptyFunc,
		fetch: emptyFunc
	},
	require: () => emptyFunc
});

on('publish-script', src => {
	let data = fs.readFileSync(path.resolve(tagPath, src), 'utf-8');
	trigger('--zino-addscript', data);
});

export function importTag(tagFile, document) {
	let data = fs.readFileSync(tagFile, 'utf-8');
	let code;
	tagPath = path.dirname(tagFile);
	try {
		// if we have HTML input
		if (data.trim().indexOf('<') === 0) {
			// convert it to JS
			data = parse(data);
		}
		code = new Function('return ' + data.replace(/\bZino.import\s*\(/g, 'Zino.import.call({path: ' + JSON.stringify(path.dirname(tagFile)) + '}, ').trim().replace(/;$/, ''))();
	} catch(e) {
		e.message = 'Unable to import tag ' + tagFile + ': ' + e.message;
		throw e;
	}
	code && core.registerTag(code, document, Zino);
}

export function clearImports() {
	core.flushRegisteredTags();
}

export function clearEvents() {
	eventList = eventList.filter(event => {
		if (!event.name.match(/^--|^publish-(?:style|script)$/)) {
			off(event.name);
			return false;
		}
		return true;
	});
}

export function matchesSnapshot(...args) {
	if (isObj(args[0])) {
		var {html, props = {}, name = '', callback = () => {}} = args[0];
	} else {
		var [html, props = {}, name = '', callback = () => {}] = args;
	}
	let code = new Document(html).body;

	name = name.replace(/[^a-zA-Z0-9._-]/g, '-');
	fileName = './test/snapshots/' + code.children[0].tagName.toLowerCase() + '-' + (name && name + '-' || '') + sha1(html + JSON.stringify(props) + callback.toString()).substr(0, 5);
	core.setResolveData((key, value) => sha1(key + '-' + JSON.stringify(value)));
	let {events, data} = core.mount(code.children[0], true);

	if (Object.keys(props).length > 0) {
		code.children[0].setProps(props);
	}

	callback(code.children[0]);

	let eventList = [];
	events = (events || []).forEach(e => eventList = eventList.concat(e.childEvents, e.hostEvents));
	events = Object.keys(eventList).map(el => {
		let obj = {};
		if (eventList[el]) {
			obj[eventList[el].selector] = Object.keys(eventList[el].handlers).map(event => {
				return `[${event} ${typeof eventList[el].handlers[event]}]${eventList[el].handlers[event].name}`;
			});
		}
		return obj;
	});

	let resultString = code.children[0].outerHTML + '\n' + JSON.stringify({data, events}, null, 2);
	resultString = resultString.replace(/\r\n/g, '\n');

	if (!fs.existsSync(path.dirname(fileName))) {
		fs.mkdirSync(path.dirname(fileName));
		writeResult(resultString);
	} else if (!fs.existsSync(fileName)) {
		writeResult(resultString);
	} else {
		let previousResult = fs.readFileSync(fileName, 'utf-8').replace(/\r/g, '');
		if (previousResult !== resultString) {
			// create a diff
			let diffResult = diff(previousResult, resultString);
			process.stderr.write('\nComponent ' + fileName + ' - snapshots don\'t match: \n');
			diffResult.forEach(part => {
				let color = part[0] === diff.DELETE ? 'red' : part[0] === diff.INSERT ? 'green' : 'gray';
				process.stderr.write(part[1][color]);
			});
			if (readline.question('\nDo you want to take the new snapshot as the reference snapshot (y/N)?') === 'y') {
				writeResult(resultString);
			} else {
				throw new Error('Snapshots don\'t match.');
			}
		}
	}
}
on('--zino-rerender-tag', core.render);
on('--event-register', obj => eventList.push(obj));

function writeResult(result) {
	fs.writeFileSync(fileName, result);
}
