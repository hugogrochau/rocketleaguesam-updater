import { TRACKER } from 'rocket-league-apis-client';
import update from './update';

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

const PRIORITY_UNIT = process.env.PRIORITY_UNIT; // minutes difference between update priorities

const trackers = [];

if (process.env.ROCKETLEAGUE_TRACKER_NETWORK_API_KEY) {
  checkConstant('ROCKETLEAGUE_TRACKER_NETWORK_RATE');
  checkConstant('ROCKETLEAGUE_TRACKER_NETWORK_API_URL');
  trackers.push({
    name: TRACKER.ROCKETLEAGUE_TRACKER_NETWORK,
    rate: process.env.ROCKETLEAGUE_TRACKER_NETWORK_RATE,
    apiKey: process.env.ROCKETLEAGUE_TRACKER_NETWORK_API_KEY,
    apiUrl: process.env.ROCKETLEAGUE_TRACKER_NETWORK_API_URL,
  });
}

if (process.env.RLTRACKER_PRO_API_KEY) {
  checkConstant('RLTRACKER_PRO_RATE');
  checkConstant('RLTRACKER_PRO_API_URL');
  trackers.push({
    name: TRACKER.RLTRACKER_PRO,
    apiKey: process.env.RLTRACKER_PRO_API_KEY,
    apiUrl: process.env.RLTRACKER_PRO_API_URL,
    rate: process.env.RLTRACKER_PRO_RATE,
  });
}

console.log(`Starting full update at ${new Date().toISOString()}...`);

update(PRIORITY_UNIT, API_URL, API_VERSION, trackers);

