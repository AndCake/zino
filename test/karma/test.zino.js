var assert = function(value, message) {
	if (!value) {
		throw new Error('Assertion failed: ' + (message || JSON.stringify(value)));
	}
},
assertEqual = function(a, b, message) {
	assert(a === b, (message || '') + '; ' + (JSON.stringify(a) + ' === ' + JSON.stringify(b)));
},
assertNotEmpty = function(el, message) {
	assert(el.length > 0, (message || '') + '; ' + (JSON.stringify(el) + ' is not empty'));
},
assertEmpty = function(el, message) {
	assert(el.length <= 0, (message || '') + '; ' + (JSON.stringify(el) + ' is empty'));
},
assertThrows = function(fn, message) {
	var threw = false;
	try  {
		fn();
	} catch(e) {
		threw = true;
	}
	assert(threw, message || ((fn.name || 'function') + ' throws exception'));
},
assertElementHasContent = function(el, expected, message) {
	var content = document.querySelector(el).innerHTML.trim();
	assertEqual(content, expected, message || ('Element ' + el + ' has content ' + content));
},
assertElementIsEmpty = function(el, message) {
	var content = document.querySelector(el).innerHTML.trim();
	assertEmpty(content, message || ('Element ' + el + ' is empty'));
};
assertElementExists = function(el, message) {
	assert(document.querySelector(el), message || 'Element ' + el + ' does not exist.');
}

function mouseEvent(type, sx, sy, cx, cy) {
	var evt;
	var e = {
		bubbles: true,
		cancelable: (type != "mousemove"),
		view: window,
		detail: 0,
		screenX: sx,
		screenY: sy,
		clientX: cx,
		clientY: cy,
		ctrlKey: false,
		altKey: false,
		shiftKey: false,
		metaKey: false,
		button: 0,
		relatedTarget: undefined
	};
	if (typeof( document.createEvent ) == "function") {
		evt = document.createEvent("MouseEvents");
		evt.initMouseEvent(type,
			e.bubbles, e.cancelable, e.view, e.detail,
			e.screenX, e.screenY, e.clientX, e.clientY,
			e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
			e.button, document.body.parentNode);
	} else if (document.createEventObject) {
		evt = document.createEventObject();
		for (prop in e) {
			evt[prop] = e[prop];
		}
		evt.button = { 0:1, 1:4, 2:2 }[evt.button] || evt.button;
	}
	return evt;
}
function dispatchEvent (el, evt) {
	if (el.dispatchEvent) {
		el.dispatchEvent(evt);
	} else if (el.fireEvent) {
		el.fireEvent('on' + type, evt);
	}
	return evt;
}
function click(el) {
	var ev = mouseEvent('click', el.offsetLeft, el.offsetTop, el.clientLeft, el.clientTop);
	dispatchEvent(el, ev);
}

