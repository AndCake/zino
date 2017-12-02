import test from './test';
import {renderComponent} from '../src/zino-ssr';

test('Server-side rendering');

test('can load a simple component', t => {
	let result = renderComponent('server-test-simple', './test/components/server-test-simple');
	result.then(result => t.is((''+result).split('<script>')[0], '<server-test-simple><div class="-shadow-root">test</div></server-test-simple>'));
});

test('can deal with styles', t => {
	let result = renderComponent('server-test-styles', './test/components/server-test-styles');
	result.then(page => t.is((''+page).split('<script>')[0], '<style id="style:server-test-styles">server-test-styles{background: red;}</style><server-test-styles><div class="-shadow-root">test</div></server-test-styles>'));
});

test('renders classes correctly', t => {
	let result = renderComponent('server-test-class', './test/components/server-test-class');
	result.then(page => t.is(('' + page).split('<script>')[0], '<server-test-class><div class="-shadow-root"><div class="test">Hello World!</div></div></server-test-class>'));
});
