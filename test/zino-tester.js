import * as zino from '../src/zino-tester';
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
	t.assert(called, 'Callback function was called');
});

test('supports object notation for matchesSnapshot', t => {
	// test implementation missing
});