var fs = require('fs'),
	engine = require('./engine'),
	path = require('path'),
	cp = require('./cp'),
	connect = require('connect'),
	program = require('commander');

program
	.version('0.0.3')
	.option('init', 'creates a brand new blog in current directory')
	.option('build <file>', 'builds a new post from <file> and updates the blog')
	.option('rebuild <file>', 'rebuilds the post from <file> and updates the blog')
	.option('update', 'updates the entire blog files from posts')
	.option('test [port]', 'create a web server on localhost:port to serve the blog [3000]', Number, 3000)
	.parse(process.argv);


if (process.argv.length < 3) program.help();

if (program.init) {
	var assets = path.join(path.dirname(fs.realpathSync(__filename)), './assets');
	var dest = fs.realpathSync(process.cwd());
	cp(assets, dest);
	console.log("Done");
}else if (program.build || program.rebuild) {
	var fileName = program.build || program.rebuild;
	var file = path.join(process.cwd(), fileName);
	
	if (!fs.existsSync(file)) {
		console.log("The file '" + fileName + "' does not exists.");
		process.exit(1);
	}
	engine.build(process.cwd(), file, program.rebuild?true:false);
	
}else if (program.update) {
	engine.update(process.cwd());
}else if (program.test) {
	var blog = require(path.join(process.cwd(), './blog'));
	var original = blog.url;
	blog.url = 'http://localhost:' + program.test + '/';
	fs.writeFileSync(path.join(process.cwd(), './blog.js'), JSON.stringify(blog, null, 4));

	engine.update(process.cwd());

	blog.url = original;
	fs.writeFileSync(path.join(process.cwd(), './blog.js'), JSON.stringify(blog, null, 4));
	
	var app = connect()
		.use(connect.logger('dev'))
		.use(connect.static(process.cwd()))
		.use(connect.directory(process.cwd()))
		.use(function(req, res){
			res.end('404');
		})
		.listen(parseInt(program.test));
	console.log("\n Server stated, navigate to http://localhost:" + program.test);
	console.log(" IMPORTANT: use `pressjs update` again before uploading the blog.");
}

