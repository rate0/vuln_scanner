const formatDuration = (durationMs) => {
    const seconds = Math.floor((durationMs / 1000) % 60);
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    const hours = Math.floor((durationMs / (1000 * 60 * 60)) % 24);
  
    if (hours > 0) {
      return `${hours} ч ${minutes} мин`;
    } else if (minutes > 0) {
      return `${minutes} мин ${seconds} сек`;
    } else {
      return `${seconds} сек`;
    }
  };
  
  module.exports = {
    formatDuration,
  };