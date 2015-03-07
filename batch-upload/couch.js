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

exports.deleteDocs = function( config, docs, rmdesign, purge, cb ) {
    
    var conf = config["target"]["params"];
    var c = new(cradle.Connection)(conf.host, conf.port, {
             auth: { username: conf.username, password: conf.password }
    });
    
    var db = c.database( conf.db );
    
	db.exists(function (err, exists) {
		if ( !err && exists ) {
            
            if ( docs.length < 1 ) {
                // Retrieve docs
                db.all(function(err, res) {
                    if ( !err ) {
                        var toDelete = [];
                        
                        // TODO: Check here!
                        if ( res ) {
    
                            for(i in res ) {
                                
                                var doc = res[i].doc;
                                
                                // Handling design
                                if ( rmdesign  ||  doc.id.indexOf("_design") == -1 ) {
                                    doc._deleted = true;
                                    toDelete.push(doc);
                                }
                            }
                        }
                        
                        console.log( toDelete );
                        // TODO: Delete Here
                    }
                });
            }

		} else {
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
