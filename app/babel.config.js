// Babel config for the Expo app.
// - babel-preset-expo with the NativeWind jsxImportSource (className -> styles)
// - nativewind/babel preset
// - react-native-worklets/plugin MUST be last (required by reanimated v4)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['react-native-worklets/plugin'],
  };
};
