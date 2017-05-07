(function() {
	/** listens for events:
		- todo-added (requires todo to be added)
		- todo-removed (requires index of the element to be removed)
		- todo-initialize

	Triggers:
		- todos-changed (sends all current todos)
	**/

	// initialize our todo list
	var todos = JSON.parse(localStorage.getItem('todos') || 'false') || [];

	Zino.on('todo-added', function(todo) {
		// add new entry
		todos.push(todo);
		// send to database
		localStorage.setItem('todos', JSON.stringify(todos));
		// notify listeners that the todos have changed
		Zino.trigger('todos-changed', todos);
	});

	Zino.on('todo-removed', function(todoIdx) {
		// remove the given entry
		todos.splice(todoIdx, 1);
		// send the result to the database
		localStorage.setItem('todos', JSON.stringify(todos));
		// notify listeners that the todos have changed
		Zino.trigger('todos-changed', todos);
	});

	Zino.on('todo-initialize', function() {
		// send the current todos to the interested parties
		Zino.trigger('todos-changed', todos);
	});
	Zino.trigger('todos-changed', todos);
}());
