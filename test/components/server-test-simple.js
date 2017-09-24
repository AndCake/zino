module.exports = function() {
	return function(Tag) {
		return {
			tagName: 'server-test-simple',
			render: function(data) {
				return ['test'];
			},
			styles: [],
			functions: {}
		};
	};
};
