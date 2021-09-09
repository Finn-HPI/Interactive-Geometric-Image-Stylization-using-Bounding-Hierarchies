@digitalmasterpieces/
# arctic-core

[![npm](https://img.shields.io/npm/v/@digitalmasterpieces/arctic-core)](https://www.npmjs.com/package/@digitalmasterpieces/arctic-core)
![npm License](https://img.shields.io/npm/l/@digitalmasterpieces/arctic-core)
![npm bundle size](https://img.shields.io/bundlephobia/min/@digitalmasterpieces/arctic-core)
![Libraries.io dependency status for latest release, scoped npm package](https://img.shields.io/librariesio/release/npm/@digitalmasterpieces/arctic-core)
![Type declarations](https://badgen.net/npm/types/@digitalmasterpieces/arctic-core)

Processes visual media using WebGL 2 and applies operations based on Visual Computing Assets.

## Installing

You can install the ArcticCore using NPM or Yarn to get the latest version of our library.

> `npm install @digitalmasterpieces/arctic-core`

For usage from a CDN we recommend using [Skypack](https://www.skypack.dev/) CDN. The ArcticCore package is accessable at the following URL:

> `https://cdn.skypack.dev/@digitalmasterpieces/arctic-core`

---

## Usage

The arctic-core package can be used directly in scripts. However it is strongly advised to use it as processing core together with the [@digitalmasterpieces/web-processor](https://www.npmjs.com/package/@digitalmasterpieces/web-processor) package, since it gives more abstraction and therefore provides a simpler and more intuitive interface.

The following shows one possible approach to use the package in a browser script:

```javascript
(async () => {
	const createCore = await import(/* webpackIgnore: true */ "/arctic-core/index.js");
	const canvas = document.createElement("canvas");
	const { WebProcessorCore, FS, GL } = await createCore.default({ canvas });

	console.log({ WebProcessorCore, FS, GL });
})();
```

The JavaScript "glue code" gets imported dynamically from an URL. The comment in the import statement is related to [Webpack](https://webpack.js.org/api/module-methods/#dynamic-expressions-in-import). By removing this comment Webpack would try to find the scripts as a module rather than from an URL where the file is actually served.

To serve the arctic-core module from an URL with Webpack one possible approach would be using the [CopyWebpackPlugin](https://webpack.js.org/plugins/copy-webpack-plugin/) in your `webpack.config.js`:

```javascript
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
	/* ... */
	plugins: [
		new CopyWebpackPlugin({
			patterns: [
				{
					from: "../../node_modules/@digitalmasterpieces/arctic-core/lib",
					to: "./arctic-core",
				},
			],
		}),
	],
	/* ... */
};
```

---

The full documentation with some usage examples is available [here](https://saas.digitalmasterpieces.com/docs/sdk-packages/arctic-core).

To learn more about the Stylization SDK visit our homepage at [https://saas.digitalmasterpieces.com](https://saas.digitalmasterpieces.com).

Get your own API key [here](https://saas.digitalmasterpieces.com/#register).

Try our demo application [here](https://saas.digitalmasterpieces.com/app).

## License

[MIT](LICENSE)
