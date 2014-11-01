/*
- ether.terminal.js v0.1
- Terminal to Ethereum through Etherface
- http://ether.fund/tool/terminal
- (c) 2014 J.R. Bédard (jrbedard.com)
*/

var mode = 'socket'; // socket or rest
var ef = new Etherface({key:ETHERFACE_KEY, app:'terminal', mode:mode}); // Etherface


$(function() {
	$("#terminalLoader").hide();
	$('#terminal').terminal(function(cmd, term) {
		if(cmd == 'help') {
			term.echo("Ether.Fund Terminal Commands:");
			term.echo("-----------------------------");
			term.echo("block : Get current block number on the Ethereum blockchain.");
			term.echo("convert [] : ");
			term.echo("ether : ");
			term.echo("faucet [] : ");
			term.echo("-----------------------------");
			
		} else if(cmd == 'block') {
			ef.network('block', function(data) {
				term.echo("Current Block: "+data);
			});
			
		} else if(cmd == 'faucet') {
			
			
		} else {
			term.echo('unknown command');
		}
	},{
		name: 'Ethereum Terminal',
		greetings: "Ether.Fund terminal to Ethereum. Type 'help' for available commands.\n",
		prompt: 'Ξ ',
		history: true,
		clear: true,
		
		onInit: function(term) {
			term.pause();
			term.echo("Connecting to Etherface...", '');
			
			ef.connect({}, function() {
				term.echo("Connected to Ethereum!");
				term.resume();
			}, function() {
				term.echo("Disconnected from Etherface :(");
				term.pause();
			});
		},
		onCommandChange: function(cmd) {
			
		},
		onBlur: function() {
			return false;
		}
	});
});


