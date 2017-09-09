module.exports = function(Tag) {
	return {
		tagName: 'server-test-styles',
		render: function(data) {
			return ['test'];
		},
		styles: ['server-test-styles{background: red;}'],
		functions: {}
	};
};
