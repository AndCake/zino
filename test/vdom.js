import test from './test';
import * as vdom from '../src/vdom';
import Document from 'nano-dom';

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
});

test('applyDOM', t => {
	let jdom = new Document('<!DOCTYPE html><html><head></head><body></body></html>');
	vdom.applyDOM(jdom.documentElement, dom, jdom);
	t.is(jdom.documentElement.outerHTML, '<html><head><title>page title</title></head><body><h1 class="title">Headline</h1><p>Hello, World!</p></body></html>');

	jdom = new Document('<!DOCTYPE html><html><head></head><body><h1 title="test">XYZ</h1></body></html>');
	vdom.applyDOM(jdom.documentElement, dom, jdom);
	t.is(jdom.documentElement.outerHTML, '<html><head><title>page title</title></head><body><h1 class="title">Headline</h1><p>Hello, World!</p></body></html>');
});
