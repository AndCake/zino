import * as zino from '../src/zino-tester';
import * as html from '../src/htmlparser';
import test from './test';

test('Zino Snapshotting');

test('can import a tag', t => {
	zino.clearImports();
	zino.importTag('test/components/my-new-tag.html');
});

test('can create a snapshot', t => {
	zino.matchesSnapshot('<my-new-tag></my-new-tag>');
	zino.matchesSnapshot('<my-new-tag>with content</my-new-tag>');
	zino.matchesSnapshot('<my-new-tag test="me"></my-new-tag>');
	zino.matchesSnapshot('<my-new-tag></my-new-tag>', {test: 2});
});

test('renders styles and events properly', t => {
	zino.clearImports();
	zino.importTag('test/components/comment-form.html');
	zino.matchesSnapshot('<comment-form></comment-form>');

	zino.importTag('test/components/second-tag.html');
	zino.matchesSnapshot('<second-tag me="Welt!"></second-tag>');
});
test('uses the provided name attribute', t => {
	zino.matchesSnapshot('<second-tag me="Welt!"></second-tag>', {}, 'name parameter test');
});
test('calls the callback function', t => {
	let called = false;
	zino.matchesSnapshot('<second-tag me="Welt!"></second-tag>', {}, '', tag => {
		called = true;
		tag.children[0].innerHTML = 'content removed in callback!';
	});
	t.true(called, 'Callback function was called');
});

test('supports object notation for matchesSnapshot', t => {
	// test implementation missing
});

test('allows for non-snapshot testing', t => {
	let document = html.parse('<comment author="Bucks Bunny">I love carrots!</comment>');
	zino.clearImports();
	zino.importTag('test/components/comment.html', document);
	let comment = document.children[0];
	t.is(comment.children[0].children[0].innerHTML, '"Bucks Bunny"', 'rendered the tag into the DOM');
});