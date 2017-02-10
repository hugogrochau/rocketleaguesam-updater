import queue from 'async/queue';
import { TRACKERS } from 'rocket-league-apis-client';
import { timeToWaitBeforeNextRequest } from './util';
import { updatePlayer } from './external-actions';

export default (PRIORITY_UNIT, trackers, internalApi) => {
  // to be called for each player added
  const q = queue((player, callback) => {
    const filteredTrackers = trackers.filter((t) =>
      t.isUp && // remove if tracker is marked as down
      (player.platform !== 2 || t.name !== TRACKERS.RLTRACKER_PRO) // RL Tracker can't handle xbox
    );

    if (filteredTrackers.length === 0) {
      callback(`No trackers to use for updating ${player.name}`);
      return;
    }

    // sort by timeToWaitBeforeNextRequest
    trackers.sort((a, b) =>
      timeToWaitBeforeNextRequest(a) - timeToWaitBeforeNextRequest(b)
    );

    // get first tracker
    const tracker = trackers[0];
    const trackerTimeToWait = timeToWaitBeforeNextRequest(trackers[0]);

    console.log(`Waiting ${trackerTimeToWait} ms for next request using ${tracker.name}...`);
    setTimeout(() => {
      tracker.lastRequest = Date.now();
      console.log(`Starting update for player: ${player.name} using ${tracker.name}`);
      updatePlayer(player, tracker, internalApi)
        .then((result) => {
          console.log(result);
          callback();
        })
        .catch((err) => {
          const errMessage = err.message || 'Unknown Error';
          const allowedErrors = ['Not Found', 'PlayerNotFound', 'InputError', 'Unknown Error'];
          // Ignore errors relating to invalid players
          if (!allowedErrors.includes(errMessage)) {
            console.log(`Marking ${tracker.name} as down`);
            tracker.isUp = false;
          }
          if (errMessage === 'Unknown Error') {
            console.log(err);
          }
          callback(errMessage);
        });
    }, trackerTimeToWait);
  }, 1);

  q.drain = () =>
    console.log('Finished full update.');

  return q;
};

