// pulls player info from tracker and updates through the api
export const updatePlayer = (player, tracker, internalApi) => {
  return new Promise((resolve, reject) =>
    tracker.api(player.platform, player.id)
      .then((stats) =>
        internalApi.player.update({
          platform: player.platform,
          id: player.id,
          body: stats,
        })
      )
      .then((info) => {
        if (info.data.updated) {
          return resolve(`Updated player: ${player.name}`);
        }
        resolve(`No update needed for player: ${player.name}`);
      })
      .catch((err) => reject(err))
  );
};
