import test from './test';
import * as stache from '../src/stache';

test('Stache Template engine');

test('generates vDOM nodes', t => {
	let template = `<h1>Test</h1>`;
	let result = stache.parse(template)({});
	t.is(result.children.length, 1, 'has a child');
	t.is(result.children[0].children.length, 1, 'has a child child');
	t.is(result.innerHTML, template, 'contains same structure');
});

test('fills data', t => {
	let template = `<h1>{{test}}</h1>`;
	let result = stache.parse(template)({test: 'Hello, world!'});
	t.is(result.innerHTML, '<h1>Hello, world!</h1>', 'simple value rendered');

	template = `<h1 class="{{test}}">here</h1>`;
	result = stache.parse(template)({test: 'empty'});
	t.is(result.innerHTML, '<h1 class="empty">here</h1>', 'simple value rendered in attribute');
});

test('renders blocks', t => {
	let template = `<h1>{{#test}}am here{{/test}}</h1>`;
	let result = stache.parse(template)({test: true});
	t.is(result.innerHTML, '<h1>am here</h1>', 'evaluates block with text inside');

	template = `<h1>{{#test}}<div>am here</div>{{/test}}</h1>`;
	let fill = stache.parse(template);
	result = fill({test: true});
	t.is(result.innerHTML, '<h1><div>am here</div></h1>', 'evaluates block with html inside');

	result = fill({test: [1, 2]});
	t.is(result.innerHTML, '<h1><div>am here</div><div>am here</div></h1>', 'evaluates block array with html inside');

	result = fill({test: false});
	t.is(result.innerHTML, '<h1></h1>', 'does not render the html block content if condition is false');

	template = `<h1>!{{#test}}{{.length}}<div data-idx="{{.index}}">{{.}}</div>{{oha}}{{/test}}!</h1>`;
	result = stache.parse(template)({oha: 'hahaha', test: ['ABC', 'DEF']});
	t.is(result.innerHTML, '<h1>!2<div data-idx="0">ABC</div>hahaha2<div data-idx="1">DEF</div>hahaha!</h1>', 'evaluates block array values with html inside');

	template = `<h1>{{^test}}X{{/test}}</h1>`;
	result = stache.parse(template)({test: true});
	t.is(result.innerHTML, '<h1></h1>', 'inverted block ignores true values');

	result = stache.parse(template)({test: false});
	t.is(result.innerHTML, '<h1>X</h1>', 'inverted block renders false values');
});

// @TODO how to deal with adding additional values without rendering everything anew?
