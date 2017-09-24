import {parse} from './mustacheparser';
import {Zino, setParser} from './zino-light';

export default Zino;
setParser(data => {
	// if we have HTML input
	if (data.trim().indexOf('<') === 0) {
		// convert it to JS
		data = parse(data);
	}

	return data;
});
