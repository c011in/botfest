/**
 * Example for creating and working with the Slack RTM API.
 */

/* eslint no-console:0 */

var RtmClient = require('@slack/client').RtmClient;
var WebClient = require('@slack/client').WebClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
// The memory data store is a collection of useful functions we can include in our RtmClient
var MemoryDataStore = require('@slack/client').MemoryDataStore;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

var token = process.env.SLACK_API_TOKEN || ''; //Your token here!

var rtm = new RtmClient(token, { 
  logLevel: 'debug',
  // Initialise a data store for our client, this will load additional helper functions for the storing and retrieval of data
  dataStore: new MemoryDataStore()
 });

var web = new WebClient(token);


let channel;
let gameboard = {};
const possibleRoutes = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
var playFunc;


// Tic Tac Toe logic
function printBoard( user, channel ) {
  let board = gameboard;
  var boardString = "";
      for( let y = 0; y < 3; ++y ) {
        let row = ""
        for( let x = 0; x < 3; ++x ) {
          row += board[ y * 3 + x ] + "|";
        }
        boardString += row + "\n";
      }
      rtm.sendMessage(boardString, channel );
}

function hasWinrar( symbol, gameboard )
{
	for( route of possibleRoutes )
  {
  	if( isWinOnRoute( symbol, route, gameboard ) )
    {
    	return true;
    }
  }
  return false;
}

function isWinOnRoute( symbol, indices, gameboard )
{
	return gameboard[indices[1]] == symbol && gameboard[indices[2]] == symbol && gameboard[indices[0]] == symbol;
}

//Collin
function randomBot( symbol, gameboard )
{
	var openSpaces = [];
	for( index in gameboard )
  {
  	if( gameboard[index] == '_')
    {
    	openSpaces.push(index);
    }
  }
  var chosenSpace = openSpaces[Math.floor(Math.random() * openSpaces.length)];
  
  gameboard[chosenSpace] = symbol;
}

//Jeff
function jeffWoffordBot( symbol, gameboard ) {

    const otherSymbol = symbol == 'X' ? 'O' : 'X';

    function findShallowWin() {
      for( let i = 0; i < 9; ++i ) {
        let board = [].concat( gameboard );
      if( board[ i ] != '_' ) {
          continue;
      }
      board[ i ] = symbol;
      if( hasWinrar( symbol, board ))
      {
          return i;
      }
    }
    return -1;
  }
  
  function findShallowLoss() {
      for( let i = 0; i < 9; ++i ) {
        let board = [].concat( gameboard );
      if( board[ i ] != '_' ) {
          continue;
      }
      board[ i ] = otherSymbol;
      if( hasWinrar( otherSymbol, board ))
      {
          return i;
      }
    }
    return -1;
  }

    function calculateHalfTurnCount( gameboard ) {
      let count = 0;
    for( cell of gameboard ) {
        if( cell != '_' ) {
          ++count;
      }
    }
    return count;
  }

    const halfTurnCount = calculateHalfTurnCount( gameboard )
  const turnCount = Math.floor( halfTurnCount / 2 )
    
  // First move go center.
  let cellToPlay = -1;
  if( halfTurnCount == 0 ) {
      cellToPlay = 4;
  }
  
  // Other guy took center?
  else if( halfTurnCount == 1 && gameboard[ 4 ] == otherSymbol ) {
      // Take a corner.
      cellToPlay = 0;
  }
  
  else {
      // Easy way to win?
      cellToPlay = findShallowWin();
    if( cellToPlay < 0 ) {
    
        // Easy way to prevent a loss?
      cellToPlay = findShallowLoss();
      
      if( cellToPlay < 0 ) {    
        // Just pick the first empty cell.
        let options = [];
        for( let i = 0; i < 9; ++i ) {
          if( gameboard[ i ] == '_' ) {
            options.push( i );
          }
        }
        
        cellToPlay = options[ Math.floor( Math.random() * options.length )];
      }
    }
  }
  
  console.assert( cellToPlay >= 0 );
  console.assert( gameboard[ cellToPlay ] == '_' );
  gameboard[ cellToPlay ] = symbol;
}



// RTM callbacks

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  for (const c of rtmStartData.channels) {
	  if (c.is_member && c.name ==='bot-funhouse') { channel = c.id }
  }
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
});

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
  console.log('Message:', message);
  if(message.text.indexOf(rtm.activeUserId) > -1) //We've been tagged in a message.
  {
    if(message.text.toLowerCase().indexOf("begin") > -1)
    {
      var code = message.text.toLowerCase().split(" ")[2];
      var append = "";
      if( code == "j" )
      {
        playFunc = jeffWoffordBot;
        append = "hard ";
      }
      else 
      {
        playFunc = randomBot;
      }
      rtm.sendMessage("Beginning new " + append + "game with " + rtm.dataStore.getUserById(message.user).real_name + "!", message.channel);
      gameboard = ['_', '_', '_',
								   '_', '_', '_',
                   '_', '_', '_']; //Initialize the playing field.
      

      printBoard(gameboard, message.channel)
      rtm.sendMessage("I go first!", message.channel);
      playFunc('X', gameboard);
      printBoard(gameboard, message.channel);
      rtm.sendMessage("Your turn");

    }
    if(message.text.toLowerCase().indexOf("place") > -1)
    {
      console.log("Found place...*********************************************************************************************************************");
      var place = message.text.split(" ")[2];
      place = parseInt(place);
      gameboard[place] = 'O'
      if(hasWinrar('O', gameboard))
      {
        rtm.sendMessage("You win!", message.channel);
      }
      else
      {
        playFunc('X', gameboard);
        if(hasWinrar('X', gameboard))
        {
        rtm.sendMessage("collinbot wins!!", message.channel);
        }
      }
      printBoard(gameboard, message.channel);
    }

  }
});

rtm.on(RTM_EVENTS.REACTION_ADDED, function handleRtmReactionAdded(reaction) {
  console.log('Reaction added:', reaction);
 
});

rtm.on(RTM_EVENTS.TEAM_JOIN, function handleRtmTeamJoin(member) {
  console.log('Member joined the team:', member);
  rtm.sendMessage("Welcome, " + member.user.profile.real_name, channel);
});


// you need to wait for the client to fully connect before you can send messages
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
});

rtm.start();
