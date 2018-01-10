import test from './test';
import * as vdom from '../src/vdom';
import Document from 'nano-dom';
import { objectDiff } from '../src/utils';

test('vdom implementation');

let dom = vdom.Tag('html', {}, [
		vdom.Tag('body', {}, [
			vdom.Tag('h1', {class: 'title'}, ['Headline']),
			vdom.Tag('p', {}, ['Hello, World!'])
		])
	]);

test('generates DOM structure', t => {
	t.is(dom.children[0].children[0].attributes['class'].value, 'title', 'Correctly arranges attributes');
	t.is(dom.children[0].children[1].children[0], 'Hello, World!', 'deals with text nodes');
});

test('getInnerHTML', t => {
	let expected = '<body><h1 class="title">Headline</h1><p>Hello, World!</p></body>';
	t.is(vdom.getInnerHTML(dom), expected, 'renders HTML properly');
	dom.children.unshift(vdom.Tag('head', {}, vdom.Tag('title', {}, 'page title')));

	expected = '<head><title>page title</title></head>' + expected;
	t.is(vdom.getInnerHTML(dom), expected, 'correctly renders latest changes to the DOM');

	let emptyDom = vdom.Tag('html');
	t.is(vdom.getInnerHTML(emptyDom), '', 'renders empty string for empty inner HTML');

	/*expected = 'test<test></test>string';
	emptyDom = vdom.Tag('html', null, 'test', [vdom.Tag('test'), 'string']);
	t.is(vdom.getInnerHTML(emptyDom), expected, 'can deal with array children and non-array child list');
	*/
});

test('applyDOM', t => {
	let jdom = new Document('<!DOCTYPE html><html><head></head><body></body></html>');
	vdom.applyDOM(jdom.documentElement, dom, jdom);
	t.is(jdom.documentElement.outerHTML, '<html><head><title>page title</title></head><body><h1 class="title">Headline</h1><p>Hello, World!</p></body></html>');

	jdom = new Document('<!DOCTYPE html><html><head></head><body><h1 title="test">XYZ</h1></body></html>');
	vdom.applyDOM(jdom.documentElement, dom, jdom);
	t.is(jdom.documentElement.outerHTML, '<html><head><title>page title</title></head><body><h1 class="title">Headline</h1><p>Hello, World!</p></body></html>');

	jdom = new Document('<!DOCTYPE html><html><head></head><body><h1 title="test">XYZ</h1></body></html>');
	let textDom = vdom.Tag('html', null, '<body>test</body>');
	vdom.applyDOM(jdom.documentElement, textDom, jdom);
	t.is(jdom.documentElement.querySelectorAll('body')[0].innerHTML, 'test', 'correctly applies text nodes that contain HTML');

	jdom = new Document('<!DOCTYPE html><html><head></head><body></body></html>');
	vdom.setDataResolver((key, value) => {
		return Object.keys(value).map(key => key + value[key]).join('');
	});

	let objectDom = vdom.Tag('html', null, vdom.Tag('body', {'data-test-value': {x: 'test'}}, 'test'));
	vdom.applyDOM(jdom.documentElement, objectDom, jdom);
	t.is(jdom.documentElement.querySelectorAll('body')[0].getAttribute('data-test-value'), '--xtest--', 'correctly handles object attribute values');

	objectDom = vdom.Tag('html', null, vdom.Tag('body', {'data-test-value': {y: 123}}, 'test'));
	vdom.applyDOM(jdom.documentElement, objectDom, jdom);
	t.is(jdom.documentElement.querySelectorAll('body')[0].getAttribute('data-test-value'), '--y123--', 'correctly handles object attribute value updates');
});
