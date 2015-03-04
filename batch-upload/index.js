var nconfig = require('./config.js');
var process = require('./process.js');

var config = nconfig.get("config");

process.getSMWBlastDBcmd( config, function( cb ) {

	console.log( typeof cb );
	console.log( cb );
	return true;
	
});
