var RtmClient = require('@slack/client').RtmClient;
var WebClient = require('@slack/client').WebClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
// The memory data store is a collection of useful functions we can include in our RtmClient
var MemoryDataStore = require('@slack/client').MemoryDataStore;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

var querystring = require("querystring")

var token = process.env.SLACK_API_TOKEN || 'TOKEN'; //Your token here!

var rtm = new RtmClient(token, {
  logLevel: 'debug',
  // Initialise a data store for our client, this will load additional helper functions for the storing and retrieval of data
  dataStore: new MemoryDataStore()
 });

var web = new WebClient(token);


let channel;
// const snarkResponses = [
//   `@${rtm.dataStore.getUserById(message.user).name} Why don't you just use Google? ${url}`,
//   `@${rtm.dataStore.getUserById(message.user).name} Google has a large database of results you could use! ${url}`,
//   `@${rtm.dataStore.getUserById(message.user).name} It is 2017! Don't you know how to use Google? ${url}`,
//   `@${rtm.dataStore.getUserById(message.user).name} Just got to make me do all the hard work for you don't you? ${url}`,
// ]

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  for (const c of rtmStartData.channels) {
	  if (c.is_member && c.name ==='bot-funhouse') { channel = c.id }
  }
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
});

const questionTriggers = ["what", "where", "who", "how", "why", "whom", "when", "?"]

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {

  let text = message.text;
  if (rtm.dataStore.getUserById(message.user) !== undefined && rtm.dataStore.getUserById(message.user).name !== "justinbot") {
    for (let trigger of questionTriggers)
    {
      if(text != null && text.toLowerCase().indexOf(trigger) != -1)
      {
        let urlSafe = querystring.stringify({q: text})
        let url = `http://lmgtfy.com/?${urlSafe}`
        const snarkResponses = [
          `<@${rtm.dataStore.getUserById(message.user).name}> Why don't you just use Google? ${url}`,
          `<@${rtm.dataStore.getUserById(message.user).name}> Google has a large database of results you could use! ${url}`,
          `<@${rtm.dataStore.getUserById(message.user).name}> It is 2017! Don't you know how to use Google? ${url}`,
          `<@${rtm.dataStore.getUserById(message.user).name}> Just got to make me do all the hard work for you don't you? ${url}`,
        ]
        let responseMessage = snarkResponses[Math.floor(Math.random() * snarkResponses.length)]
        rtm.sendMessage(responseMessage, message.channel)
        break
      }
    }
  }
});

rtm.on(RTM_EVENTS.REACTION_ADDED, function handleRtmReactionAdded(reaction) {
  console.log('Reaction added:', reaction);
});

rtm.on(RTM_EVENTS.TEAM_JOIN, function handleRtmTeamJoin(member) {
  console.log('Member joined the team:', member);
  // rtm.sendMessage("Welcome, " + member.user.profile.real_name, channel);
});


// you need to wait for the client to fully connect before you can send messages
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
  //rtm.sendMessage("Hello!", channel);
});

rtm.start();
