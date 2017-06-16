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

var token = process.env.SLACK_API_TOKEN || "BOT TOKEN"; //Your token here!


class Tile {
  constructor(description) {
    this.description = description;
    this.loot = [];
  }
}

class Item {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.actions = [];
    this.actions['use'] = (args) => {
      rtm.sendMessage('What do you expect me to do with this?', args.message.channel);
    };
  }
}

class Sword extends Item {
  constructor() {
    super('sword', 'A sturdy sword.');
    this.actions['swing'] = (args) => {
      rtm.sendMessage('You wildly swing your sword at nothing. Nearby birds look embarassed for you.', args.message.channel);
    };
  }
}

class Lamp extends Item {
  constructor() {
    super('lamp', 'A lamp.');
    this.actions['use'] = (args) => {
      rtm.sendMessage('You light up the lamp. It is daytime, so you are wasting fuel.', args.message.channel);
    };
  }
}

class Sandwich extends Item {
  constructor() {
    super('sandwich', 'A moldy sandwich.');
    this.actions['eat'] = (args) => {
      rtm.sendMessage('I will not let you eat that sandwich. What are you thinking?!', args.message.channel);
    };

    this.actions['eatplease'] = (args) => {
      rtm.sendMessage('Sigh, alright... you eat that sandwich and are now poisoned.', args.message.channel);
      args.inventory.splice(args.itemindex, 1);
    };
  }
}

class Gopher extends Item {
  constructor() {
    super('gopher', 'A :golang:');
    this.actions['use'] = (args) => {
      rtm.sendMessage('Your code is now very clean and type-safe!', args.message.channel);
    };
  }
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class GrassTile extends Tile {
  constructor() {
    super('A grassy knoll');
    this.loot = [
      new Gopher()
    ];
  }
}

class DesertTile extends Tile {
  constructor() {
    super('A harsh desert.');
    this.loot = [
      new Sandwich()
    ];
  }
}

class ForestTile extends Tile {
  constructor() {
    super('A temperate forest.');
  }
}

class HouseTile extends Tile {
  constructor() {
    super('A spooky old house.');
    this.loot = [
      new Sword(),
      new Lamp()
    ];
  }
}

let world = [
  [new DesertTile(), new ForestTile(), new GrassTile()],
  [new DesertTile(), new HouseTile(), new ForestTile()],
  [new GrassTile(), new ForestTile(), new GrassTile()],
];

let position = new Point(0, 0);
let inventory = [];

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
  if (message.text == undefined) return;
  tokens = message.text.split(' ')

  if(tokens[0].includes(rtm.activeUserId)) {
    let printDesc = false;
    let printCantMove = false;
    if(tokens[1].startsWith('reset')) {
      position.x = 0;
      position.y = 0;
      printDesc = true;
      rtm.sendMessage('Welcome to :alexbot: ! Your adventure begins now!', message.channel);
    }

    if(tokens[1] == ('n')) {
      if(position.y < world.length - 1) {
        position.y++;
        printDesc = true;
      } else {
        printCantMove = true;
      }
    }

    if(tokens[1] == ('s')) {
      if(position.y > 0) {
        position.y--;
        printDesc = true;
      } else {
        printCantMove = true;
      }
    }

    if(tokens[1] == ('e')) {
      if(position.x < world[0].length - 1) {
        position.x++;
        printDesc = true;
      } else {
        printCantMove = true;
      }
    }

    if(tokens[1] == ('w')) {
      if(position.x > 0) {
        position.x--;
        printDesc = true;
      } else {
        printCantMove = true;
      }
    }

    if(tokens[1] == ('ln')) {
      if(position.y < world.length - 2) {
        rtm.sendMessage(`To the north is: ${world[position.y + 1][position.x].description}`, message.channel);
      } else {
        rtm.sendMessage('The endless void extends North.', message.channel);
      }
    }

    if(tokens[1] == ('ls')) {
      if(position.y > 1) {
        rtm.sendMessage(`To the south is: ${world[position.y - 1][position.x].description}`, message.channel);
      } else {
        rtm.sendMessage('The endless void extends South.', message.channel);
      }
    }

    if(tokens[1] == ('le')) {
      if(position.x < world[0].length - 2) {
        rtm.sendMessage(`To the east is: ${world[position.y][position.x + 1].description}`, message.channel);
      } else {
        rtm.sendMessage('The endless void extends East.', message.channel);
      }
    }

    if(tokens[1] == ('lw')) {
      if(position.x > 1) {
        rtm.sendMessage(`To the west is: ${world[position.y][position.x - 1].description}`, message.channel);
      } else {
        rtm.sendMessage('The endless void extends West.', message.channel);
      }
    }

    if(tokens[1] == ('search')) {
      let items = world[position.y][position.x].loot;
      if (items.length == 0) {
        rtm.sendMessage("There is no loot here.", message.channel);
      } else {
        rtm.sendMessage("You find:", message.channel);
        items.forEach(item => {
          rtm.sendMessage(item.description, message.channel);
        });
      }
    }

    if(tokens[1] == ('inventory')) {
      if (inventory.length == 0) {
        rtm.sendMessage("Your backpack is empty.", message.channel);
      } else {
        rtm.sendMessage("You have:", message.channel);
        inventory.forEach(item => {
          rtm.sendMessage(item.description, message.channel);
        });
      }
    }

    if(tokens[1] == ('get') && tokens.length >= 3) {
      let items = world[position.y][position.x].loot
      let itemName = tokens[2];
      let index = 0;
      let found = false;
      for(; index < items.length; index++) {
        if(items[index].name == itemName) {
          found = true;
          break;
        }
      }

      if(found) {
        let item = items[index];
        world[position.y][position.x].loot.splice(index, 1);
        inventory.push(item);
        rtm.sendMessage(`You pick up the ${itemName}.`, message.channel);
      } else {
        rtm.sendMessage(`There is no ${itemName} here.`, message.channel);
      }
    }

    if(tokens[1] != 'get' && tokens.length >= 3) {
      let itemName = tokens[2];
      let index = 0;
      let found = false;
      for(; index < inventory.length; index++) {
        if(inventory[index].name == itemName) {
          found = true;
          break;
        }
      }

      if(found) {
        let item = inventory[index];
        item.actions[tokens[1]]({message: message, inventory: inventory, itemindex: index});
      } else {
        rtm.sendMessage(`You don't have a ${itemName}.`, message.channel);
      }
    }

    if(printDesc) {
      rtm.sendMessage(world[position.y][position.x].description, message.channel);
    }

    if(printCantMove) {
      rtm.sendMessage("Your path is blocked.", message.channel);
    }
  }
});

rtm.start();
