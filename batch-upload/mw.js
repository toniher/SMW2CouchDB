var mw = require('nodemw');
var async = require('async');

exports.getSMWBlastDBcmd = function( config, importfunc, cb ) {

	// Improve config
	var bot = new mw( config.mw.conn );

	bot.logIn( function( err ) {

		if ( !err ) {

			var offset = -1; // we assume no offset
			SMWQuery( bot, config, importfunc, offset, cb );

		} else {
			console.log( err );
			cb("Err!");
		}
	});

};

// Get RecentChanges
exports.getRecentChanges = function( config, cb ) {
	// Improve config
	var bot = new mw( config.mw.conn );

	bot.logIn( function( err ) {

		if ( !err ) {

			var offset = -1; // we assume no offset
			bot.getRecentChanges( 0 , function( err, data ){
				console.log( data );
				// For each entry we try to see if it match a base query. If > 0 -> it is and proceeed
				// Iterate, if match config param, via SMWCon, then go ahead save by document type
				// If entries, query according to document type
				// Save and import
				
				cb( "Done!" );
			});
			

		} else {
			console.log( err );
			cb("Err!");
		}
	});
};

function generateSMWQuery( config, offset, cb ) {

	var base = config.base;
	var fields = config.fields;
	var limit = config.limit

	var smwquery = "";
	smwquery = base;

	var params = "";
	for ( var f = 0; f < fields.length; f = f + 1 ) {
		params = params + "|?" + fields[f];
	}

	if ( limit ) {
		params = params + "|limit=" + parseInt( limit, 10 );
	}

	if ( offset && offset > 0 ) {
		params = params + "|offset=" + parseInt( offset, 10 );
	}

	smwquery = smwquery + params;
	cb( smwquery );
}

function SMWQuery( bot, config, importfunc, offset, cb ) {

	var entries = [];

	// Diferent queries and documents
	var listqueries = config.mw.smwquery;
	var documents = config.target.document;

	var dockeys = Object.keys(listqueries);

	async.each(dockeys, function(dockey, callback) {

		// console.log( "Query " + dockey );
		if ( listqueries.hasOwnProperty( dockey ) ) {

			generateSMWQuery( listqueries[dockey], offset, function( askquery ) {
		
				var params = {
					action: 'ask',
					query: askquery
				};
			
				bot.api.call( params, function( err, info, next, data ) {
			
					if ( !err ) {
			
						var preoffset = offset;
						if ( data["query-continue-offset"] ) {
							offset = data["query-continue-offset"];
						} else {
							offset = -1;
						}
			
						if ( data && data.query && data.query.results ) {
						
							var results = data.query.results;
							
							for ( var k in results ) {
								if ( results[k] ) {
									entries.push( results[k] );
								}
							}
							if ( entries.length > 0 ) {
								// Push to couchDB
			
								if ( offset > 0 && ( offset > preoffset ) ) {
									// Reiterate here
									// console.log( offset );
									importfunc( config, mapSMWdocs( entries, documents[dockey] ), function( cb2 ) {
										SMWQuery( bot, config, importfunc, offset, cb );
									} );
								} else {
									importfunc( config, mapSMWdocs( entries, documents[dockey] ), function( cb2 ) {
										callback();
									} );
								}
							} else {
								cb("No results");
								callback();
							}
						} else {
		
							cb("No results");
							callback();
						}
					} else {
						console.log(err);
						cb("Err 2");
						callback();
					}
				});
		
			});

		}

	}, function( err ) {
		if ( err ) {
			console.log( err )
		}
		cb( "Everything imported" );

	});


}

function SMWQueryMatch( bot, config, importfunc, cb ) {

	var entries = [];

	// Diferent queries and documents
	var listqueries = config.mw.smwquery;
	var documents = config.target.document;

	var dockeys = Object.keys(listqueries);

	async.each(dockeys, function(dockey, callback) {

		// console.log( "Query " + dockey );
		if ( listqueries.hasOwnProperty( dockey ) ) {

			generateSMWQuery( listqueries[dockey], offset, function( askquery ) {
		
				var params = {
					action: 'ask',
					query: askquery
				};
			
				bot.api.call( params, function( err, info, next, data ) {
			
					if ( !err ) {
			
						if ( data && data.query && data.query.results ) {
						
							var results = data.query.results;
							
							for ( var k in results ) {
								if ( results[k] ) {
									entries.push( results[k] );
								}
							}
							if ( entries.length > 0 ) {
								// Push to couchDB

								importfunc( config, mapSMWdocs( entries, documents[dockey] ), function( cb2 ) {
									console.log( cb2 );
									callback();
								} );
							} else {
								cb("No results");
								callback();
							}
						} else {
		
							cb("No results");
							callback();
						}
					} else {
						console.log(err);
						cb("Err 2");
						callback();
					}
				});
		
			});

		}

	}, function( err ) {
		if ( err ) {
			console.log( err );
		}
		cb( "Everything imported" );
	});

}


function mapSMWdocs( entries, mapconfig ) {

	var docs = [];
	
	var config = JSON.parse(JSON.stringify(mapconfig));

	// First assign types for config
	var types = [];

	for ( var d in config ) {
	
		if ( config[d] ) {
			var def = config[d];
			if ( def.startsWith('$') ) {
				types[d] = "int";
			} else if ( def.startsWith('~') ) {
				types[d] = "link";
			} else if ( def.startsWith('@') ) {
				if ( def.startsWith('@$') ) {
					types[d] = "arrayint";
				} else if ( def.startsWith('@~') ) {
					types[d] = "arraylink";
				} else {
					types[d] = "array";
				}
			} else {
				types[d] = "string";
			}

			def = def.replace("@", "");
			def = def.replace("$", "");
			def = def.replace("~", "");
			config[d] = def; //Replace config
		}

	}

	for ( var e = 0; e < entries.length; e = e + 1 ) {

		var doc = {};
		for ( var d in config ) {

			if ( config[d] ) {
				var def = config[d];
				var val = "";
				if ( def.startsWith('#') ) {
					def = def.replace("#", "");
					val = formatEntry( entries[e][def], types[d] );
				} else {
					val = formatEntry( entries[e]["printouts"][def], types[d] );
				}

				if ( val !== "" ) {
					doc[d] = val;
				}
			}
		}

		docs.push( doc );
	}
	
	return docs;

}


if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function (str){
		return this.slice(0, str.length) == str;
	};
}

function formatEntry( value, type ) {

	var out = "";

	if ( type === "int" ) {
		if ( value.isArray ) {
			out = parseInt( value[0], 10 );
		} else {
			out = parseInt( value, 10 );
		}
	} else if ( type === "string" ) {
		if ( value.isArray ) {
			out = String( value[0] );
		} else {
			out = String( value );
		}
	} else if ( type === "link" ) {
		if ( value.isArray || typeof value === 'object' ) {
			out = String( value[0]["fulltext"] );
		} else {
			out = String( value["fulltext"] );
		}
	} else {
		if ( type === "array" ) {
			out = value;
		} else {
			if ( typeof value !== 'string' ) {
				out = value[0];
			} else {
				out = value;
			}
		}
	}

	if ( out === 'nan' ) {
		out = "";
	}

	return out;
}
