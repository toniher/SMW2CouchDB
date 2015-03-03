var mw = require('nodemw');
var cradle = require('cradle');

exports.getSMWBlastDBcmd = function( config, cb ) {

	// Improve config
	var bot = new mw( config.mediawiki );
	
	// From config
	var askquery = "";
	
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
						var entries = [];
						
						for ( var k in results ) {

							if ( results[k].printouts ) {
								for ( var p in results[k].printouts ) {
									if ( results[k].printouts[p] ) {
										var attrib = results[k].printouts[p];
										if ( attrib && attrib[0] ) {
											// Let's take the first attribute
											entries.push( attrib[0] );
										}
									}
								}
							}
						}
						
						if ( entries.length > 0 ) {
							// Push to couchDB
							
						} else {
						
						}
					}
				}
			});
			
	});

	cb( 2 ); 
};
