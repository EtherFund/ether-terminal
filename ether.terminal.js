/*
- ether.terminal.js v0.1
- Ethereum Terminal through the Etherface server
- http://ether.fund/tool/terminal
- (c) 2014 J.R. Bédard (jrbedard.com)
*/


var mode = 'socket'; // socket or rest
var ef = new Etherface({key:ETHERFACE_KEY, app:'terminal', mode:mode}); // Etherface
var hashcmd = null; // from hash
var intId = null;



$(function() {
	
	// CMDS TAB
	updateCommandsTab();
	
	// CMD from hash
	var params = getHashParams(); // from hash
	if(params && params.cmd) {
		hashcmd = params.cmd;
		updateCommandTab(hashcmd);
	}
	
	// TERMINAL
	$("#terminalLoader").hide();
	$('#terminal').terminal(function(cmd, term) {
		
		processCommand(cmd, term); // PROCESS COMMAND
		
	},{
		name: 'Ethereum Terminal',
		greetings: "Ethereum Terminal by Ether.Fund. Type 'help' for available commands.\n",
		prompt: 'Ξ ',
		history: true,
		clear: true,
		exit: true,
		processArguments:true,
		
		onInit: function(term) {
			term.echo("Connecting to Etherface...");
			think(term, true);
			
			ef.connect({}, function() {
				term.echo("Connected to Ethereum!");
				ef.send('status', function(status) {
					updateStatusTab(true, status);
					if(hashcmd) {
						term.exec(hashcmd); // harmful?
						hashcmd=null; // only once
					}
					think(term, false);
				});
				
			}, function() {
				term.error("Disconnected from Etherface :(");
				updateStatusTab(false);
				think(term, true);
				
			}, function() {
				term.error("Connection failed: ");
				updateStatusTab(false);
				think(term, true);
			});
		},
		completion: function(term, string, fn) { // tab completion
			var cmds = $.map(COMMANDS, function(element,index) {return index}); // array of cmds
			cmds = $.merge(cmds, $.map(COMMANDS_ALIAS, function(element,index) {return index})).sort().reverse(); // concat array of aliases
			return fn(cmds);
		},
		onCommandChange: function(cmd) {
		},
		onBlur: function() {
			return false;
		}
	});
	
});



// Process Command
function processCommand(command, term) {
	var pcmd = $.terminal.parseCommand(command);
	//console.log(pcmd);
	var cmd = pcmd.name.toLowerCase(); // only command string
	var args = pcmd.args; // arguments array
	var rest = pcmd.rest; // arguments as string
	
	
	if(cmd in COMMANDS_ALIAS) { // aliases lookup here
		cmd = COMMANDS_ALIAS[cmd];
	}
	var com = null;
	if(cmd in COMMANDS) {
		com = COMMANDS[cmd];
	} else {
		term.echo('unknown command');
		return;
	}
	think(term, true); // thinking..................


	 // HELP
	if(cmd=='help') {
		term.echo("Etherface Terminal Commands:");
		term.echo("-----------------------------");
		$.each(COMMANDS, function(key, value) {
			term.echo(key+" : "+ value.help);
		});
		term.echo("-----------------------------");
		think(term, false);


	// STATUS
	} else if(cmd=='status') {
		ef.send('status', function(data) {
			term.echo("Etherface version 1.0");
			term.echo("Ethereum protocol: version "+data.protocolVersion);
			term.echo("Ethereum client: "+data.clientId);
			term.echo("Connected on: "+data.time);
			think(term, false);
		});

	
	// BLOCK
	} else if(cmd=='block') {
		ef.send('block', function(data) {
			term.echo("Latest Block: "+data);
			think(term, false);
		});


	// CONTRACTS
	} else if(cmd=='contracts' || cmd=='contract') {
		think(term, false);

	
	// FAUCET
	} else if(cmd=='faucet') {
		if(args.length<1) { term.echo("Usage: "+usageString(cmd)); }
		think(term, false);
	
	
	// BITCOIN
	} else if(cmd=='bitcoin') {
		// todo: args
		
		ef.send('bitcoin', function(data) {
			term.echo("Current BTC price: "+data);
			think(term, false);
		});
	
	
	// UNKNOWN
	} else {
		term.echo('unknown command'); // shouldn't get here.
		think(term, false);
	}

	// update cmd tab
	updateCommandTab(cmd);
}




//   T A B S 

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
			eStatus.find('#t').attr('title', status.time);
			//eStatus.find('span').enable();
		}
		
	} else {
		$("#statusIcon").attr('style', "color:#d55;");
		$("#statusText").text("Offline");
		//eStatus.find('span').disable();
	}
}


// Commands tab
function updateCommandsTab() {
	$.each(COMMANDS, function(key, value) {
		$("#commandList").append("<li><a class='cmd' href='#"+key+"'><span class='label label-default'>"+key+"</span></a></li>");
	});
	$("#commandList .cmd").click(function(e) {
		e.preventDefault();
		updateCommandTab($(this).text());
	});
}



// Command Tab update
function updateCommandTab(cmd) {
	cmd = cmd.toLowerCase();
	if(cmd in COMMANDS) {
		var com = COMMANDS[cmd];
		$("#commandHelp").html("<i class='fa fa-"+com.icon+"' style='margin-right:2px;'></i>"+cmd);
		
		var cmdEl = $("#commandTabContent #command");
		cmdEl.html("<pre>"+usageString(cmd)+"</pre>"); // Cmd name + arguments
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
		
		// Cmd Aliases
		var aliases=[];
		$.each(COMMANDS_ALIAS, function(key,value) {
  			if(value==cmd) { aliases.push(key); }
		});
		if(aliases.length > 0) {
			var acmds = "";
			for(var i=0; i<aliases.length; i++) {
				acmds+="<span class='label label-default'>"+aliases[i]+"</span>";
			}
			cmdEl.append("<p><b>Alias:</b> "+acmds+"</p>");
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


// usage string : CMD + ARGS
function usageString(cmd) {
	var com = COMMANDS[cmd];
	var usage = cmd+" ";
	$.each(com.args, function(arg, val) {
		usage += "-"+arg+" "+val.n;
	});
	return usage;
}



// terminal thinking...
function think(term, on) {
	if(on) { 
		term.pause();
		
		//$('.terminal-output').append(" ");
		//intId = setInterval(function() {
		//	$('.terminal-output').append(".");
		//}, 100);
		
	} else {
		clearInterval(intId);
		term.resume();
	}
}


function commandResult(term, cmd, data) {
	
}





