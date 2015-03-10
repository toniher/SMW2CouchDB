var cradle = require('cradle');
var async = require('async');
var underscore = require('underscore');

exports.insertBatch = function( config, docs, cb ) {

	var conf = config["target"]["params"];
	var c = new(cradle.Connection)(conf.host, conf.port, {
		 auth: { username: conf.username, password: conf.password }
	});

	var db = c.database( conf.db );

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


exports.addIndexes = function( config, cb ) {

	var conf = config["target"]["params"];
	var c = new(cradle.Connection)(conf.host, conf.port, {
		 auth: { username: conf.username, password: conf.password }
	});

	var db = c.database( conf.db );

	var indexes = config["target"]["indexes"];

	if ( indexes ) {
		for ( var index in indexes ) {

			if ( indexes.hasOwnProperty( index ) ) {
				// Process view

				var desdoc = indexes[index];
				// Detect if exists
				console.log( index );
				
				db.get( index, function (err, doc) {

					if ( doc && doc["_rev"] ) {
						db.save( index, doc["_rev"], desdoc );
					} else {
						db.save( index, desdoc );
					}
				});
			}
		}
	}

};

// TODO: Check better way here https://gist.github.com/ryankirkman/873942
exports.deleteDocs = function( config, docs, rmdesign, purge, cb ) {
	 
	var conf = config["target"]["params"];
	var c = new(cradle.Connection)(conf.host, conf.port, {
		  auth: { username: conf.username, password: conf.password }
	});

	var db = c.database( conf.db );
	console.log( db );

	db.exists(function (err, exists) {
		if ( !err && exists ) {
			
			if ( ! docs || docs.length < 1 ) {
				// Retrieve docs
				db.all(function(err, res) {
					if ( !err ) {
						// TODO: Check here!
						if ( res ) {
						
							for( i in res ) {
								var doc = res[i];

								// Handling design
								if ( rmdesign  ||  doc.id.indexOf("_design") == -1 ) {
									db.remove(doc.id, doc.value.rev, function(err, rmdoc) {
										  console.log(rmdoc);
									}); 
								}
							}
						}
					}
				});
			} else {
				 // TODO: Generate list of ids?
				 
				 for( i in docs ) {

					var doc = docs[i];
					// Handling design
					if ( rmdesign  ||  doc.id.indexOf("_design") == -1 ) {
						 db.remove(doc.id, doc.value.rev, function(err, rmdoc) {
							 console.log(rmdoc);
						 }); 
					}
				}
			}

		} else {
			console.log("Not");
			console.log( err );
			cb( "error ");
		}
	});
};


exports.updateBatch = function( config, docs, cb ) {

	var conf = config["target"]["params"];
	var c = new(cradle.Connection)(conf.host, conf.port, {
		 auth: { username: conf.username, password: conf.password }
	});

	var db = c.database( conf.db );

	db.exists(function (err, exists) {
		if ( !err && exists ) {

			var updocs = [];

			async.each( docs, function( doc, callback ) {
				var id = doc["_id"];

				// get document of couchdb
				db.get( id, function (err, cdoc) {
					if ( ! err ) {

						if ( cdoc ) {

							// Compare cdoc and doc, if not the same, save
							var compdoc = JSON.parse( JSON.stringify( cdoc ) );
							var cdmpdoc = JSON.parse( JSON.stringify( doc ) );

							
							if ( ! compareDocs( cdmpdoc, compdoc ) ) {
								var rev = cdoc["_rev"];
								doc["_rev"] = rev;
								// console.log( doc );
								updocs.push( doc )
								callback();
							}
						}
					}
				});

			}, function(err){
				if( ! err ) {

					console.log( updocs );
					// we update everythin with revs included
					db.save( updocs, function (err, res) {
						if ( ! err ) {
							console.log( res );
							cb("imported");
						} else {
							console.log( err );
						}
					});
				}
			});
			

		} else {
			console.log( err );
			cb( "error ");
		}
	});

};

function compareDocs( doc1, doc2 ) {

	
	// Base is first doc
	for ( var key in doc1 ) {
		if ( doc1.hasOwnProperty( key ) ) {
			if ( doc2[ key ] ) {
				if ( doc1[key] !== doc2[key] ) {
					return false;
				}
			} else {
				return false;
			}
		}
	}
	return true;
}
