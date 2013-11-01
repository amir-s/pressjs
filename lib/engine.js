var parse = require('./parser'),
	path = require('path'),
	mkdirp = require('mkdirp'),
	rimraf = require('rimraf'),
	ejs = require('ejs'),
	parse = require('./parser'),
	fs = require('fs');

ejs.open = '{{';
ejs.close = '}}';


var render = function (file, data, blog) {
	var $ = {
		url: function(p) {
			if (!p) p = '';
			return blog.url + p;
		}
	}
	data.$ = $;
	data.blog = blog;
	return ejs.render(file, data);
}


var build = module.exports.build = function (blogPath, file, override) {
	var blog = JSON.parse(fs.readFileSync(path.join(blogPath, './blog.js')));
	var post = parse(fs.readFileSync(file).toString());
	if (post.errors.length > 0) {
		console.log("There were some errors:");
		post.errors.forEach(function (v, i) {
			console.log(" ["+(i+1)+"]	"+v);
		});
		return;
	}
	var postPath = path.join(blogPath, './posts/' + post.url + '/');
	if (!override && fs.existsSync(postPath)) {
		console.log("The url '" + post.url + "' is already existed");
		return;
	}
	mkdirp.sync(postPath);
	fs.writeFileSync(path.join(postPath, './index.md'), post.raw);
	update(blogPath);
	console.log("Done");
}

var update = module.exports.update = function (blogPath) {
	var blog = JSON.parse(fs.readFileSync(path.join(blogPath, './blog.js')));
	var folders = fs.readdirSync(path.join(blogPath, './posts/'));
	var posts = [];
	var tags = {};
	folders.forEach(function (name, index) {
		var folder = path.join(blogPath, './posts/' + name);
		if (!fs.statSync(folder).isDirectory()) return;
		if (!fs.existsSync(path.join(folder,'./index.md'))) return;
		var post = parse(fs.readFileSync(path.join(folder,'./index.md')).toString());
		if (post.url != name) {
			fs.renameSync(folder, path.join(blogPath, './posts/' + post.url));
		}
		posts.push(post);
		
	});
	posts.sort(function (p1, p2) {
		return (p2.date.getTime()-p1.date.getTime());
	});
	console.log();
	console.log(blog.title);
	console.log();
	rimraf.sync(path.join(blogPath, './page'));
	rimraf.sync(path.join(blogPath, './tags'));
	var template = {
		index:	fs.readFileSync(path.join(blogPath, blog.theme.index)).toString(),
		tags:	fs.readFileSync(path.join(blogPath, blog.theme.tags)).toString(),
		post:	fs.readFileSync(path.join(blogPath, blog.theme.post)).toString()
	}
	for (var i=0;i<posts.length;i+=blog.pageSize) {
		console.log(" Page #" + (i/blog.pageSize+1));
		for (var j=0;j<blog.pageSize && i+j < posts.length;j++) {
			posts[i+j].tags.forEach(function (tag) {
				tags[tag] = tags[tag] || [];
				tags[tag].push(posts[i+j]);
			});
			console.log("   " + posts[i+j].title);
			if (posts[i+j].errors.length > 0) {
				console.log("     There were some errors:");
				posts[i+j].errors.forEach(function (v, i) {
					console.log("       " + v);
				});
			}
			fs.writeFileSync(path.join(blogPath, './posts/' + posts[i+j].url + '/index.html'), render(template.post, {post: posts[i+j], nextPost: posts[i+j+1], prevPost: posts[i+j-1]}, blog));
			fs.writeFileSync(path.join(blogPath, './posts/' + posts[i+j].url + '/index.md'), posts[i+j].raw);
		}

		var pagePosts = posts.slice(i, i+blog.pageSize);
		var page = {current: i/blog.pageSize+1, total: Math.ceil(posts.length/blog.pageSize)};
		mkdirp.sync(path.join(blogPath, './page/' + page.current));
		fs.writeFileSync(path.join(blogPath, './page/' + page.current + '/index.html'), render(template.index, {posts: pagePosts, page: page}, blog));
		if (i == 0) {
			fs.writeFileSync(path.join(blogPath, './index.html'), render(template.index, {posts: pagePosts, page: page}, blog));
		}
	}
	for (var tag in tags) {
		var posts = tags[tag];
		mkdirp.sync(path.join(blogPath, './tags/' + tag));
		fs.writeFileSync(path.join(blogPath, './tags/' + tag + '/index.html'), render(template.tags, {posts: posts}, blog));
	}
}