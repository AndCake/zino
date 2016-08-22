(function() {
	'use strict';

	/*jshint esnext:true*/
	return {
		props: {
			color: 'white'
		},

		styles: {
			button: {
				backgroundColor: 'green',
				border: '1px solid darkgreen',
				fontFamily: 'Arial'
			},

			link: function () {
				return {color: this.props.color};
			}
		}
	};
}());
