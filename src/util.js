// Get time increased based on player priority
export const getAdjustedTime = (time, priority, priorityUnit) =>
time + (priority * priorityUnit * 60 * 1000);

export const shouldUpdate = (priorityUnit) => (player) => {
  // Time between now and last update in ms
  const timeDelta = Date.now() - (new Date(player.last_update)).getTime();
  // Time between updates based on player priority
  const timeBetweenUpdates = getAdjustedTime(0, player.priority, priorityUnit);
  const justCreated = player.last_update === player.created_at;
  // Return true if it's time to update or if it's a new player
  return (timeDelta > timeBetweenUpdates && player.priority > 0) || justCreated;
};

// Time to wait before next request to tracker
export const timeToWaitBeforeNextRequest = (tracker) => {
  //           rate in ms              ms passed since last request
  const time = ((60 * 1000) / tracker.rate) - (Date.now() - tracker.lastRequest);
  return time < 0 ? 0 : time;
};
