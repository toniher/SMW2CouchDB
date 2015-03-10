var nconfig = require('./config.js');
var mwproc = require('./mw.js');
var couchproc = require('./couch.js');

var config = nconfig.get("config");

// TODO: Clean DB, purge
// TODO: Create indexes from config.json
// TODO: Search command

var args = process.argv.slice(2);

var method = "upload-batch";

if ( args[0] ) {
	method = args[0];
}

switch ( method ) {

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
		break;

	case "add-indexes":
		couchproc.addIndexes( config, function( cb ) {
			console.log( cb );
		});
		break;

	default:
		mwproc.getSMWBlastDBcmd( config, function( cb ) {
	
			couchproc.insertBatch( config, cb, function( cb2 ) {
				console.log( cb2 );
			});
			
		});
	
}





