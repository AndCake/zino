(function(module) {
	var urlLibrary = {};
	return module.exports = {

		// merges any objects given into the function
		merge: function() {
			var args = arguments,
				target = args[0];

			for (var i = 1; i < args.length; i += 1) {
				for (var all in args[i]) {
					target[all] = args[i][all];
				}
			}

			return target;
		},

		// returns an array of elements that match the given selector in the given context
		domQuery: function(selector, context) {
			return [].slice.call((context || doc).querySelectorAll(selector));
		},

		// simplified GET AJAX request
		fetch: function(url, callback, cache) {
			if (cache && urlLibrary[url] && !urlLibrary[url].cb) {
				return callback(urlLibrary[url]);
			} else if (typeof urlLibrary[url] === 'object') {
				return urlLibrary[url].cb.push(callback);
			}
			urlLibrary[url] = {
				cb: [callback]
			};
			var req = new XMLHttpRequest();
			req.open('GET', url, true);
			req.onreadystatechange = function() {
				if (req.readyState === 4) {
					var callbacks = urlLibrary[url].cb;
					if (req.status === 200 && cache) {
						urlLibrary[url] = req.responseText;
					}
					if (!cache) delete urlLibrary[url];
					for (var all in callbacks) {
						callbacks[all](req.responseText);
					}
				}
			};
			req.send();
		},

		error: function(method, tag, parentException) {
			if (parentException) {
				throw new Error('Error while calling ' + method + ' function of ' + tag + ': ' + parentException.message, parentException.fileName, parentException.lineNumber);
			} else {
				parentException = tag;
				throw new Error(method + ': ' + parentException.message, parentException.fileName, parentException.lineNumber);
			}
		},

		checkParams: function(args, types, api) {
			for (var all in args) {
				if (types[all] && typeof args[all] !== types[all]) {
					throw new Error('API mismatch while using ' + api + ': Parameter ' + all + ' was supposed to be ' + types[all] + ' but ' + (typeof args[all]) + ' was given.');
				}
			}
		},

		safeAccess: function(obj) {
			return obj || {};
		},

		emptyFunc: function(){}
	};
}(typeof window === 'undefined' ? module : {}))
