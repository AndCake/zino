module.exports = function() {
	return function ServerTestClass(Tag) {
		this.render = function(data) {
			return Tag('div', {class: 'test'}, 'Hello World!');
		};
	};
};