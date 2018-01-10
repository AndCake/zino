import * as zino from '../src/zino-tester';
import Document from 'nano-dom';
import test from './test';

test('Zino Snapshotting');

test('can import a tag', t => {
	zino.clearImports();
	zino.importTag('test/components/my-new-tag.html');
});

test('can create a snapshot', t => {
	let interval = global.setInterval;
	global.setInterval = () => {};
	zino.matchesSnapshot('<my-new-tag></my-new-tag>');
	zino.matchesSnapshot('<my-new-tag>with content</my-new-tag>');
	zino.matchesSnapshot('<my-new-tag test="me"></my-new-tag>');
	zino.matchesSnapshot('<my-new-tag></my-new-tag>', {test: 2});
	global.setInterval = interval;
});

test('renders styles and events properly', t => {
	zino.clearImports();
	zino.importTag('test/components/comment-form.html');
	zino.matchesSnapshot('<comment-form></comment-form>');

	zino.importTag('test/components/second-tag.html');
	debugger;
	zino.matchesSnapshot('<second-tag me="Welt!"></second-tag>');
});
test('uses the provided name attribute', t => {
	zino.matchesSnapshot('<second-tag me="Welt!"></second-tag>', {}, 'name parameter test');
});
test('calls the callback function', t => {
	let called = false;
	zino.matchesSnapshot('<second-tag me="Welt!"></second-tag>', {}, '', tag => {
		called = true;
		t.is(tag.attributes.me.value, 'Welt!', 'Attribute correctly applied');
		tag.children[0].innerHTML = 'content removed in callback!';
	});
	t.true(called, 'Callback function was called');
});

test('supports object notation for matchesSnapshot', t => {
	// test implementation missing
});

test('allows for non-snapshot testing', t => {
	let document = new Document('<comment author="Bucks Bunny">I love carrots!</comment>');
	zino.clearImports();
	zino.importTag('test/components/comment.html', document);
	let comment = document.body.children[0];
	t.is(comment.children[0].children[0].innerHTML, '"Bucks Bunny"', 'rendered the tag into the DOM');
});

test('can deal with external scripts', t => {
	let document = new Document('<external-js></external-js>');
	zino.clearImports();
	zino.importTag('test/components/external-js.html', document);
	let ext = document.body.children[0];
	t.is(ext.querySelectorAll('.test')[0].innerHTML, 'Hello, World!', 'is able to import external JS files');
});
test('Can manage event handling', t => {
	Zino.on('my-event', () => {throw 'event called'});
	t.throws(() => {
		Zino.trigger('my-event');
	}, 'event called');
	zino.clearEvents();
	// should not throw anymore
	Zino.trigger('my-event');

});

test('Can deal with empty props', t => {
	let document = new Document('<prop-container></prop-container>');
	zino.clearImports();
	document.querySelectorAll('prop-container')[0].props = {
		data: undefined
	};
	zino.importTag(function() { return function PropReceiver() {
		this.render = function(data) {
			return this.createNode('div', null, data.props.attr);
		};
	}});
	zino.importTag(function() { return function PropContainer() {
		this.render = function(data) {
			return (
				this.createNode('div', null,
					this.createNode('prop-receiver', {'data-attr': data.props.data})
				)
			);
		};
	}}, document);
	t.is(document.querySelectorAll('prop-receiver')[0].props.attr, undefined, 'receives prop as undefined');
	document.querySelectorAll('prop-container')[0].setProps('data', null);
	t.is(document.querySelectorAll('prop-receiver')[0].props.attr, null, 'receives prop as null');
	document.querySelectorAll('prop-container')[0].setProps('data', '');
	t.is(document.querySelectorAll('prop-receiver')[0].props.attr, '', 'receives prop as empty string');
	document.querySelectorAll('prop-container')[0].setProps('data', undefined);
	t.is(document.querySelectorAll('prop-receiver')[0].props.attr, undefined, 'receives prop as undefined');
});