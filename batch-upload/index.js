var nconfig = require('./config.js');
var mwproc = require('./mw.js');
var couchproc = require('./couch.js');

var config = nconfig.get("config");

// TODO: Command line
// TODO: Clean DB, purge
// TODO: Create indexes from config.json

//mwproc.getSMWBlastDBcmd( config, function( cb ) {
//
//	couchproc.insertBatch( config, cb, function( cb2 ) {
//		console.log( cb2 );
//	});
//	
//});


mwproc.getSMWBlastDBcmd( config, function( cb ) {

	couchproc.updateBatch( config, cb, function( cb2 ) {
		console.log( cb2 );
	});
	
});
