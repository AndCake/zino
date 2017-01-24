// https://github.com/cheeriojs/cheerio
// ...
(() => {
    'use strict';

    var z = require('../zino-tester');

	describe('example tags', function() {
		this.timeout(0);

	    describe('my-new-tag', () => {
	        z.importTag('examples/dist/my-new-tag.html');

	        it('initializes empty', () => z.matchesSnapshot('<my-new-tag></my-new-tag>'));
	        it('accepts a test attribute', () => z.matchesSnapshot('<my-new-tag test=""></my-new-tag>'));
	        it('accepts a value for test attribute', () => z.matchesSnapshot('<my-new-tag test="mhehehe"></my-new-tag>'));
			it('ignores the tag\'s content', () => z.matchesSnapshot('<my-new-tag>body-content</my-new-tag>'));
	    });

		describe('comment-box', () => {
			z.importTag('examples/dist/comment-box.html');

			it('initializes empty', () => z.matchesSnapshot('<comment-box></comment-box>'));
			it('renders a comment', () => z.matchesSnapshot('<comment-box></comment-box>', {
				props: {
					comments: [{
						author: 'Test Author',
						comment: 'This is my wonderful comment!'
					}]
				}
			}));
			it('renders all given comments', () => z.matchesSnapshot('<comment-box></comment-box>', {
				props: {
					comments: [{
						author: 'Test Author',
						comment: 'This is my wonderful comment!'
					}, {
						author: 'Test Author 2',
						comment: 'This is my wonderful comment 2!'
					}, {
						author: 'Test Author 3',
						comment: 'This is my wonderful comment 3!'
					}]
				}
			}))
		});
		describe('comment', () => {
			z.importTag('examples/dist/comment.html');

			it('renders empty when called empty', () => z.matchesSnapshot('<comment></comment>'));
			it('renders author when provided with author', () => z.matchesSnapshot('<comment author="Author Name"></comment>'));
			it('renders content when provided with it', () => z.matchesSnapshot('<comment>Comment content</comment>'));
			it('renders author and content when provided with it', () => z.matchesSnapshot('<comment author="My author">My comment content</comment>'));
		});

		describe('comment-form', () => {
			z.importTag('examples/dist/comment-form.html');

			it('renders empty', () => z.matchesSnapshot('<comment-form></comment-form>'));
		});

		describe('todo-list', () => {
			z.importTag('examples/dist/todolist.html');

			it('renders empty', () => z.matchesSnapshot('<todo-list></todo-list>'));
			it('renders todos', () => z.matchesSnapshot('<todo-list></todo-list>', {props: {tasks: ['Task 1']}}));
		})

		describe('btn component', () => {
			z.importTag('examples/dist/btn.html');

			it('renders empty, when used empty', () => z.matchesSnapshot('<btn page="https://bitbucket.org/rkunze/zinojs">ZinoJS</btn>'));
		});
	});
}());
