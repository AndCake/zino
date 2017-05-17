import babel from 'rollup-plugin-babel';

export default {
	entry: 'src/zino-tester.js',
	dest: './test.js',
	format: 'cjs',
	plugins: [
		babel({
			exclude: 'node_modules/**'
		})
	],
	external: ['colors', 'fs', 'path', 'fast-diff', 'crypto', 'readline-sync']
};
