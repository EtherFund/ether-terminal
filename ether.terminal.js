/*
- ether.terminal.js v0.1
- Terminal to Ethereum through Etherface
- http://ether.fund/tool/terminal
- (c) 2014 J.R. Bédard (jrbedard.com)
*/

const COMMANDS = {
	'bitcoin':{type:"", help:"Current Bitcoin price.", icon:"bitcoin", args:{'s':{'n':'source','o':''}},
		ex:[],
		error:""},
	
	'block':{type:"", help:"Get current block number on the Ethereum blockchain.", icon:"cube", args:{},
		ex:[{a:'',c:'get latest block'},{a:'1',c:'get second block'}],
		error:""},
	
	'faucet':{type:"", help:"Get current block number on the Ethereum blockchain.", icon:"tint", args:{}, 
		ex:[],
		error:""},
	
	'status':{type:"", help:"Status of etherface and ethereum.", icon:"circle", args:{},
		ex:[],
		error:""},
};


var mode = 'socket'; // socket or rest
var ef = new Etherface({key:ETHERFACE_KEY, app:'terminal', mode:mode}); // Etherface


$(function() {
	
	// CMDS PANEL
	$.each(COMMANDS, function(key, value) {
		$("#commandList").append("<li><a class='cmd' href='#"+key+"'><span class='label label-default'>"+key+"</span></a></li>");
	});
	$("#commandList .cmd").click(function(e) {
		e.preventDefault();
		updateCommandTab($(this).text());
	});
	
	
	// TERMINAL
	$("#terminalLoader").hide();
	$('#terminal').terminal(function(cmd, term) {
		
		cmd = cmd.toLowerCase();
		if(cmd=='help' || cmd=='cmds') {
			term.echo("Ether.Fund Terminal Commands:");
			term.echo("-----------------------------");
			$.each(COMMANDS, function(key, value) {
				term.echo(key+" : "+ value.help);
			});
			term.echo("-----------------------------");
			$("#commandTabs a:eq(1)").tab('show');
		
		} else if(cmd=='status') {
			$("#commandTabs a:first").tab('show');
		
		
		} else if(cmd=='block') {
			ef.network('block', function(data) {
				term.echo("Current Block: "+data);
			});
			
		} else if(cmd=='faucet') {
			
			
		} else if(cmd=='bitcoin' || cmd=='btc') {
			ef.network('bitcoin', function(data) {
				term.echo("Current BTC price: "+data);
			});
			
		} else {
			term.echo('unknown command');
		}
		
		updateCommandTab(cmd);
		
	},{
		name: 'Ethereum Terminal',
		greetings: "Ethereum Terminal by Ether.Fund. Type 'help' for available commands.\n",
		prompt: 'Ξ ',
		history: true,
		clear: true,
		
		onInit: function(term) {
			term.pause();
			term.echo("Connecting to Etherface...", '');
			
			ef.connect({}, function() {
				term.echo("Connected to Ethereum!");
				term.resume();
				updateStatusTab(true);
				//term.exec('block');
				
			}, function() {
				term.echo("Disconnected from Etherface :(");
				term.pause();
				updateStatusTab(false);
				
			}, function() {
				term.echo("Connection failed: ");
				term.pause();
				updateStatusTab(false);
			});
		},
		onCommandChange: function(cmd) {
			
		},
		onBlur: function() {
			return false;
		}
	});
	
});



// Status Tab update
function updateStatusTab(connected) {
	if(connected) {
		$("#statusIcon").attr('style', "color:#5d5;");
		$("#statusText").text("Online");
	} else {
		$("#statusIcon").attr('style', "color:#d55;");
		$("#statusText").text("Offline");
	}
	
	// updateStatusPanel
}



// Command Tab update
function updateCommandTab(cmd) {
	cmd = cmd.toLowerCase();
	if(cmd in COMMANDS) {
		var com = COMMANDS[cmd];
		$("#commandHelp").html("<i class='fa fa-"+com.icon+"' style='margin-right:2px;'></i>"+cmd);
		
		var cmdEl = $("#commandTabContent #command");
		cmdEl.html("<pre>"+cmd+" "+"</pre>");
		cmdEl.append("<p>"+com.help+"</p>"); // Description
		
		// Examples
		if(com.ex && com.ex.length > 0) {
			var examples='';
			for(var i=0; i<com.ex.length; i++) {
				examples += cmd + " ";
				if(com.ex[i].a) { examples += com.ex[i].a + " "; }
				examples += "<span style='color:#6c6;'>"+com.ex[i].c+"</span><br>";
			}
			cmdEl.append("<p><b style='padding-bottom:0px'>Examples:</b><pre>"+examples+"</pre></p>");
		}
		
		// Select CMD tab
		if(cmd != 'status') {
			$("#commandTabs a:last").tab('show');
		}
	}
}



