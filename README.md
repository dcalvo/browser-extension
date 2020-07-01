## Get started

Clone this repository, and then, in this directory:

1. `npm install`
2. `npm run build`

Your unpacked Chrome extension will be compiled into `dist/`. You can load it into Chrome by enabling developer mode on the "Extensions" page, hitting "Load unpacked", and selecting the `dist/` folder. You can pack the extension into a `.crx`, and additionally optimize the compiled `.js`, by running `npm run prod`.

Use `npm run build` to recompile after editing.

## Source layout

The default source layout looks like this:

```
src
├── app
│   ├── background.ts
│   └── content.ts
├── styles
│   └── popup.css
└── ui
    └── popup.tsx
```

## Dist layout

```
dist
├── icons
│   ├── icon128.png
│   ├── icon16.png
│   ├── icon19.png
│   └── icon48.png
├── js
│   ├── background.js
│   ├── content.js
│   └── popup.js
├── manifest.json
├── popup.html
└── scribe.crx (npm run prod)
```

`dist` contains the unpacked Chrome extension. `webpack` is run in either development or production mode, depending on whether `npm run build` or `npm run prod` is called, respectively. `npm run prod` will optimize the compiled `.js` and additionally package the extension, creating `scribe.crx` in `dist` and `key.pem` in the root directory.

## Contributing

We're using [Commitizen](https://github.com/commitizen/cz-cli) and the [AngularJS](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines) commit guidelines.