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

var token = process.env.SLACK_API_TOKEN || 'xoxb-198991807682-T7nzlYPduJpd0ufoXtbSTVqD'; //Your token here!

var rtm = new RtmClient(token, { 
  logLevel: 'debug',
  // Initialise a data store for our client, this will load additional helper functions for the storing and retrieval of data
  dataStore: new MemoryDataStore()
 });

var web = new WebClient(token);


let channel;

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
    if(message.text.toLowerCase().indexOf("hello") > -1)
    {
      rtm.sendMessage("Hello, " + rtm.dataStore.getUserById(message.user).real_name, message.channel);
    }
    if(message.text.toLowerCase().indexOf("info") > -1) // User requested info.  Give them the team name.
    {
      web.team.info(function teamInfoCallback(err, info) // Get team name using web API.
      {
        if(err) 
        {
          console.log('Error getting team info from webAPI:', err);
        }
        else
        {
          rtm.sendMessage("Team info: " + info.team.name, message.channel);
        }
      });
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
  rtm.sendMessage("Hello!", channel);
});

rtm.start();
