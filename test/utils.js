import {objectDiff} from '../src/utils';
import test from './test';

test('Object Difference Calculation');

let objA = {test: 123, me: 'test', x: {list: [1, 2, 3]}};

test('compare same objects', t => {
	let result = objectDiff(objA, objA);
	t.false(result, false, 'same ');
});

test('compare two different objects', t => {
	let objB = {test: 123, me: 'test', x: {list: [1, 2, 4]}};
	let result = objectDiff(objA, objB);
	t.not(result, false, 'objA and objB are different');
	t.false(objectDiff(result, {x: {list: {2: 4}}}), 'locates incorrect entry in array');	
});

test('different values', t => {
	let objC = {test: 12, me: 'txst', x: {list: [1, 2, 3]}};
	let result = objectDiff(objA, objC);
	t.not(result, false, 'objA and objC are different');
	t.false(objectDiff(result, {test: 12, me: 'txst'}), 'locates incorrect entries in object');
});

test('different properties', t => {
	let objD = {test: 123, entry: {test: 12}};
	let result = objectDiff(objA, objD);
	t.not(result, false, 'objA and objD are different');
	t.false(objectDiff(result, {me: 'test', x: {list: [1, 2, 3]}, entry: {test: 12}}), 'locates differences in both objects ');
});

test('different order', t => {
	let objE = {me: 'test', test: 123, x: {list: [1, 2, 3]}};
	let result = objectDiff(objA, objE);
	t.not(result, false, 'objA and objE are different');
	t.false(objectDiff(result, {me: 'test', test: 123}), 'locates swapped attribute positions ');
});
