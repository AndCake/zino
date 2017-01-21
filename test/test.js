// https://github.com/cheeriojs/cheerio
// ...
(() => {
    'use strict';

    var z = require('../zino-tester');

    describe('my-new-tag', function() {
        this.timeout(100000);
        z.importTag('examples/src/my-new-tag.html');

        it('initializes empty', () => z.matchesSnapshot('<my-new-tag></my-new-tag>'));
        it('accepts a test attribute', () => z.matchesSnapshot('<my-new-tag test=""></my-new-tag>'));
        it('accepts a value for test attribute', () => z.matchesSnapshot('<my-new-tag test="mhehehe"></my-new-tag>'));
    });
}());
