import * as core from '../src/core';
import * as html from '../src/htmlparser';
import test from './test';

test('Zino core functionality');
let document = html.parse('X<myx-tag></myx-tag>Y<my-other-tag></my-other-tag>');

test('render simple tag', t => {
	debugger;
	core.registerTag(`
<myx-tag>
	<div class="abc">A-{{#props.times}}B{{/props.times}}-C{{#letter}}-{{.}}{{/letter}}</div><script>
		({
			props: {
				times: [1, 2]
			},
			events: {
				'.abc': {
					click: function click(e) { console.log(e); }
				}
			}
		})
	</script></myx-tag>`, './', document);
	t.is(document.children[1].outerHTML, `<myx-tag __ready="true"><div class="-shadow-root"><div class="abc">A-BB-C</div></div></myx-tag>`, 'renders a tag');

	document.children[1].setProps('times', [1, 2, 3]);
	t.is(document.children[1].outerHTML, `<myx-tag __ready="true"><div class="-shadow-root"><div class="abc">A-BBB-C</div></div></myx-tag>`, 're-renders the tag after setProps');

	document.children[1].setAttribute('letter', 'D');
	t.is(document.children[1].outerHTML, `<myx-tag __ready="true" letter="D"><div class="-shadow-root"><div class="abc">A-BBB-C-D</div></div></myx-tag>`, 'renders a simple diff');
});

test('render tag with sub components', t => {
	core.registerTag(`
<my-other-tag>
	<title>This is my title</title>
	<myx-tag data-times="1"></myx-tag>
</my-other-tag>
`, './x', document);

	t.is(document.children[3].outerHTML, `<my-other-tag __ready="true"><div class="-shadow-root"><title>This is my title</title>\n <myx-tag data-times="1" __ready="true"><div class="-shadow-root"><div class="abc">A-B-C</div></div></myx-tag></div></my-other-tag>`, 'renders a sub component');

	document.children[3].setProps('test', 123);
});

test('calls all callbacks', t => {
	document.innerHTML = '<x></x>';
	t.throws(() => {
		core.registerTag(`<x><script>({mount:function(){throw 'mount called';}})</script></x>`, './x', document);
	}, 'mount called', 'calls the mount function');

	 document.innerHTML = '<y></y>';
	 t.throws(() => {
 		core.registerTag(`<y><script>({render:function(){throw 'render called';}})</script></y>`, './y', document);
	}, 'render called', 'calls the render function');
	t.throws(() => {
		document.children[0].setProps('test', 123);
	}, 'render called', 'calls the render function on setProps');

	document.innerHTML = '<z></z>';
	core.registerTag(`<a><script>({mount:function(){throw 'a mount called';}})</script></a>`, './');
	t.throws(() => {
		core.registerTag(`<z>{{#props.times}}<a></a>{{/props.times}}<script>({props:{times:[1, 2]}})</z>`, './', document);
	}, 'a mount called', 'calls mount on a sub component');

	document.innerHTML = '<q></q>';
	core.registerTag(`<b><script>({render:function(){throw 'b render called';}})</script></b>`, './');
	t.throws(() => {
		core.registerTag(`<q><b></b></q>`, './', document);
	}, 'b render called', 'calls render on a sub component');

	let called = false;
	document.innerHTML = `<w></w>`;
	document.children[0].onready = () => {
		called = true;
	};
	core.registerTag(`<w>a</w>`, './', document);
	t.true(called, 'on ready was called');
});
