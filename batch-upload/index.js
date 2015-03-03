var nconfig = require('./config.js');
var process = require('./process.js');

var config = nconfig.get("");

process.getSMWBlastDBcmd( config, function( cb ) {

	console.log( cb );
	return true;
	
});
