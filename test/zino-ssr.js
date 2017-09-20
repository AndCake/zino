import test from './test';
import {renderComponent} from '../src/zino-ssr';

test('Server-side rendering');

test('can load a simple component', t => {
	let result = renderComponent('server-test-simple', './test/components/server-test-simple');
	t.is(result.split('<script>')[0], '<server-test-simple __ready="true"><div class="-shadow-root">test</div></server-test-simple>');
});

test('can deal with styles', t => {
	let result = renderComponent('server-test-styles', './test/components/server-test-styles');
	t.is(result.split('<script>')[0], '<style id="style:server-test-styles">server-test-styles{background: red;}</style><server-test-styles __ready="true"><div class="-shadow-root">test</div></server-test-styles>');
});
