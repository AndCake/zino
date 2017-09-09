import {Zino, setComponentLoader, actions, setDocument, flushRegisteredTags} from './facade';
import Document from 'nano-dom';

global.Zino = Zino;
setComponentLoader((path, fn) => {
	let code = require(path);
	fn(code);
});
Zino.on('--zino-rerender-tag', actions.render);

/** renders a single component */
export function renderComponent(name, path, props) {
	flushRegisteredTags();

	let document = new Document('<' + name + '></' + name + '>');
	setDocument(document);
	// initialize props
	document.body.children[0].props = props;
	// import and render component
	Zino.import(path);

	return document.head.innerHTML + document.body.innerHTML;
}
