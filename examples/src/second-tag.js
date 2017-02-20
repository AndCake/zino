(function() {
	'use strict';

	Zino.import('todolist.html');

	/*jshint esnext:true*/
	return {
		props: {
			color: 'white',
			list: [{
				test: 123,
				me: "Hallo",
				x: {
					huhu: "ja",
					fn: function() { console.log(arguments); }
				},
				y: [1, 2, 3, 4]
			}]
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
