var mw = require('nodemw');
var async = require('async');

exports.getSMWBlastDBcmd = function( config, importfunc, cb ) {

	// Improve config
	var bot = new mw( config.mw.conn );

	bot.logIn( function( err ) {

		if ( !err ) {

			var offset = -1; // we assume no offset
			SMWQueryAll( bot, config, importfunc, offset, cb );

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

function SMWQueryAll( bot, config, importfunc, offset, cb ) {

	// Diferent queries and documents

	var listqueries = config.mw.smwquery;
	var documents = config.target.document;

	var dockeys = Object.keys(documents);

	async.each(dockeys, function( dockey, acb ) {

		console.log( "* Query " + dockey );

		async.each( listqueries, function( query, qcb ) {

			if ( query.hasOwnProperty("document") && query.document === dockey ) {

				SMWQuery( query, documents[dockey], bot, config, importfunc, offset, qcb, cb );

			} else {
				qcb();
			}

		}, function( err ) {
			if ( err ) {
				console.log( "Problem with "+dockey );
			}
			acb();
			console.log( "Imported "+dockey );
		});

	}, function( err ) {
		if ( err ) {
			console.log( err )
		}
		cb( "Everything imported" );

	});
}

function SMWQuery( query, document, bot, config, importfunc, offset, cbiter, cb ) {

	var entries = [];

	console.log( query );
	generateSMWQuery( query, offset, function( askquery ) {

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
					console.log( "ENTRIES:" + entries.length );
					if ( entries.length > 0 ) {
						// Push to couchDB
	
						if ( offset > 0 && ( offset > preoffset ) ) {
							// Reiterate here
							// console.log( offset );
							importfunc( config, mapSMWdocs( entries, document ), function( cb2 ) {
								SMWQuery( query, document, bot, config, importfunc, offset, cbiter, cb );
							} );
						} else {
							importfunc( config, mapSMWdocs( entries, document ), function( cb2 ) {
								cbiter();
							} );
						}
					} else {
						cbiter();
						cb("No results");
					}
				} else {
					cbiter();
					cb("No results");
				}
			} else {
				console.log(err);
				cbiter();
				cb("Err 2");

			}
		});

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
					val = formatEntry( entries[e][def], types[d] ); //Internal property
				} else if ( def.startsWith('*') ) {
					def = def.replace("*", "");
					val = def; // Constant
				} else {
					val = formatEntry( entries[e]["printouts"][def], types[d] ); //Actual SMW property
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

	if ( value ) {

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

	}

	return out;
}
