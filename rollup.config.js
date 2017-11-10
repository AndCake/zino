import babel from 'rollup-plugin-babel';

export default {
	input: 'src/zino.js',
	output: {
		file: './zino.js',
		format: 'iife',
		name: '__zino',
		sourcemap: true
	},
	plugins: [
		babel({
			exclude: 'node_modules/**'
		})
	],
	external: ['nano-dom', 'now-promise']
};
