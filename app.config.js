export default {
  expo: {
    name: "ConnectCampus+",
    slug: "connectcampus-plus",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#FFFFFF"
      }
    },
    web: {
      bundler: "metro",
      output: "single"
    },
    plugins: ["expo-router"],
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true
    },
    extra: {
      // App configuration will go here
    },
  }
}; 