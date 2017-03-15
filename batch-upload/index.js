
var mwproc = require('./mw.js');
var couchproc = require('./couch.js');

// TODO: Clean DB, purge
// TODO: Search command

var args = process.argv.slice(2);

var method = "print-batch";

if ( args[0] ) {
	method = args[0];
}

// Let's allow to pass arguments as well
var nconfig = require('./config.js')(args[1]);
var config = nconfig.get("config");
// console.log( config );

switch ( method ) {

	case "import-batch":
		mwproc.getSMWBlastDBcmd( config, couchproc.insertBatch, function( cb ) {
			console.log(cb);
		});
		break;
		
	case "update-batch":
		mwproc.getSMWBlastDBcmd( config, couchproc.updateBatch, function( cb ) {
			console.log( cb );
		});
		break;

	case "print-batch":
		mwproc.getSMWBlastDBcmd( config, couchproc.printBatch, function( cb ) {
			console.log(cb);
		});
		break;

        case "print-csv":
                mwproc.getSMWBlastDBcmd( config, couchproc.printCSV, function( cb ) {
                        console.log(cb);
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

	// Act on recent changes
	case "recent-changes":
		mwproc.getRecentChanges( config, function( cb ) {
			console.log( cb );
		});
		break;

	default:
		console.log( "Method non available");
}


