import parse from '../src/mustacheparser';
import test from './test';

test('Mustache Parser');

test('parser response', t => {
	let result = parse(`x{{test}}y`, {test: 0});
	t.is(typeof result, 'string');
	t.is(result.length, 3);
});

test('simple variables', t => {
	t.is(parse(`x{{test}}y`, {test: 2}), 'x2y', 'can parse variable type number.');
	t.is(parse(`x{{test.x}}y`, {test: {x: 'hallo'}}), 'xhalloy', 'can render variable type object.');
	t.is(parse(`x{{test.0}}y`, {test: [3]}), 'x3y', 'can render variable type array.');
	t.is(parse(`x{{test}}y`, {test: () => 1}), 'x1y', 'can evaluate function variable.');
	t.is(parse(`x{{test}}y`, {test: true}), 'xtruey', 'can render boolean value.');
	t.is(parse(`x{{test}}y`, {test: null}), 'xy', 'does not render null value.');
});

test('parse blocks', t => {
	t.is(parse(`x{{#test}}y{{/test}}z`, {test: true}), 'xyz', 'evaluates truish values');
	t.is(parse(`x{{#test}}y{{/test}}z`, {test: false}), 'xz', 'evaluates false values');
	t.is(parse(`x{{#test}}y{{/test}}z`, {test: [1, 2, 3]}), 'xyyyz', 'evaluates array values');
	t.is(parse(`x{{^test}}y{{/test}}z`, {test: true}), 'xz', 'evaluates inverted truish values');
	t.is(parse(`x{{^test}}y{{/test}}z`, {test: false}), 'xyz', 'evaluates inverted false values');
	t.throws((()=>parse(`x{{#test}}y`, {test: 1})), 'unclosed block');
	t.throws((()=>parse(`x{{/test}}y`, {test: 1})), 'unopened block');
});

test('block-specific data', t => {
	t.is(parse(`x{{#test}}{{.}}{{/test}}y`, {test: 1}), 'x1y', 'provides current value for simple expression');
	t.is(parse(`x{{#test}}{{.}}{{/test}}y`, {test: [1, 2]}), 'x12y', 'provides current value for array');
	t.is(parse(`x{{#test}}{{.index}}{{/test}}y`, {test: [1, 2]}), 'x01y', 'provides index of array');
	t.is(parse(`x{{#test}}{{.length}}{{/test}}y`, {test: [1, 2]}), 'x22y', 'provides length of array');
	t.is(parse(`x{{#test}}{{x}}{{/test}}y`, {x: 1, test: [{x: 2}]}), 'x2y', 'provides access to sub objects');
	t.is(parse(`x{{#test}}y{{/test}}z`, {test: a => `X${a}Y`}), 'xXyYz', 'allows for lambdas');
});

test('comments', t => {
	t.is(parse(`x{{! this is my comment}}y`), 'xy', 'ignores comments');
});

test('value escaping', t => {
	t.is(parse(`x{{test}}y`, {test: '<&"'}), 'x&lt;&amp;&quot;y', 'escapes normal values');
	t.is(parse(`x{{{test}}}y`, {test: '<&"'}), 'x<&"y', 'does not escape unescaped values');
});

/* // support for partial has been removed since it wasn't used
test('partials', t => {
	t.is(parse(`x{{>test}}y`), 'xtesty', 'returns partial name if no partial resolver provided');
	t.is(parse(`x{{>test}}y`, {}, {
		resolvePartial: name => 'resolved'
	}), 'xresolvedy', 'resolves partial');
});
*/
test('renders styles', t => {
	t.is(parse(`x{{%test}}y`, {test: {
		value: 'hallo'
	}}), 'xvalue:hallo;y', 'renders simple style entry');
	t.is(parse(`x{{%test}}y`, {test: {
		display: 'block',
		background: 'red'
	}}), 'xdisplay:block;background:red;y', 'renders style entries');
	t.is(parse(`x{{%test}}y`, {test: {
		isMe: 'ja'
	}}), 'xis-me:ja;y', 'converts style property camel-case to dashed');
	t.is(parse(`x{{%test, tust}}y`, {test: {
		value: 'hallo'
	}, tust: {
		greeting: 'hi'
	}}), 'xvalue:hallo;greeting:hi;y', 'renders multiple styles');
	t.is(parse(`x{{%test}}y`, {test: {
		value: 2
	}}), 'xvalue:2px;y', 'converts number to pixels');
	t.is(parse(`x{{%test}}y`, {test: {
		value: 2
	}, styles: {defaultUnit: 'rem'}}), 'xvalue:2rem;y', 'converts number to configured unit');
	t.is(parse(`x{{%test}}y`, {test: {
		value: () => 'test'
	}}), 'xvalue:test;y', 'evaluates function values');
});

test('complex data', t => {
	t.is(parse(`x{{+data}}y`, {data: [1, 2, 3]}), 'x--data--y', 'returns data name if no data resolver is set');
	t.is(parse(`x{{+data}}y`, {data: [1, 2, 3]}, {resolveData: (key, value) => {
		t.is(value.toString(), '1,2,3', 'value handed to data resolver over correctly');
		return 'abcde';
	}}), 'x--abcde--y', 'returns data name if no data resolver is set');
});
