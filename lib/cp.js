var fs = require('fs'),
	path = require('path'),
	mkdirp = require('mkdirp');


var cp = module.exports = function (src, dst) {
	var dir = fs.readdirSync(src);
	dir.forEach(function (f) {
		var addr = path.join(src, f);
		var destaddr = path.join(dst, f);
		if (fs.statSync(addr).isDirectory()) {
			mkdirp.sync(destaddr);
			cp(addr, destaddr);
		}else {
			//fs.createReadStream(addr).pipe(fs.createWriteStream(destaddr));
			fs.writeFileSync(destaddr, fs.readFileSync(addr));
		}
	})
}