import * as core from '../src/core';
import {on, off} from '../src/events';
import Document from 'nano-dom';
import test from './test';

test('Zino core functionality');
let document = new Document('X<myx-tag></myx-tag>Y<my-other-tag></my-other-tag>');
//let document = new JSDOM('X<myx-tag></myx-tag>Y<my-other-tag></my-other-tag>').window.document;
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
				},
				render: function() {
					t.is(this.getElementsByClassName('abc').length, 1, 'can access rendered elements');
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

	var subLevel = document.createElement('sub-level1');
	body.appendChild(subLevel);
	core.registerTag(function(Tag) {
		return {
			tagName: 'sub-level4',
			render: function() {
				return [
					'test'
				];
			}
		}
	});
	core.registerTag(function(Tag) {
		return {
			tagName: 'sub-level3',
			render: function() {
				return [Tag('sub-level4')];
			}
		}
	});
	core.registerTag(function(Tag) {
		return {
			tagName: 'sub-level2',
			render: function() {
				return [Tag('sub-level3'), Tag('sub-level3')];
			},
			styles: []
		}
	});
	core.registerTag(function(Tag) {
		return {
			tagName: 'sub-level1',
			render: function() {
				return [Tag('sub-level4'), Tag('sub-level2')];
			},
			styles: []
		}
	}, document);
	t.is(subLevel.innerHTML, '<div class="-shadow-root"><sub-level4 __ready="true"><div class="-shadow-root">test</div></sub-level4><sub-level2 __ready="true"><div class="-shadow-root"><sub-level3 __ready="true"><div class="-shadow-root"><sub-level4 __ready="true"><div class="-shadow-root">test</div></sub-level4></div></sub-level3><sub-level3 __ready="true"><div class="-shadow-root"><sub-level4 __ready="true"><div class="-shadow-root">test</div></sub-level4></div></sub-level3></div></sub-level2></div>')
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

test('render and re-render with nesting', (t) => {
	on('--zino-rerender-tag', core.render);

	var rootComponent = document.createElement('test');
	var test2Count = 20;
	rootComponent.props = {
		testcount: test2Count
	};
	body.appendChild(rootComponent);

	core.registerTag((Tag) => {
		return {
			tagName: 'test-2-1',
			render: () => {
				return [Tag('div', null, ['test-2-1'])];
			}
		};
	});

	core.registerTag((Tag) => {
		return {
			tagName: 'test-2',
			render: () => {
				return [
					Tag('test-2-1', {'test': 'foo'})
				];
			}
		};
	});

	core.registerTag((Tag) => {
		return {
			tagName: 'test',
			render: (data) => {
				var result = [];
				for (var i = 0; i < data.props.testcount; i += 1) {
					result.push(Tag('test-2', {'productid': i}));
				}
				return result;
			}
		};
	}, document);

	checkStructure();

	test2Count = 40;
	rootComponent.props.testcount = test2Count;
	rootComponent.setProps('testcount', test2Count);

	checkStructure();
	off('--zino-rerender-tag', core.render);

	function checkStructure() {
		t.is(rootComponent.children[0].children.length, test2Count);

		for (var i = 0; i < test2Count; i += 1) {
			var test2 = getNthChild(rootComponent, i);
			t.is(test2.nodeName.toLowerCase(), 'test-2');
			t.is(test2.attrs.productid, i, `${test2Count} ${i}`);

			var test2_1 = getNthChild(test2, 0);
			t.is(test2_1.nodeName.toLowerCase(), 'test-2-1');
			t.is(test2_1.attrs.test, 'foo');
		}
	}
});

test('pre-rendered tags', t => {
	on('--zino-rerender-tag', core.render);
	body.innerHTML = '<pre-rendered><div class="-shadow-root">Value: 2</div></pre-rendered><not-prerendered></not-prerendered>';
	var isRenderedValue;
	core.registerTag((Tag) => {
		return {
			tagName: 'pre-rendered',
			render: function(data) {
				return ['Value: ', data.props.value];
			},
			functions: {
				props: {value: 'n/a'},
				mount: function() {
					isRenderedValue = this.isRendered;
				}
			}
		};
	}, document);
	t.is(body.getElementsByClassName('-shadow-root')[0].innerHTML, 'Value: 2', 'keeps pre-rendered text');
	t.is(isRenderedValue, true, 'provides isRendered attribute');

	isRenderedValue = null;
	var isRenderedAfterRendered = null;
	core.registerTag((Tag) => {
		return {
			tagName: 'not-prerendered',
			render: function(data){ return ['test']; },
			functions: {
				render: function() {
					isRenderedAfterRendered = this.isRendered;
				},
				mount: function() {
					isRenderedValue = this.isRendered;
				}
			}
		}
	}, document);
	t.is(isRenderedValue, false, 'isRendered is false if it has not been rendered yet');
	t.is(isRenderedAfterRendered, true, 'isRendered is true once it has been rendered');
	off('--zino-rerender-tag', core.render);
});

test('resolve inconsistencies', t => {
	on('--zino-rerender-tag', core.render);
	core.flushRegisteredTags();
	core.setDataRegistry({});
	body.innerHTML = '<inconsistency-creator data-xname="test"></inconsistency-creator>';
	core.registerTag(Tag => {
		return {
			tagName: 'inconsistency',
			render: function(data) { return Tag('div', null, 'X: ' + data.props.name + '; Y'); },
			functions: {
				props: {
					name: null
				}
			}
		};
	}, document);
	core.registerTag(Tag => {
		return {
			tagName: 'consistent',
			render: function(data) {
				return Tag('i', {'class': 'icon-moon'}, 'label');
			}
		};
	});
	core.registerTag(Tag => {
		return {
			tagName: 'inconsistency-creator',
			render: function(data) {
				return Tag('div', {'class': 'test'}, Tag('consistent'), Tag('button', null, data.props.xname));
			},
			functions: {
				props: {
					xname: 'nothing'
				},
				render: function() {
					var el = document.createElement('inconsistency');
					el.props = {name: this.props.xname};
					this.children[0].children[0].replaceChild(el, this.children[0].children[0].children[0]);
					core.mount(el);
				},
				mount: function() {
					this.props.xname += ' mount test';
				}
			}
		};
	}, document);
	body.children[0].setProps('xname', 'huhu!');
	t.is(body.children[0].children[0].innerHTML, '<div class="test"><inconsistency __ready="true"><div class="-shadow-root"><div>X: huhu!; Y</div></div></inconsistency><button>huhu!</button></div>', 'inconsistency found, resolving failed');
	core.setDataRegistry({});
	core.flushRegisteredTags();
	off('--zino-rerender-tag', core.render);
});

function getNthChild(root, pos) {
	return root.children[0].children[pos];
}
