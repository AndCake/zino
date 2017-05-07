import * as events from '../src/events';
import test from './test';

test('Event handling');

test('can register for event', t => {
	let called = false;
	events.on('my-event', () => {called = true;});
	events.trigger('my-event');
	t.true(called, 'custom event was called');

	called = false;
	events.on('other-event', data => {called = true; t.is(data, 'test', 'data correctly received')});
	events.trigger('other-event', 'test');
	t.true(called, 'custom event was called with data');
});

test('can remove event handler', t => {
	let called = false,
		handler = () => {
			called = true;
		};
	events.on('remove-event', handler);
	events.off('remove-event', handler);
	events.trigger('remove-event');
	t.false(called, 'custom event handler was removed');

	called = 0;
	events.on('remove-event', () => { called++; });
	events.on('remove-event', () => { called++; });
	events.on('remove-event', () => { called++; });
	events.trigger('remove-event');
	t.is(called, 3, 'all three event handlers registered');
	called = 0;
	events.off('remove-event');
	events.trigger('remove-event');
	t.is(called, 0, 'no removed event handler called');
});

test('can register one-time handler', t => {
	let called = 0;

	events.one('one-time', () => called++);
	events.trigger('one-time');
	t.is(called, 1, 'one-time event handler has been called');

	called = 0;
	events.trigger('one-time');
	t.is(called, 0, 'one-time event handler has been removed');
});