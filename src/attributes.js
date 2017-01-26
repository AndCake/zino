(function(module) {
	'use strict';

	return module.exports = function(tag) {
		var attrs = {props: tag.props, element: tag.element, styles: tag.styles, body: tag['__i']};

		[].slice.call(tag.attributes).forEach(function(attribute) {
			attrs[attribute.name] || (attrs[attribute.name] = attribute.value);
		});

		return attrs;
	};
}(typeof window === 'undefined' ? module : {}))
