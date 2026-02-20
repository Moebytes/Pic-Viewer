import {defineConfig} from "@rsbuild/core"
import {pluginReact} from "@rsbuild/plugin-react"
import {pluginLess} from "@rsbuild/plugin-less"
import {pluginNodePolyfill} from "@rsbuild/plugin-node-polyfill"
import {pluginTypeCheck} from "@rsbuild/plugin-type-check"
import {mainPlugin} from "@electron-rsbuild/plugin-main"
import {preloadPlugin} from "@electron-rsbuild/plugin-preload"
import {rendererPlugin} from "@electron-rsbuild/plugin-renderer"
import path from "path"
import dotenv from "dotenv"

const env = dotenv.config().parsed!
let typecheck = env.TYPECHECK === "yes"

const dialogs = {
  index: "./App.tsx",
  brightnessdialog: "./components/BrightnessDialog.tsx",
  hsldialog: "./components/HSLDialog.tsx",
  tintdialog: "./components/TintDialog.tsx",
  blurdialog: "./components/BlurDialog.tsx",
  pixelatedialog: "./components/PixelateDialog.tsx",
  binarizedialog: "./components/BinarizeDialog.tsx",
  resizedialog: "./components/ResizeDialog.tsx",
  rotatedialog: "./components/RotateDialog.tsx",
  cropdialog: "./components/CropDialog.tsx",
  gifdialog: "./components/GIFDialog.tsx",
  bulksavedialog: "./components/BulkSaveDialog.tsx",
}

export default defineConfig({
    root: path.resolve(__dirname, "."),
    tools: {
        rspack(config) {
            config.module = config.module || {}
            config.module.rules = config.module.rules || []

            config.externals = config.externals || {}

            config.externals = {
                "electron-click-drag-plugin": "commonjs electron-click-drag-plugin",
                "sharp": "commonjs sharp",
                "@aws-sdk/client-s3": "commonjs @aws-sdk/client-s3"
            }

            config.module.rules.push({
                test: /\.svg$/,
                type: "javascript/auto",
                use: [{
                    loader: "@svgr/webpack", 
                    options: {
                        svgoConfig: {
                            plugins: [
                                {name: "preset-default", params: {overrides: {removeViewBox: false}}}
                            ]
                        }
                    }
                }]
            })

            return config
        }
    },
    environments: {
        main: {
            plugins: [
                pluginTypeCheck({enable: typecheck}),
                mainPlugin({
                    source: {entry: {index: path.resolve(__dirname, "./main.ts")}},
                    output: {
                        target: "node",
                        distPath: {
                            root: "dist/main",
                            js: "."
                        },
                        minify: false
                    }
                })
            ]
        },
        preload: {
            plugins: [
                pluginTypeCheck({enable: typecheck}),
                preloadPlugin({
                    source: {entry: {index: path.resolve(__dirname, "./preload.ts")}},
                    output: {
                        target: "node",
                        distPath: {
                            root: "dist/preload",
                            js: ".",
                        },
                        minify: false
                    }
                })
            ]
        },
        renderer: {
            plugins: [
                pluginReact(),
                pluginLess(),
                pluginNodePolyfill(),
                pluginTypeCheck({enable: typecheck}),
                rendererPlugin({
                    source: {
                        entry: Object.fromEntries(
                            Object.entries(dialogs).map(([key, value]) => [
                            key,
                            path.resolve(__dirname, value)
                        ]))
                    },
                    html: Object.fromEntries(
                        Object.keys(dialogs).map((key) => [
                            key, {
                                template: key === "index"
                                    ? path.resolve(__dirname, "./index.html")
                                    : path.resolve(__dirname, `./structures/${key}.html`),
                                filename: `${key}.html`
                            }
                        ])
                    ),
                    output: {
                        target: "web",
                        assetPrefix: "auto",
                        distPath: {
                            root: "dist/renderer",
                        },
                        minify: false
                    }
                })
            ]
        }
    }
})