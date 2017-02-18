import queue from 'async/queue';
import { TRACKERS } from 'rocket-league-apis-client';
import { timeToWaitBeforeNextRequest } from './util';
import { updatePlayer } from './external-actions';

const handleError = (err, tracker) => {
  const errMessage = err.message || 'Unknown Error';
  const allowedErrors = ['DatabaseError', 'PlayerNotFound', 'InputError', 'UnknownError'];

  // Mark tracker down on invalid errors
  if (!allowedErrors.includes(errMessage)) {
    console.log(`Marking ${tracker.name} as down`);
    tracker.isUp = false;
  }

  return errMessage;
};

const createUpdateQueue = (PRIORITY_UNIT, trackers, internalApi) => {
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
    filteredTrackers.sort((a, b) =>
      timeToWaitBeforeNextRequest(a) - timeToWaitBeforeNextRequest(b)
    );

    // get first tracker
    const tracker = filteredTrackers[0];
    const trackerTimeToWait = timeToWaitBeforeNextRequest(filteredTrackers[0]);

    console.log(`Waiting ${trackerTimeToWait} ms for next request using ${tracker.name}...`);

    setTimeout(() => {
      console.log('===================================================================');
      console.log(`Starting update for player: ${player.name} using ${tracker.name}`);

      tracker.lastRequest = Date.now();
      updatePlayer(player, tracker, internalApi)
        .then((result) => {
          console.log(result);
          callback();
        })
        .catch((err) => {
          const errMessage = handleError(err, tracker);
          console.log(`Failed to update ${player.name} because of: ${errMessage}`);
          callback();
        });
    }, trackerTimeToWait);
  }, 1); // 1 worker

  q.drain = () =>
    console.log('Finished full update.');

  return q;
};

export default createUpdateQueue;
