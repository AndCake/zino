import babel from 'rollup-plugin-babel';

export default {
	entry: 'src/zino.js',
	dest: './zino.js',
	format: 'umd',
	moduleName: 'Zino',
	sourceMap: true,
	plugins: [
		babel({
			exclude: 'node_modules/**'
		})
	]
};
