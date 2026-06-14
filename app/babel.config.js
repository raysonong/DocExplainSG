// Babel config for the Expo app.
// `babel-preset-expo` includes the transforms expo-router needs.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
