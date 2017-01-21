(function() {
    'use strict';

    var cheerio = require('cheerio'),
        colors = require('colors'),
        diff = require('fast-diff'),
        readline = require('readline-sync'),
        fs = require('fs'),
        path = require('path'),
        sha1 = data => require('crypto').createHash('sha1').update(data).digest('hex'),

        merge = function() {
            var args = arguments,
			    target = args[0];

		    for (var i = 1; i < args.length; i += 1) {
			    for (var all in args[i]) {
				    target[all] = args[i][all];
			    }
		    }

		    return target;
        },

        loadedTags = {};

    /* make a tag known in the registry */
    var importTag = function(tagFile) {
            var tagContent = fs.readFileSync(tagFile, 'utf-8'),
                tag = {},
                $ = cheerio.load(tagContent),
                tagRoot = $.root().children().first(),
                emptyFunc = () => {},
                scripts = $('script').map(function() { return {text: $(this).text()}}).get();

            global.Zino = {
                trigger: emptyFunc,
                on: emptyFunc,
                off: emptyFunc,
                one: emptyFunc,
                import: emptyFunc,
                fetch: emptyFunc,
                mount: emptyFunc,
                mountAll: emptyFunc
            };
            tag = require('loader').handleScripts(tagRoot.get(0).tagName, scripts, emptyFunc, emptyFunc, merge);
            $('script, style, link').remove();
            tagContent = tagRoot.html();

            loadedTags[tagRoot.get(0).tagName] = {
                tag,
                tagContent,
                ref: $,
                tagFile
            };
        },

        renderTag = (html, data) => {
            var tag = cheerio.load(html),
                tagName,
                instance = {};

            tag = tag.root().children().first();
            tagName = tag.get(0).tagName;

            if (!loadedTags[tagName]) {
                throw new Error(tagName + ' is not imported. Please import it before using it.');
            }
            loadedTags[tagName].tag.__i = tag.html();

            loadedTags[tagName].tag.mount.call(merge(instance, loadedTags[tagName].tag));
            data = require('attributes')(merge({
                attributes: Object.keys(tag.get(0).attribs).map(attr => ({name: attr, value: tag.get(0).attribs[attr]}))
            }, instance, data));

            return {
                html: require('parser')(loadedTags[tagName].tagContent, data, merge),
                data,
                tagName,
                registry: loadedTags[tagName]
            };
        },

        /* renders a tag with the given data and checks if it matches a previously-set snapshot */
        matchesSnapshot = (html, data) => {
            var result = renderTag(html, data),
                resultString = '',
                filename = './test/snapshots/' + result.tagName + '-' + sha1(html).substr(0, 5) + '.json';

            delete result.registry;

            if (!fs.existsSync(path.dirname(filename))) {
                fs.mkdirSync(path.dirname(filename));
            }

            resultString = JSON.stringify(result);

            if (!fs.existsSync(filename)) {
                fs.writeFileSync(filename, resultString);
            } else {
                result = fs.readFileSync(filename, 'utf-8');
                if (result !== resultString) {
                    result = diff(result, resultString);
                    result.forEach(part => {
                        var color = part[0] === diff.DELETE ? 'red' : part[0] === diff.INSERT ? 'green' : 'gray';
                        process.stderr.write(part[1][color]);
                    });
                    if (readline.question('\nThe snapshots don\'t match.\nDo you want to take the new one as the reference snapshot (y/N)?') === 'y') {
                        fs.writeFileSync(filename, resultString);
                        return;
                    }
                    throw new Error('Snapshots don\'t match.');
                }
            }
        };

    module.exports = {
        matchesSnapshot,
        importTag
    };
}());
