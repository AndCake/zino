import babel from 'rollup-plugin-babel';
import multiEntry from 'rollup-plugin-multi-entry';

export default {
	input: 'test/*.js',
	output: {format: 'cjs'},
	plugins: [
		multiEntry(),
		babel({
			exclude: 'node_modules/**'
		})
	],
	external: ['colors', 'nano-dom', 'fs', 'now-promise', 'path', 'fast-diff', 'crypto', 'readline-sync']
};
