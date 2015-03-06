var nconfig = require('./config.js');
var mwproc = require('./mw.js');
var couchproc = require('./couch.js');

var config = nconfig.get("config");

mwproc.getSMWBlastDBcmd( config, function( cb ) {

	couchproc.insertBatch( config, cb, function( cb2 ) {
		console.log( cb2 );
	});
	
});
