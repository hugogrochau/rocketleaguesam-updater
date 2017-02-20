import queue from 'async/queue';
import { TRACKERS } from 'rocket-league-apis-client';
import { timeToWaitBeforeNextRequest } from './util';
import { updatePlayer } from './external-actions';


export default (PRIORITY_UNIT, trackers, internalApi) =>
  // to be called for each player added
   queue((player, callback) => {
     const filteredTrackers = trackers.filter((t) =>
      t.isUp && // remove if tracker is marked as down
      (player.platform !== 2 || t.name !== TRACKERS.RLTRACKER_PRO) // RL Tracker can't handle xbox
    );

     if (filteredTrackers.length === 0) {
       callback('No trackers left to use for updating');
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
        .catch((err) => callback({ err, tracker }));
     }, trackerTimeToWait);
   }, 1) // 1 worker
;
