/*
- ether.terminal.js v0.1
- Ethereum Terminal through the Etherface server
- http://ether.fund/tool/terminal
- (c) 2014 J.R. Bédard (jrbedard.com)
*/

const COMMANDS = {
	'bitcoin':{type:"btc", help:"Current Bitcoin price.", icon:"bitcoin", args:{'s':{'n':'source','o':''}},
		ex:[],
		error:"", res:function(d){}},
	
	'block':{type:"eth", help:"Get information from the Ethereum blockchain.", icon:"cube", args:{},
		ex:[{a:'',c:'get latest block'},{a:'1',c:'get second block'}],
		error:""},
	
	'contracts':{type:"ef", help:"Get Contracts from our Repository", icon:"files-o", args:{},
		ex:[],
		error:""},
	
	'contract':{type:"ef", help:"Get Contract from our Repository", icon:"file-text-o", args:{},
		ex:[],
		error:""},	
		
	'faucet':{type:"eth", help:"Get current block number on the Ethereum blockchain.", icon:"tint", args:{}, 
		ex:[],
		error:""},
	
	'status':{type:"ef", help:"Status of etherface and ethereum.", icon:"circle", args:{},
		ex:[],
		error:""},
};


var mode = 'socket'; // socket or rest
var ef = new Etherface({key:ETHERFACE_KEY, app:'terminal', mode:mode}); // Etherface
var hashcmd = null; // from hash


$(function() {
	
	// CMDS TAB
	$.each(COMMANDS, function(key, value) {
		$("#commandList").append("<li><a class='cmd' href='#"+key+"'><span class='label label-default'>"+key+"</span></a></li>");
	});
	$("#commandList .cmd").click(function(e) {
		e.preventDefault();
		updateCommandTab($(this).text());
	});
	
	// CMD TAB
	var params = getHashParams(); // from hash
	if(params && params.cmd) {
		hashcmd = params.cmd;
		updateCommandTab(hashcmd);
	}
	
	// TERMINAL
	$("#terminalLoader").hide();
	$('#terminal').terminal(function(cmd, term) {
		
		cmd = cmd.toLowerCase();
		if(cmd=='help' || cmd=='cmds') {
			term.echo("Etherface Terminal Commands:");
			term.echo("-----------------------------");
			$.each(COMMANDS, function(key, value) {
				term.echo(key+" : "+ value.help);
			});
			term.echo("-----------------------------");
		
		} else if(cmd=='status') {
			ef.network('status', function(data) {
				term.echo("Etherface version 1.0");
				term.echo("Ethereum protocol: version "+data.protocolVersion);
				term.echo("Ethereum client: "+data.clientId);
			});
		
		} else if(cmd=='block') {
			ef.network('block', function(data) {
				term.echo("Latest Block: "+data);
			});
		
		} else if(cmd=='contracts' || cmd=='contract') {
			
		
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
				ef.network('status', function(status) {
					updateStatusTab(true, status);
					if(hashcmd) {
						term.exec(hashcmd); // harmful?
						hashcmd=null; // only once
					}
					term.resume();
				});
				
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


function commandResult(term, cmd, data) {
	
}



// Status Tab update
function updateStatusTab(connected, status) {
	var eStatus = $("#eStatus");
	if(connected) {
		$("#statusIcon").attr('style', "color:#5d5;");
		$("#statusText").text("Online");
		if(status) { // update Status Panel
			eStatus.find('#ef').text(status.j);
			eStatus.find('#ep').text(status.protocolVersion);
			eStatus.find('#ec').text(status.clientId);
			//eStatus.find('span').enable();
		}
		
	} else {
		$("#statusIcon").attr('style', "color:#d55;");
		$("#statusText").text("Offline");
		//eStatus.find('span').disable();
	}
}



// Command Tab update
function updateCommandTab(cmd) {
	cmd = cmd.toLowerCase();
	if(cmd in COMMANDS) {
		var com = COMMANDS[cmd];
		$("#commandHelp").html("<i class='fa fa-"+com.icon+"' style='margin-right:2px;'></i>"+cmd);
		
		var cmdEl = $("#commandTabContent #command");
		var cmdArgs = cmd;
		// todo: arguments
		cmdEl.html("<pre>"+cmdArgs+"</pre>"); // Cmd name + arguments
		cmdEl.append("<p>"+com.help+"</p>"); // Cmd Description
		
		// Cmd Examples
		if(com.ex && com.ex.length > 0) {
			var examples='';
			for(var i=0; i<com.ex.length; i++) {
				examples += cmd + " ";
				if(com.ex[i].a) { examples += com.ex[i].a + " "; }
				examples += "<span style='color:#6c6;'>"+com.ex[i].c+"</span><br>";
			}
			cmdEl.append("<p><b style='padding-bottom:0px'>Examples:</b><pre>"+examples+"</pre></p>");
		}
		
		// share links
		cmdEl.append("<div style='text-align:right;'><a class='shareLink' href='/tool/terminal#cmd="+cmd+"'><i class='fa fa-fw fa-link'></i>share command</a></div>");
		cmdEl.append("<div style='text-align:right;'><a class='shareLink' href='/tool/terminal#cmd="+cmd+"'><i class='fa fa-fw fa-terminal'></i>share input</a></div>");
		
		// Select TAB
		if(cmd=='status') {
			$("#commandTabs a:first").tab('show'); // status tab
		} else if(cmd=='help' || cmd=='cmds') {
			$("#commandTabs a:eq(1)").tab('show'); // cmds tab
		} else {
			$("#commandTabs a:last").tab('show'); // cmd tab
		}
	}
}



