(function(module) {
	'use strict';

	var originalInnerHTML = '__i';

	return module.exports = function(tag) {
		var attrs = {props: tag.props, element: tag.element, styles: tag.styles, body: tag[originalInnerHTML]};

		[].slice.call(tag.attributes).forEach(function(attribute) {
			attrs[attribute.name] || (attrs[attribute.name] = attribute.value);
		});

		return attrs;
	};
}(typeof window === 'undefined' ? module : {}))
