const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// expo-sqlite en web corre sobre wa-sqlite (WASM) en un Worker, y sus llamadas
// *Sync requieren SharedArrayBuffer (por eso los headers COOP/COEP).
config.resolver.assetExts.push("wasm");
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
	res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
	res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
	middleware(req, res, next);
};

module.exports = withNativeWind(config, { input: "./src/global.css" });
