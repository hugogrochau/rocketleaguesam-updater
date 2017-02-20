import omit from 'lodash/omit';

// pulls player info from tracker and updates through the api
export const updatePlayer = (player, tracker, internalApi) => new Promise((resolve, reject) =>
    tracker.api(player.platform, player.id)
      .then((stats) => {
        console.log(stats);
        return internalApi.player.update({
          platform: player.platform,
          id: player.id,
          body: omit(stats.player, ['id', 'platform']),
        });
      })
      .then((info) => {
        if (info.data.updated) {
          return resolve(`Updated player: ${player.name}`);
        }
        resolve(`No update needed for player: ${player.name}`);
      })
      .catch((err) => reject(err))
  );
