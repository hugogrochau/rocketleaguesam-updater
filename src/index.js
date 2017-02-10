import apiClient from 'rocketleaguesam-api-client';
import rankApisClient, { TRACKER } from 'rocket-league-apis-client';
import { shouldUpdate, getAdjustedTime } from './util';
import createUpdateQueue from './queue';

const checkConstant = (c) => {
  if (!process.env[c]) {
    console.log(`Please set ${c}`);
    process.exit(-1);
  }
};

const requiredConstants = [
  'API_URL',
  'API_VERSION',
  'PRIORITY_UNIT',
];

requiredConstants.forEach((c) => checkConstant(c));

const API_URL = process.env.API_URL;
const API_VERSION = process.env.API_VERSION;
const api = apiClient({ host: `${API_URL}/${API_VERSION}` });


const PRIORITY_UNIT = process.env.PRIORITY_UNIT; // minutes difference between priorities

const trackers = [];

if (process.env.ROCKETLEAGUE_TRACKER_NETWORK_API_KEY) {
  checkConstant('ROCKETLEAGUE_TRACKER_NETWORK_RATE');
  checkConstant('ROCKETLEAGUE_TRACKER_NETWORK_API_URL');
  trackers.push({
    name: TRACKER.ROCKETLEAGUE_TRACKER_NETWORK,
    rate: process.env.ROCKETLEAGUE_TRACKER_NETWORK_RATE,
    api: rankApisClient({
      tracker: TRACKER.ROCKETLEAGUE_TRACKER_NETWORK,
      apiKey: process.env.ROCKETLEAGUE_TRACKER_NETWORK_API_KEY,
      apiUrl: process.env.ROCKETLEAGUE_TRACKER_NETWORK_API_URL,
    }),
    isUp: true,
    lastRequest: 0,
  });
}

if (process.env.RLTRACKER_PRO_API_KEY) {
  checkConstant('RLTRACKER_PRO_RATE');
  checkConstant('RLTRACKER_PRO_API_URL');
  trackers.push({
    name: TRACKER.RLTRACKER_PRO,
    api: rankApisClient({
      tracker: TRACKER.RLTRACKER_PRO,
      apiKey: process.env.RLTRACKER_PRO_API_KEY,
      apiUrl: process.env.RLTRACKER_PRO_API_URL,
    }),
    rate: process.env.RLTRACKER_PRO_RATE,
    isUp: true,
    lastRequest: 0,
  });
}

console.log(`Starting full update at ${new Date().toISOString()}...`);

const q = createUpdateQueue(PRIORITY_UNIT, trackers, api);

console.log('Pulling players...');

api.player.all()
  .then((jsonData) => {
    console.log('Pulled players');
    const playersToUpdate = jsonData.data.players.filter(shouldUpdate(PRIORITY_UNIT));

    // sort by update time
    playersToUpdate.sort((a, b) =>
      getAdjustedTime((new Date(a.last_update)).getTime(), a.priority, PRIORITY_UNIT) -
      getAdjustedTime((new Date(b.last_update)).getTime(), b.priority, PRIORITY_UNIT)
    );

    console.log('Players to update:');
    console.log(playersToUpdate.map((p) => p.name));

    q.push(playersToUpdate);
  })
  .catch((err) => console.log(`Error fetching players: ${err.message}`));
