var cradle = require('cradle');

exports.insertBatch = function( config, docs, cb ) {

	var conf = config["target"]["params"];


	var c = new(cradle.Connection)(conf.host, conf.port, {
		 auth: { username: conf.username, password: conf.password }
	});

	var db = c.database( conf.db );
	console.log( db );

	db.exists(function (err, exists) {
		if ( !err && exists ) {
			db.save( docs, function (err, res) {
				if ( ! err ) {
					console.log( res );
					cb("imported");
				} else {
					console.log( err );
				}
			});
		} else {
			console.log( err );
			cb( "error ");
		}
	});




};