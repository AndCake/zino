import {find, parse} from '../src/htmlparser';
import test from './test';

let dom;

test('HTML Parser');

test('can parse HTML', t => {
	dom = parse(`
		test text
		<!-- this is a comment -->
		<div><div class="hallo, Welt!">
			YYY
			<ul>
				<li>A<a href="#1">Test</a>B
					<div class="opened">nothing here</div>
					<img src="test">
				</li>
				<li id="my-id">
					a<a href="#2">Test 2</a>b
					<br/>
					<div class="closed">Also nothing here</div>
				</li>
			</ul>
			XXX
		</div></div>
		Und ein Ende.
		<script data-src="./second-tag.js">
	(function() {
		'use strict';

		/*jshint esnext:true*/
		return {
			props: {
				color: 'white'
			},

			styles: {
				button: {
					backgroundColor: 'green',
					border: '1px solid darkgreen',
					fontFamily: 'Arial'
				},

				link: function () {
					return {color: this.props.color};
				}
			}
		};
	}());
	</script>
	`);
});

test('allows access to properties', t => {
	t.is(dom.children[1].children[0].attributes['class'], 'hallo, Welt!');
	dom.children[1].setAttribute('test', 'hello');
	t.is(dom.children[1].attributes.test, 'hello', 'can set attributes');
	dom.children[1].setAttribute('test', null);
});

test('can query elements', t => {
	t.is(find('li', dom).length, 2, 'finds sub tags');
	t.is(find('div', dom).length, 4, 'finds self-containing tags');
	t.is(find('.opened', dom).length, 1, 'can use classes');
	t.is(find('#my-id', dom).length, 1, 'can use IDs');
	t.is(find('[href]', dom).length, 2, 'can use other attribute definitions');
	t.is(find('[href="#2"]', dom).length, 1, 'can use attribute values');
	t.is(find('[class$="ed"]', dom).length, 2, 'can use end of attribute values');
	t.is(find('[class^="ha"]', dom).length, 1, 'can use beginning of attribute values');
	t.is(find('[class*="pen"]', dom).length, 1, 'can use anywhere in attribute values');
	t.is(find('[class*="pen"]', dom)[0].innerHTML, 'nothing here', 'returns correct element');
	t.is(find('script', dom).length, 1, 'can parse & find the script tag');
});

test('DOM is interactive', t => {
	dom.children[1].innerHTML = 'test <b class="button">Hallo, Welt!</b> me';
	t.is(dom.children[1].children[1].tagName, 'b', 'has parsed and integrated tag into DOM');

	dom.children[1].removeChild(dom.children[1].children[1]);
	t.is(dom.children[1].outerHTML, '<div>test  me</div>', 'has removed node from DOM');
});
