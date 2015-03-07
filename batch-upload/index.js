var nconfig = require('./config.js');
var mwproc = require('./mw.js');
var couchproc = require('./couch.js');

var config = nconfig.get("config");

// TODO: Clean DB, purge
// TODO: Create indexes from config.json
// TODO: Search command


var args = process.argv.slice(2);

var process = "upload-batch";

if ( args[0] ) {
	process = args[0];
}

switch ( process ) {

	case "update-batch":
		mwproc.getSMWBlastDBcmd( config, function( cb ) {
		
			couchproc.updateBatch( config, cb, function( cb2 ) {
				console.log( cb2 );
			});
			
		});
		break;
	
	case "delete-all":
		couchproc.deleteDocs( config, null, null, null, function( cb ) {
			
			console.log( cb );
		});
	

	default:	
		mwproc.getSMWBlastDBcmd( config, function( cb ) {
	
			couchproc.insertBatch( config, cb, function( cb2 ) {
				console.log( cb2 );
			});
			
		});
	
}





