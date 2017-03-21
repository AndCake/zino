(function(module) {
	'use strict';

	return module.exports = function(tag, propsOnly) {
		var attrs = {props: tag.props, element: tag.element, styles: tag.styles, body: tag['__i']},
			props = {};

		[].slice.call(tag.attributes).forEach(function(attribute) {
			var isComplex = attribute.name.indexOf('data-') >= 0 && attribute.value.substr(0, 2) === '--' && Zino.__data;
			attrs[attribute.name] || (attrs[attribute.name] = isComplex ? Zino.__data[attribute.value.replace(/^--|--$/g, '')] : attribute.value);
			if (attribute.name.indexOf('data-') >= 0) {
				props[attribute.name.replace(/^data-/g, '').replace(/(\w)-(\w)/g, function(g, m1, m2) {
					return m1 + m2.toUpperCase();
				})] = attrs[attribute.name];
			}
		});

		if (propsOnly) return props;

		return attrs;
	};
}(typeof window === 'undefined' ? module : {}))
