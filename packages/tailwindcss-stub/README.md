# @nori-ui/tailwindcss-stub

A crypto-free stub of `tailwindcss@3.3.3` that satisfies NativeWind's peer
dependency requirement inside Expo Snack. Snackager's webpack doesn't
polyfill Node built-ins, and real `tailwindcss` imports `crypto`, so bundling
fails. This stub exposes the module surface NativeWind reads at runtime
(`tailwindcss`, `tailwindcss/plugin`, `tailwindcss/loadConfig`,
`tailwindcss/lib/util/*`, etc.) with minimal crypto-free implementations.

## Usage

In an Expo Snack's `package.json`, alias tailwindcss to this stub:

```json
{
    "dependencies": {
        "tailwindcss": "npm:@nori-ui/tailwindcss-stub@3.3.3"
    }
}
```

NativeWind's peer check sees `tailwindcss@3.3.3` installed and the Snack
bundles successfully.

## NOT for general use

This is intended strictly for the Snack sandbox. Install real `tailwindcss`
everywhere else (Expo CLI apps, Next.js, CI). The stub does not compile
utilities or generate CSS.
