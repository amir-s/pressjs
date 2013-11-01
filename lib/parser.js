var marked = require('marked'),
	hljs = require('highlight.js');






marked.setOptions({
	highlight: function (code, lang) {
		return hljs.highlight(lang, code).value;
	}
});

var parse = module.exports = function (str) {
	str = str.split('\r\n').join('\n').split(/----*\n/);
	var meta = str[0].split('\n');
	var body = marked(str[1]);
	var post = {
		body: body,
		md: str[1],
		raw: '',
		errors: []
	}
	for (var i=0;i<meta.length-1;i++) {
		if (meta[i].indexOf(':') == -1) {
			post.errors.push("Meta, line: " + (i+1) + ", ':' does not found.");
			continue;
		}
		var m = meta[i].split(':');
		var key = m[0].trim().toLowerCase();
		var val = m[1].trim();
		if (post[key]) {
			post.errors.push("Meta, line: " + (i+1) + ", '" + key + "' does exists already.");
			continue;
		}
		post[key] = val;
	}

	if (post.tags) {
		post.tags = post.tags.split(',');
		for (var i=0;i<post.tags.length;i++) post.tags[i] = post.tags[i].trim();
	}
	if (!post.title) {
		post.errors.push("No title found.");
	}
	if (!post.url && post.title) {
		post.url = post.title.toLowerCase().replace(/\ +/g, '-').replace(/[^a-z0-9\-\.]/g, '');
	}
	if (!post.date) {
		post.date = new Date();
	}else {
		post.date = new Date(post.date);
	}
	for (var key in post) {
		if (['body', 'errors', 'raw', 'md'].indexOf(key) != -1) continue;
		post.raw += key+': '+post[key]+'\n';
	}
	post.raw += '------------------------\n' + post.md;
	return post;

}