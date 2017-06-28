import Document from '../src/dom';
import test from './test';

test('Light DOM Implementation');

let code = '<html><head><meta charset="UTF-8"/><title>Mein Titel</title></head><body><link rel="zino-tag" data-local="test.html"/><test></test></body></html>';
let document = new Document('<!DOCTYPE html>' + code);

test('Can parse a document', t => {
	t.is(document.documentElement.outerHTML, code, 'parsed code');

	code = '<html lang="en"><head><title>Mein Titel</title></head><body><link rel="zino-tag" data-local="test.html"/><test></test></body></html>';
	document = new Document('<!DOCTYPE html>' + code);
	t.is(document.documentElement.getAttribute('lang'), 'en', 'correctly applies document element attributes');
});

test('can parse document fragments', t => {
	code = '<div class="Hallo">World!</div>';
	document = new Document(code);
	t.is(document.documentElement.outerHTML, '<html><head></head><body>' + code + '</body></html>', 'added it to correct position in DOM');
});

test('supports simple traversing features', t => {
	t.is(document.documentElement.children[0].parentNode, document.documentElement, 'supports children and parentNode');
	t.is(document.querySelectorAll('.Hallo').length, 1, 'supports querySelectorAll for classes');
	t.is(document.getElementsByClassName('Hallo').length, 1, 'supports getElementsByClassName');
	t.is(document.getElementsByTagName('body')[0], document.body, 'supports getElementsByTagName');
});

test('allows DOM modification', t => {
	let object = document.createElement('object');
	object.setAttribute('src', '/test.obj');
	document.body.appendChild(object);
	t.is(document.body.innerHTML, '<div class="Hallo">World!</div><object src="/test.obj"></object>', 'supports setAttribute and appendChild');
	t.is(document.body.children[0], document.querySelectorAll('.Hallo')[0], 'is sorted into correct position');
	document.body.removeChild(document.body.children[0]);
	t.is(document.body.innerHTML, '<object src="/test.obj"></object>', 'supports removeChild');
});