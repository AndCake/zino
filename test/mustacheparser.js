import {parse} from '../src/mustacheparser';
import {Tag, getInnerHTML, setDataResolver} from '../src/vdom';
import test from './test';

function run(code) {
	try {
		return new Function('return ' + code)()(Tag);
	} catch(e) {
		console.log(code);
		throw new Error('Generated code invalid!');
	}
}

function render (code, data) {
	let parsed = parse(code);
	let dom = run(parsed);
	let result = dom.render(data);
	result = Tag('div', {class: '-shadow-root'}, result);
	return getInnerHTML(result);
}

test('Mustache Parser');

test('simple component', t => {
	let result = run(parse(`<btn><button class="special-button" type="button">{{body}}</button></btn>`));

	t.is(typeof result, 'object', 'results in an object');
	t.is(result.tagName, 'btn', 'identifies tag name');
	t.is(typeof result.render, 'function', 'has a render function');
	let dom = result.render({body: 'XXX'});
	t.is(dom[0].tagName, 'button', 'generated virtual DOM has content');
	t.is(getInnerHTML(Tag('div', {}, dom)), '<button class="special-button" type="button">XXX</button>', 'renders correct data');

	t.is(render(`<a><btn type="XX{{test}}YY">A</btn></a>`, {test: 2}), '<btn type="XX2YY">A</btn>', 'can have mixed variable and static content in attribute');
	t.is(render(`<a><btn type="XX{{#test}}{{.}}{{/test}}YY">A</btn></a>`, {test: 2}), '<btn type="XX2YY">A</btn>', 'can have mixed variable and static content in attribute');
	t.is(render(`<a><btn type="XX{{#test}}A{{.}}B{{/test}}YY">A</btn></a>`, {test: [1, 2]}), '<btn type="XXA1BA2BYY">A</btn>', 'can have mixed variable and static content in attribute');	
});

test('script added', t => {
	let result = run(parse(`<btn>X<script>{props: {me: 1}, events: {':host': {click: function(e){'use strict;'}}}, render: function(){throw 'render can run!';}}</script></btn>`));

	t.is(result.functions.props.me, 1);
	t.throws(function() {
		result.functions.render();
	}, 'render can run!');

	result = run(parse('<btn><script>// thisis my test comment\n// another test</script><script>{props: {me: 2, // old value\ntest: "123"}}</script></btn>'));
	t.is(result.functions.props.me, 2);
	t.is(result.functions.props.test, '123');
});

test('styles generated', t => {
	let result = run(parse(`<btn><div style="{{%styles.test}}">X</div><script>{styles: {test: {border: '1px solid red'}}}</script><style>:host{color: red;}</style></btn>`));

	t.not(typeof result.styles, 'undefined');
	t.is(result.styles.length, 1);
	let dom = result.render(result.functions);
	t.is(dom[0].attributes.style, 'border:1px solid red;');
	t.is(getInnerHTML(Tag('div', {}, dom)), '<div style="border:1px solid red;">X</div>');
});

test('simple variables', t => {
	t.is(render(`<a>x{{test}}y</a>`, {test: 2}), 'x2y', 'can parse variable type number.');
	t.is(render(`<a>x{{test.x}}y</a>`, {test: {x: 'hallo'}}), 'xhalloy', 'can render variable type object.');
	t.is(render(`<a>x{{test.0}}y</a>`, {test: [3]}), 'x3y', 'can render variable type array.');
	t.is(render(`<a>x{{test}}y</a>`, {test: () => 1}), 'x1y', 'can evaluate function variable.');
	t.is(render(`<a>x{{test}}y</a>`, {test: true}), 'xtruey', 'can render boolean value.');
	t.is(render(`<a>x{{test}}y</a>`, {test: null}), 'xy', 'does not render null value.');
	t.is(render('<a>x {{test}} y</a>', {test: 2}), 'x 2 y', 'keeps text whitespace');
});

