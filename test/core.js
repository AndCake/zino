import * as core from '../src/core';
import {on, off} from '../src/events';
import Document from 'nano-dom';
import test from './test';

test('Zino core functionality');
let document = new Document('X<myx-tag></myx-tag>Y<my-other-tag></my-other-tag>');
let body = document.body;

test('render simple tag', t => {
	core.registerTag(function(Tag) {
		return {
			tagName: 'myx-tag',
			render: function(data) {
				return [
					new Tag('div', {class: 'abc'}, [].concat(
						'A-',
						data.props && data.props.times ? (typeof data.props.times.map === 'function' ? data.props.times : [data.props.times]).map(e => 'B') : '',
						'-C',
						'').concat(data.letter && [data.letter].map(e => '-' + e) || ''
					))];
			},
			styles: [],
			functions: {
				props: {times: [1, 2]},
				events: {
					'.abc': {
						click: function click(e) { console.log(e); }
					}
				}
			}
		};
	}, document);
	t.is(body.children[0].outerHTML, `<myx-tag __ready="true"><div class="-shadow-root"><div class="abc">A-BB-C</div></div></myx-tag>`, 'renders a tag');

	let dirty = [];
	on('--zino-rerender-tag', tag => dirty.push(tag));
	body.children[0].setProps('times', [1, 2, 3]);
	t.is(dirty.length, 1, 'triggers re-render on tag after setProps');
	off('--zino-rerender-tag');

	on('--zino-rerender-tag', core.render);
	body.children[0].setAttribute('letter', 'D');
	t.is(body.children[0].outerHTML, `<myx-tag __ready="true" letter="D"><div class="-shadow-root"><div class="abc">A-BBB-C-D</div></div></myx-tag>`, 'renders a simple diff');
	off('--zino-rerender-tag');
});

test('render tag with sub components', t => {
	core.registerTag(function(Tag) {
		return {
			tagName: 'my-other-tag',
			render: function() {
				return [
					Tag('title', {}, 'This is my title'),
					Tag('myx-tag', {'data-times': '1'})
				];
			},
			styles: []
		}
	}, document);

	t.is(body.childNodes[3].outerHTML, `<my-other-tag __ready="true"><div class="-shadow-root"><title>This is my title</title><myx-tag data-times="1" __ready="true"><div class="-shadow-root"><div class="abc">A-B-C</div></div></myx-tag></div></my-other-tag>`, 'renders a sub component');

	body.childNodes[3].setProps('test', 123);
});

test('calls all callbacks', t => {
	body.innerHTML = '<x></x>';
	t.throws(() => {
		core.registerTag((Tag) => ({tagName: 'x', render:()=> {return []}, functions:{mount:function(){throw 'mount called';}}}), document);
	}, 'mount called', 'calls the mount function');

	 body.innerHTML = '<y></y>';
	 t.throws(() => {
 		core.registerTag((Tag) => ({tagName: 'y', render:()=> {return []}, functions:{render:function(){throw 'render called';}}}), document);
	}, 'render called', 'calls the render function');
	on('--zino-rerender-tag', core.render);
	t.throws(() => {
		body.children[0].setProps('test', 123);
	}, 'render called', 'calls the render function on setProps');
	off('--zino-rerender-tag');

	body.innerHTML = '<z></z>';
	core.registerTag((Tag) => ({tagName: 'a', render:()=> {return []}, functions:{mount:function(){throw 'a mount called';}}}));
	t.throws(() => {
		core.registerTag((Tag) => ({tagName: 'z', render:(data)=> {return data.props.times.map(e=>Tag('a'))}, functions:{props:{times: [1, 2]}}}), document);
	}, 'a mount called', 'calls mount on a sub component');

	body.innerHTML = '<q></q>';
	core.registerTag((Tag) => ({tagName: 'b', render:()=> {return []}, functions:{render:function(){throw 'b render called';}}}));
	t.throws(() => {
		core.registerTag((Tag) => ({tagName: 'q', render:(data)=> {return [Tag('b')]}, functions:{}}), document);
	}, 'b render called', 'calls render on a sub component');

	let called = false;
	body.innerHTML = `<w></w>`;
	body.children[0].onready = () => {
		called = true;
	};
	core.registerTag((Tag) => ({tagName: 'w', render:()=> {return ['a']}, functions:{}}), document);
	t.true(called, 'on ready was called');
});

test('re-renders tag dynamically', t => {
	on('--zino-rerender-tag', core.render);
	body.innerHTML = '<ab>12 34</ab>';
	core.registerTag((Tag) => {
		return {
			tagName: 'ab',
			render: function(data) {
				return [data.props.x, data.body].concat(!data.x ? 'Y' : data.x);
			},
			functions: {
				props: {x: 'X'}
			}
		}
	}, document);
	t.is(body.children[0].children[0].innerHTML, 'X12 34Y', 'renders the body correctly');

	body.children[0].body = '34 56';
	t.is(body.children[0].children[0].innerHTML, 'X34 56Y', 're-rendered after body change');

	body.children[0].setProps('x', 'Y');
	t.is(body.children[0].children[0].innerHTML, 'Y34 56Y', 're-rendered after setProps');

	body.children[0].setAttribute('x', 'Z');
	t.is(body.children[0].children[0].innerHTML, 'Y34 56Z', 're-rendered after setAttribute');
	off('--zino-rerender-tag');
});
