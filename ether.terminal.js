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
				ef.send('status', {}, function(status) {
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
	
	// update cmd tab
	updateCommandTab(cmd);
	
	 // HELP
	if(cmd=='help') {
		term.echo("Etherface Terminal Commands:");
		term.echo("-----------------------------");
		$.each(COMMANDS, function(key, value) {
			term.echo(tt(key,'cmd')+" : "+ value.desc, {raw:true});
		});
		term.echo("-----------------------------");
		think(term, false);


	// STATUS
	} else if(cmd=='status') {
		ef.send('status', {}, function(data) {
			term.echo("Etherface version 1.0");
			term.echo("Ethereum protocol: version "+data.protocolVersion);
			term.echo("Ethereum client: "+data.clientId);
			term.echo("Connected on: "+data.time);
			think(term, false);
		});

	
	// BLOCK
	} else if(cmd=='block') {
		ef.send('block', {}, function(data) {
			term.echo("Latest Block: "+data);
			think(term, false);
		});


	// CONTRACTS
	} else if(cmd=='contract') {
		if(args.length<1) { usageEcho(term, cmd); return; }
		
		ef.send('contract', {id:"967a1"}, function(sc) {
			term.echo("Contract: "+sc.name);
			term.echo("Language: "+sc.language);
			term.echo("Privacy: "+sc.privacy);
			term.echo("Code: ");
			term.echo(sc.code);
			think(term, false);
		});
	
	
	// TRANSACTION
	
	
	// MESSAGE
	} else if(cmd=='message') {
		if(args.length<1) { usageEcho(term, cmd); }
		var on = (args[0]=='on') ? true : false;
		term.echo("Listen to Ethereum messages: <span style='color:#1f1;'>"+on+"</span>", {raw:true});
		think(term, false);
	
	
	// WHISPER
	
	
	// FAUCET
	} else if(cmd=='faucet') {
		if(args.length<1) { usageEcho(term, cmd); }
		term.echo('Coming soon!')
		think(term, false);
	
	
	// BITCOIN
	} else if(cmd=='bitcoin') {
		var val = (args.length>0 && !isNaN(args[0])) ? new BigNumber(args[0]) : new BigNumber(1);
		ef.send('bitcoin', {}, function(btc) {
			term.echo(numS(val)+" BTC = "+numS(val.times(btc.to_usd))+" USD$ = "+numS(val.times(btc.to_eth))+" ETH", {raw:true});
			think(term, false);
		});
	
	// ETHER
	} else if(cmd=='ether') {
		var val = (args.length>0 && !isNaN(args[0])) ? new BigNumber(args[0]) : new BigNumber(1);
		ef.send('ether', {}, function(eth) {
			term.echo(numS(val)+" ETH = "+numS(val.times(eth.to_btc))+" BTC = "+numS(val.times(eth.to_usd))+" USD$", {raw:true});
			think(term, false);
		});
	
	// CURRENCY
	} else if(cmd=='currency') {
		var sym = (args.length>0) ? args[0] : "USD";
		var val = (args.length>1 && !isNaN(args[1])) ? new BigNumber(args[1]) : new BigNumber(1);
		ef.send('currency', {cur:sym}, function(cur) {
			if(cur.to_btc) {
				term.echo(cur.name);
				var line = numS(val)+" "+sym.toUpperCase();
				if(sym == "USD") { line += '$'; } else { line += " = "+numS(val.times(cur.to_usd))+" USD$"; }
				term.echo(line+" = "+numS(val.times(cur.to_btc))+" BTC = "+numS(val.times(cur.to_eth))+" ETH", {raw:true});
			} else {
				term.echo("invalid currency");
			}
			think(term, false);
		});
		
		
	// UNKNOWN
	} else {
		term.echo('unknown command'); // shouldn't get here.
		think(term, false);
	}

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
		cmdEl.html("<pre>"+usageString(cmd,false)+"</pre>"); // Cmd name + arguments
		cmdEl.append("<p>"+com.desc+"</p>"); // Cmd Description
		
		// Cmd Alias
		var aliases=[];
		var alias=null //first alias
		$.each(COMMANDS_ALIAS, function(key,value) {
  			if(value==cmd) { aliases.push(key); }
		});
		if(aliases.length > 0) {
			var acmds = "";
			alias = aliases[0]; // first alias
			for(var i=0; i<aliases.length; i++) {
				acmds+="<kbd>"+aliases[i]+"</kbd>";
			}
			cmdEl.append("<span><b>Alias:</b> "+acmds+"</span>");
		}
		
		
		// Cmd Examples
		if(com.ex && com.ex.length > 0) {
			var examples='';
			for(var i=0; i<com.ex.length; i++) {
				if(alias) { examples += alias+" "; } else { examples += cmd+" "; }
				if(com.ex[i].a) { examples += com.ex[i].a + " "; }
				examples += "<span style='color:#6c6;'>("+com.ex[i].c+")</span><br>";
			}
			cmdEl.append("<b> Examples:</b><div style='margin-top:5px'><pre>"+examples+"</pre></div>");
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





const TT = { // terminal theme
	'cmd':"88f",
	'on':"",
	'off':"",
	'arg':'',
	'num':'f88',
	'msg':'',
};
function tt(text,c) {
	return "<span style='color:#"+TT[c]+"'>"+text+"</span>";
}

// usage string : CMD + ARGS
function usageString(cmd, style) {
	var com = COMMANDS[cmd];
	var usage = cmd;
	if(style) { usage = tt(cmd,'cmd'); }
	usage+=" ";
	$.each(com.args, function(i,arg) {
		usage += "["+arg.n+"] ";
	});
	return usage;
}
function usageEcho(term, cmd) {
	term.echo("Usage: "+usageString(cmd,true), {raw:true}); think(term, false); return;
}
function numS(num) {
	return "<span style='color:#"+TT.num+"'>"+num+"</span>";
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





