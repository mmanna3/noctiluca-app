/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = () => ({
	type: "widget",
	name: "ObjetivosHoyWidget",
	frameworks: ["WidgetKit", "SwiftUI"],
	// El App Group se sincroniza automáticamente desde app.json (ios.entitlements)
	// porque los widgets tienen appGroupsByDefault: true en @bacons/apple-targets.
	entitlements: {},
});