test('parse blocks', t => {
	t.is(render(`<a>x{{#test}}y{{/test}}z</a>`, {test: true}), 'xyz', 'evaluates truish values');
	t.is(render(`<a>x{{#test}}y{{/test}}z</a>`, {test: false}), 'xz', 'evaluates false values');
	t.is(render(`<a>x{{#test}}y{{/test}}z</a>`, {test: [1, 2, 3]}), 'xyyyz', 'evaluates array values');
	t.is(render(`<a>x{{^test}}y{{/test}}z</a>`, {test: true}), 'xz', 'evaluates inverted truish values');
	t.is(render(`<a>x{{^test}}y{{/test}}z</a>`, {test: false}), 'xyz', 'evaluates inverted false values');
	t.throws((()=>render(`<a>x{{#test}}y</a>`, {test: 1})), 'Unexpected end of block', 'opening block');
	t.throws((()=>render(`<a>x{{/test}}y</a>`, {test: 1})), 'Unexpected end of block: test', 'closing block');
});

test('block-specific data', t => {
	t.is(render(`<a>x{{#test}}{{.}}{{/test}}y</a>`, {test: 1}), 'x1y', 'provides current value for simple expression');
	t.is(render(`<a>x{{#test}}{{.}}{{/test}}z</a>`, {test: [1, 2]}), 'x12z', 'provides current value for array');
	t.is(render(`<a>x{{#test}}{{.index}}{{/test}}y</a>`, {test: [1, 2]}), 'x01y', 'provides index of array');
	t.is(render(`<a>x{{#test}}{{.length}}{{/test}}y</a>`, {test: [1, 2]}), 'x22y', 'provides length of array');
	t.is(render(`<a>x{{#test}}{{x}}{{/test}}y</a>`, {x: 1, test: [{x: 2}]}), 'x2y', 'provides access to sub objects');
	//t.is(render(`<a>x{{#test}}y{{/test}}z</a>`, {test: a => `X${a}Y`}), 'xXyYz', 'allows for lambdas');
});

test('comments', t => {
	t.is(render(`<a>x{{! this is my comment}}y</a>`), 'xy', 'ignores comments');
});

test('value escaping', t => {
	t.is(render(`<a>x{{test}}y</a>`, {test: '<&"'}), 'x&lt;&amp;&quot;y', 'escapes normal values');
	t.is(render(`<a>x{{{test}}}y</a>`, {test: '<&"'}), 'x<&"y', 'does not escape unescaped values');
});

test('renders styles', t => {
	t.is(render(`<a>x<img style="{{%test}}"/>y</a>`, {test: {
		value: 'hallo'
	}}), 'x<img style="value:hallo;"></img>y', 'renders simple style entry');
	t.is(render(`<a>x<img style="{{%test}}"/>y</a>`, {test: {
		display: 'block',
		background: 'red'
	}}), 'x<img style="display:block;background:red;"></img>y', 'renders style entries');
	t.is(render(`<a>x<img style="{{%test}}"/>y</a>`, {test: {
		isMe: 'ja'
	}}), 'x<img style="is-me:ja;"></img>y', 'converts style property camel-case to dashed');
	t.is(render(`<a>x<img style="{{%test, tust}}"/>y</a>`, {test: {
		value: 'hallo'
	}, tust: {
		greeting: 'hi'
	}}), 'x<img style="value:hallo;greeting:hi;"></img>y', 'renders multiple styles');
	t.is(render(`<a>x<img style="{{%test}}"/>y</a>`, {test: {
		value: 2
	}}), 'x<img style="value:2px;"></img>y', 'converts number to pixels');
	t.is(render(`<a>x<img style="{{%test}}"/>y</a>`, {test: {
		value: 2
	}, styles: {defaultUnit: 'rem'}}), 'x<img style="value:2rem;"></img>y', 'converts number to configured unit');
	t.is(render(`<a>x<img style="{{%test}}"/>y</a>`, {test: {
		value: () => 'test'
	}}), 'x<img style="value:test;"></img>y', 'evaluates function values');
});

test('complex data', t => {
	setDataResolver((attr, value) => {
		return attr;
	});
	t.is(render(`<a>x<img data-test="{{+data}}"/>y</a>`, {data: [1, 2, 3]}), 'x<img data-test="--data-test--"></img>y', 'returns data name if no data resolver is set');
	setDataResolver((key, value) => {
		t.is(value.toString(), '1,2,3', 'value handed to data resolver over correctly');
		return 'abcde';
	});
	t.is(render(`<a>x<img data-test="{{+data}}"/>y</a>`, {data: [1, 2, 3]}), 'x<img data-test="--abcde--"></img>y', 'returns data name if no data resolver is set');
});
