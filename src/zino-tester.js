import * as core from './core';
import {emptyFunc, merge} from './utils';
import {on} from './events';
import {parse} from './htmlparser';
import fs from 'fs';
import path from 'path';
import colors from 'colors';
import diff from 'fast-diff';
import {createHash} from 'crypto';
import readline from 'readline-sync';

const sha1 = data => createHash('sha1').update(data).digest('hex');
let fileName = null;

merge(global, {
	Zino: {
		trigger: emptyFunc,
		on: emptyFunc,
		off: emptyFunc,
		one: emptyFunc,
		import: emptyFunc,
		fetch: emptyFunc
	},
	setTimeout: emptyFunc,
	setInterval: emptyFunc
});

export function importTag(tagFile) {
	let code = fs.readFileSync(tagFile, 'utf-8');
	core.registerTag(code, tagFile);
}

export function clearImports() {
	core.flushRegisteredTags();
}

export function matchesSnapshot(html, props = {}, name = '') {
	let code = parse(html);
	fileName = './test/snapshots/' + code.children[0].tagName + '-' + (name && name + '-' || '') + sha1(html + JSON.stringify(props)).substr(0, 5);
	core.renderOptions.resolveData = (key, value) => sha1(key + '-' + JSON.stringify(value));
	let {events, data} = core.mount(code.children[0], true);

	if (Object.keys(props).length > 0) {
		code.children[0].setProps(props);
	}

	let eventList = [];
	events = events.forEach(e => eventList = eventList.concat(e.childEvents, e.hostEvents));
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

	if (!fs.existsSync(path.dirname(fileName))) {
		fs.mkdirSync(path.dirname(fileName));
		writeResult(resultString);
	} else if (!fs.existsSync(fileName)) {
		writeResult(resultString);
	} else {
		let previousResult = fs.readFileSync(fileName, 'utf-8');
		if (previousResult !== resultString) {
			// create a diff
			let diffResult = diff(previousResult, resultString);
			diffResult.forEach(part => {
				let color = part[0] === diff.DELETE ? 'red' : part[0] === diff.INSERT ? 'green' : 'gray';
				process.stderr.write(part[1][color]);
			});
			if (readline.question('\nThe snapshots don\'t match.\nDo you want to take the new one as the reference snapshot (y/N)?') === 'y') {
				writeResult(resultString);
			} else {
				throw new Error('Snapshots don\'t match.');
			}
		}
	}
}
on('--zino-rerender-tag', core.render);

function writeResult(result) {
	fs.writeFileSync(fileName, result);
}
