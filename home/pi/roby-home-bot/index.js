const fs = require('fs');
const colors = require('color-name');
const { MilightController, discoverBridges, helper, commandsV6 } = require('node-milight-promise');
const emoji = require('node-emoji')
const { RTMClient, WebClient, LogLevel } = require('@slack/client');
let token;
try {
  token = fs.readFileSync('./token.key').toString().trim();
} catch (e) {
  console.log('Please create a token.key file containing the Slack token.');
}
const logLevel = LogLevel.ERROR;
const timeOut = 20000;
const broadcastIp = '10.1.1.255';
const keyword = 'roby';
const welcomeMsg = `Hello, I'm Roby :traffic_light: :robot_face: !\nType: roby for help.`;
const lightCommandInterface = commandsV6;
const lightBulbType = 'fullColor'; // rgbw white rgb fullColor
const defaultBridgeType = 'v6';
const defaultIp = '255.255.255.255';
let channel, light;

process.on('unhandledRejection', error => {
  console.log(error);
  if (error.message && error.message.indexOf('no response timeout') >= 0) {
    light._close();
    light = undefined;
    sendMessage('Something went wrong, please retry.');
  } else {
    process.exit(1);
  }
});

const rtm = new RTMClient(token,
  {
    logLevel,
    autoReconnect: true,
    clientPingTimeout: timeOut,
    serverPongTimeout: timeOut - 1000
  }
);

const web = new WebClient(token,
  { logLevel }
);

// Start bot
(async () => {
  const connectionInfo = await rtm.start();
  const res = await web.channels.list()
  channel = res.channels.find(c => c.is_member);

  sendMessage(welcomeMsg);
  await initLight();
  console.log('Connection: ', connectionInfo.team.name);
})();

const initLight = async () => {
  const bridges = await discoverBridges({ type: 'all', address: broadcastIp });
  const firstBridge = bridges.find(bridge => bridge);

  light = new MilightController({
    ip: firstBridge ? firstBridge.ip : defaultIp,
    type: firstBridge ? firstBridge.type : defaultBridgeType
  });

  firstBridge ?
    sendMessage('Found bridge: ' + Object.values(firstBridge).join(' / ')) :
    sendMessage('No light bridges found.');
  return light;
}

rtm.on('message', async (message) => {
  if (message.type === 'message' && (message.text || message.attachments.length > 0)) {
    let messageText = message.text ? message.text : message.attachments[0].pretext;
    messageText = messageText.toLowerCase();
    if (messageText.indexOf(keyword) === 0) {
      const command = messageText.replace(keyword, '').trim();
      const response = await processCommand(command);
      sendMessage(response);
    }
  }
});

const sendMessage = async (message) => {
  if (channel) {
    const msg = await rtm.sendMessage(emoji.emojify(message), channel.id);
    console.log(`Sent message to ${channel.name} with ts:${msg.ts}`);
  } else {
    console.log('This bot does not belong to any channel, invite it to at least one and try again');
  }
}

const processCommand = async (commandAndParameters) => {
  console.log('Executing', commandAndParameters);
  const commandAndParametersArray = commandAndParameters.trim().split(' ');
  if (commandAndParametersArray[0] !== '' && commands[commandAndParametersArray[0]]) {
    return commands[commandAndParametersArray[0]].apply(this, commandAndParametersArray.slice(1));
  } else {
    return `Try roby [command]. Availible commands: ` + Object.keys(commands);
  }
}

const commands = {
  milight: async (zone, command, effect) => {
    if (!zone || !command) {
      return 'Try roby milight [zone: 0...3] [command: on off dim full movie disco fire [color]]'
    }
    zone = parseInt(zone);
    const lightBulb = lightCommandInterface[lightBulbType];
    if (light === undefined) {
      await initLight();
    }
    if (colors[command]) {
      const rgb = colors[command];
      light.sendCommands(
        lightBulb.on(zone),
        lightBulb.rgb(zone, rgb[0], rgb[1], rgb[2])
      )
    }
    switch (command) {
      case 'on':
        light.sendCommands(lightBulb.on(zone))
        break;
      case 'off':
        light.sendCommands(lightBulb.off(zone))
        break;
      case 'movie':
        light.sendCommands(
          lightBulb.on(zone),
          lightBulb.whiteMode(zone),
          lightBulb.brightness(zone, 20)
        )
        break;
      case 'dim':
        light.sendCommands(
          lightBulb.on(zone),
          lightBulb.whiteMode(zone),
          lightBulb.brightness(zone, 50)
        )
        break;
      case 'full':
        light.sendCommands(
          lightBulb.on(zone),
          lightBulb.whiteMode(zone),
          lightBulb.brightness(zone, 100)
        )
        break;
      case 'disco':
        light.sendCommands(
          lightBulb.on(zone),
          lightBulb.brightness(zone, 100),
          lightBulb.effectMode(zone, 6)
        )
        break;
      case 'fire':
        light.sendCommands(
          lightBulb.on(zone),
          lightBulb.brightness(zone, 100),
          lightBulb.effectMode(zone, 1)
        )
        break;
    }
    return `:high_brightness: Milight ${zone} ${command} :high_brightness:`;
  }
}
