module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      // nativewind/babel (4.2+) already appends react-native-worklets/plugin
      // (reanimated 4's worklet transform — what used to be
      // react-native-reanimated/plugin), so no explicit plugins entry here.
      "nativewind/babel",
    ],
  };
};
