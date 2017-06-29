function(Tag) {
	return {
		tagName: 'my-new-tag',
		styles: [':host {display: block; background:red;}'],

		render: function(data) {
			return [Tag('div', {}, 'This is some content ' + data.test), Tag('p', {}, 'Counting: ' + data.props.test)];
		},

		functions: {
			props: {
				test: 0,
				tasks: []
			},

			render: function() {
				var x = document.createElement('a');
				x.innerHTML = 'hallo';
				x.href = "test";
				this.querySelector('div').appendChild(x);
			},
			mount: function() {
				this.interval = setInterval(function() {
					this.setProps('test', this.props.test + 1);
				}.bind(this), 1000);
			},
			unmount: function() {
				clearInterval(this.interval);
				alert('unmounting!');
			}
		}
	};
}
