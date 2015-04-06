var nconfig = require('./config.js');
var mwproc = require('./mw.js');
var couchproc = require('./couch.js');

var config = nconfig.get("config");

// TODO: Flexible config file
// TODO: Clean DB, purge
// TODO: Search command

var args = process.argv.slice(2);

var method = "import-batch";

if ( args[0] ) {
	method = args[0];
}

switch ( method ) {

	case "update-batch":
		mwproc.getSMWBlastDBcmd( config, couchproc.updateBatch, function( cb ) {
			console.log( cb );
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
		mwproc.getSMWBlastDBcmd( config, couchproc.insertBatch, function( cb ) {
			console.log(cb);
		});
	
}





