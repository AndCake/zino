import babel from 'rollup-plugin-babel';

export default {
	input: 'src/zino-tester.js',
	output: {
		file: './test.js',
		format: 'cjs'
	},
	plugins: [
		babel({
			exclude: 'node_modules/**'
		})
	],
	external: ['nano-dom', 'colors', 'fs', 'path', 'fast-diff', 'crypto', 'readline-sync']
};
