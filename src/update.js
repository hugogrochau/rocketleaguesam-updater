import apiClient from 'rocketleaguesam-api-client';
import rankApisClient from 'rocket-league-apis-client';
import createQueue from './queue';
import { shouldUpdate, getAdjustedTime } from './util';

export default (PRIORITY_UNIT, API_URL, API_VERSION, trackers) => {
  // create a rocketleaguesam api client
  const api = apiClient({ host: `${API_URL}/${API_VERSION}` });

  // create an api client for each tracker
  const trackersWithApi = trackers.map((t) => ({
    name: t.name,
    rate: t.rate,
    api: rankApisClient({
      tracker: t.name,
      apiUrl: t.apiUrl,
      apiKey: t.apiKey,
    }),
    isUp: true,
    lastRequest: 0,
  }));

  const queue = createQueue(PRIORITY_UNIT, trackersWithApi, api);

  console.log('Pulling players...');

  api.player.all()
    .then((jsonData) => {
      console.log('Pulled players');

      // filter out players that shouldn't update yet
      const playersToUpdate = jsonData.data.players.filter(shouldUpdate(PRIORITY_UNIT));

      // sort players by update time
      playersToUpdate.sort((a, b) =>
        getAdjustedTime((new Date(a.last_update)).getTime(), a.priority, PRIORITY_UNIT) -
        getAdjustedTime((new Date(b.last_update)).getTime(), b.priority, PRIORITY_UNIT)
      );

      console.log('Players to update:');
      console.log(playersToUpdate.map((p) => p.name));

      // handle queue errors
      queue.error = (errWithTracker, player) => {
        // unrecoverable error
        if (!errWithTracker.err) {
          console.log(errWithTracker);
          console.log('Finishing queue prematurely...');
          queue.kill();
          return;
        }

        const { err, tracker } = errWithTracker;
        const allowedErrors = ['DatabaseError', 'PlayerNotFound', 'InputError', 'UnknownError'];
        const errMessage = err.message || 'Unknown Error';

        console.log(`Failed to update ${player.name} because of: ${errMessage}`);

        // Mark tracker down on invalid errors
        if (!allowedErrors.includes(errMessage)) {
          console.log(`Marking ${tracker.name} as down`);
          tracker.isUp = false;
          // add player to top of queue to update with another tracker
          queue.unshift(player);
        }
      };

      // called when queue is empty
      queue.drain = () =>
        console.log('Finished full update');

      // add players to the queue
      queue.push(playersToUpdate);
    })
    .catch((err) => console.log(`Error fetching players: ${err.message}`));
};
