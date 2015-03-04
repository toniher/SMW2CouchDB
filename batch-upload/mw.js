var mw = require('nodemw');

exports.getSMWBlastDBcmd = function( config, cb ) {

	// Improve config
	var bot = new mw( config.mw.conn );

	// Generate SMW Query
	var askquery = generateSMWQuery( config.mw.smwquery );

	bot.logIn( function( err ) {
	
		if ( !err ) {
			var params = {
				action: 'ask',
				query: askquery
			};
	
			bot.api.call( params, function( err, info, next, data ) {
				
				if ( !err ) {
	
					if ( data && data.query && data.query.results ) {
					
						var results = data.query.results;
						var entries = []; //List of docs
						
						for ( var k in results ) {
							if ( results[k] ) {
								entries.push( results[k] );
							}
						}
						
						if ( entries.length > 0 ) {
							// Push to couchDB
							
							cb( mapSMWdocs( entries, config.target.document ) ); 

						} else {
							cb("Bad");
						}
					}
				} else {
					console.log(err);
					cb("Err 2");
				}
			});
		} else {
			console.log( err );
			cb("Err!");
		}
	});

};

function generateSMWQuery( config ) {

	var base = config.base;
	var fields = config.fields;

	var smwquery = "";
	smwquery = base;

	var params = "";
	for ( var f = 0; f < fields.length; f = f + 1 ) {
		params = params + "|?" + fields[f];
	}

	smwquery = smwquery + params;
	return smwquery;
}

function mapSMWdocs( entries, config ) {

	var docs = [];

	// First assign types for config
	var types = [];

	for ( var d in config ) {
	
		if ( config[d] ) {
			var def = config[d];
			if ( def.startsWith('$') ) {
				types[d] = "int";
			} else if ( def.startsWith('@') ) {
				if ( def.startsWith('@$') ) {
					types[d] = "arrayint";
				} else {
					types[d] = "array";
				}
			} else {
				types[d] = "string";
			}

			def = def.replace("@", "");
			def = def.replace("$", "");
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
					docs.push( doc );
				}
			}
		}
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
	} else {
		if ( type === "array" ) {
			out = value;
		} else {
			if ( typeof value !== 'string' ) {
				out = value[0];
			} else {
				out = value;
			}
			if ( out === 'nan' ){
				out = "";
			}
		}
	}

	return out;
}