describe('zino', function () {
	this.timeout(10000);

	describe('simple element', function() {
		it('can load a custom element', function(done) {
			Zino.import('base/test/components/btn.html', function() {
				setTimeout(function() {
					assertNotEmpty(document.querySelectorAll('.-shadow-root'), 'element is rendered');
					assertNotEmpty(document.querySelectorAll('btn[__ready]'), 'element is ready');
					done();
				}, 100);
			});
			var btn = document.createElement('btn');
			btn.setAttribute('page', '#12')
			document.body.appendChild(btn);
		});
		it('binds an event to it', function(done) {
			setTimeout(function() {
				click(document.querySelector('button'));
				assertEqual(location.hash, '#12', 'event did trigger');
				done();
			}, 50);
		});
	});
	describe('complex element', function () {
		var comment;
		it('renders empty', function (done) {
			Zino.import('base/test/components/comment.html', function() {
				setTimeout(function() {
					assertElementHasContent('comment h2', '""', 'headline empty');
					assertElementIsEmpty('comment p', 'paragraph is empty');
					done();
				}, 100);
			});
			comment = document.createElement('comment');
			document.body.appendChild(comment);
		});
		it('reacts to attribute change', function(done) {
			comment.setAttribute('author', 'Tester');
			comment.body = 'This is my wonderful test comment!';

			setTimeout(function() {
				assertElementHasContent('comment h2', '"Tester"');
				assertElementHasContent('comment p', comment.body);
				done();
			}, 100);
		});
	});
	describe('multi-component element', function () {
		var secondTag;
		it('render the sub component', function (done) {
			Zino.import('base/test/components/second-tag.html', function() {
				setTimeout(function() {
					assertNotEmpty(document.querySelectorAll('todo-list .-shadow-root'), 'sub component rendered');
					done();
				}, 2000);
			});
			secondTag = document.createElement('second-tag');
			secondTag.setAttribute('me', 'test');
			document.body.appendChild(secondTag);
		});
		it('should react to props change', function (done) {
			secondTag.setProps('name', 'Minkelhutz');
			setTimeout(function() {
				assertElementHasContent('second-tag div a[name]', 'Minkelhutz', 'Props change did trigger re-render');
				done();
			}, 32);
		});
		it('should transfer props to sub component', function (done) {
			secondTag.setProps('list', [{
				me: 'XXX'
			}]);
			setTimeout(function() {
				assertEqual(secondTag.querySelector('todo-list li input').value, 'XXX', 'props were transferred');
				done();
			}, 32);
		});
	});
	describe('component preloading', function() {
		Zino.fetch('base/test/components/virtual-component.html', null, true, '<virtual-component>I render text: <quote>{{body}}</quote> -- yeah!</virtual-component>');
		Zino.import('base/test/components/virtual-component.html');

		var vc = document.createElement('virtual-component');
		vc.innerHTML = 'Lorem ipsum dolor sit amet';
		document.body.appendChild(vc);
		
		it('renders the component', function(done) {
			setTimeout(function() {
				assertNotEmpty(document.querySelectorAll('virtual-component .-shadow-root'), 'component rendered');
				assertElementHasContent('virtual-component quote', 'Lorem ipsum dolor sit amet', 'attribute has been applied correctly');
				done();
			}, 50);
		});

		var component = document.createElement('my-component');
		document.body.appendChild(component);

		function MyComponent(Tag) {
			return {
				tagName: 'my-component',
				render: function(data) {
					return new Tag('div', {id: 'my-id'}, ['Hello,', data.props.name, new Tag('p', {}, 'Paragraph')]);
				},
				styles: [':host { color: red; }', '#my-id { font-weight: bold; }'],
				functions: {
					props: {
						name: 'World!'
					}
				}
			};
		}

		it('can import JS', function(done) {
			Zino.import(MyComponent);

			setTimeout(function() {
				assertElementHasContent('my-component .-shadow-root #my-id', 'Hello,World!<p>Paragraph</p>');
				done();
			}, 32)
		});
	});

	describe('re-renders tag dynamically', function() {
		var ab = document.createElement('ab');
		ab.innerHTML = '12 34';
		document.body.appendChild(ab);
		Zino.fetch('base/test/components/ab.html', null, true, '<ab>{{props.x}}{{{body}}}{{^x}}Y{{/x}}{{#x}}{{.}}{{/x}}<script>{props:{x:"X"}}</script></ab>');
		Zino.import('base/test/components/ab.html');

		it('renders the body correctly', function(done) {
			setTimeout(function() {
				assertElementHasContent('ab .-shadow-root', 'X12 34Y', 'body contains expected value');
				done();
			}, 32);
		});

		it('re-renders after body change', function(done) {
			document.querySelector('ab').body = '34 56';
			setTimeout(function() {
				assertElementHasContent('ab .-shadow-root', 'X34 56Y', 're-rendered after body change');
				done();
			}, 32);
		});

		it('re-renders after setProps', function(done) {
			document.querySelector('ab').setProps('x', 'Y');
			setTimeout(function() {
				assertElementHasContent('ab .-shadow-root', 'Y34 56Y', 're-rendered after setProps');
				done();
			}, 32);
		});

		it('re-renders after setAttribute', function(done) {
			document.querySelector('ab').setAttribute('x', 'Z');
			setTimeout(function() {
				assertElementHasContent('ab .-shadow-root', 'Y34 56Z', 're-rendered after setAttribute');
				done();
			}, 32);
		});
	});

	describe('Escaping', function() {
		var cb = document.createElement('cb');
		cb.innerHTML = '<div class="me">123</div>'
		document.body.appendChild(cb);
		it('works for dynamic HTML content', function(done) {
			Zino.import(function(Tag) {
				return {
					tagName: 'cb',
					render: function(data) {
						return new Tag('div', {'class': 'test'}, data.body);
					}
				}
			});
			setTimeout(function() {
				assertElementHasContent('cb .-shadow-root .test .me', '123', 'renders HTML values correctly');
				done();
			}, 32);
		});
		it('updated the component correctly', function(done) {
			cb.body = '<div class="me">test<span>huhu</span>123</div>';
			setTimeout(function() {
				if (document.querySelectorAll('cb .-shadow-root .test .me span').length <= 0) {
					throw new Error('Assertion failed: dynamic HTML in a component correctly' + cb.outerHTML);
				}
				done();
			}, 32);
		});
	});

	describe('Consistency', function() {
		Zino.import(function Part1(Tag) {
			return {
				render: function() {
					return [Tag('div', {'class': 'x11'}, 'Simple static text content')];
				}
			}
		});
		Zino.import(function Part2(Tag) {
			return {
				render: function() {
					return [Tag('ul', null, [1, 2, 3].map(function(l) { return Tag('li', null, l); }))];
				}
			}
		});
		Zino.import(function ConsistencyTest(Tag) {
			return {
				render: function(data) {
					return [Tag('h1', null, 'Click me'), Tag('part1'), Tag('p', null, 'Lorem ipsum')];
				},
				functions: {
					props: {
						part: 1
					},
					events: {
						h1: {click() {
							this.getHost().setProps('part', this.getHost().props.part === 1 ? 2 : 1);
						}}
					},
					render() {
						let part = this.ownerDocument.createElement('part' + this.props.part);
						this.querySelectorAll('.-shadow-root')[0].replaceChild(part, this.querySelectorAll('part1, part2')[0]);
					},
				}
			}
		});
		var consistencyTest = document.createElement('consistency-test');
		document.body.appendChild(consistencyTest);
		it('can deal with inconsistency', function(done) {
			setTimeout(function() {
				click(document.querySelector('consistency-test h1'));
				setTimeout(function() {
					assertNotEmpty(document.querySelectorAll('consistency-test part2 ul li'), 'has rendered lis');
					click(document.querySelector('consistency-test h1'));
					setTimeout(function() {
						assertNotEmpty(document.querySelectorAll('consistency-test part1 div.x11'), 'rendered original again');
						click(document.querySelector('consistency-test h1'));
						setTimeout(function() {
							assertNotEmpty(document.querySelectorAll('consistency-test part2 ul li'), 'has resolved inconsistency and events still work');
							done();
						}, 32);
					}, 32);
				}, 32);
			}, 32);
		});
	});
});
