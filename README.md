# Simple Web Component Bundler with Tailwind CSS Support

A simple, roll-your-own Web Component bundler.

## Features

- Bundles Web Components
- Supports Tailwind CSS
- Automatic page reloading in development mode

## Getting Started

```bash
git clone https://github.com/taylor8294/simple-bundler.git
cd simple-bundler
npm install
npm run serve
```

### Structure

Create a folder directly under the `/components` directory named the same as your Web Component.
That folder should inclue a HTML, JS and CSS file with the same names as the parent folder.
See the example components.

You can add Tailwind CSS classes to your components.

Files in `/js` are concatenated into the `/public/scripts/bundle.js` file too for use in your pages.

The `/css` folder is used by `postcss` to generate the `/public/styles/tailwind.css` file.
Your pages will need a `link` tag to this, and any other global CSS you would like.

The `/modules` folder is not bundled, it is for JS that runs the bundler and dev environment.

Build your pages that use these components under the `/public` directory.
You page should include a `<script type="module">` tag to the `/public/scripts/bundle.js` file.
You can add other JS files that you want directly into the `/public/scripts` folder (these will not be bundled).
You can then either include them in your pages directly, or `import` them from code in the bundle.

The `/postinstall.js` file is used to the `escodegen` dependency to support ESTree's `PropertyDefinition` object.

You can tweak the tailwind configuration settings in `/tailwind.config.js`.

### Usage

Run `npm run serve` to start the developement server. Or `npm run build` just to build.

The developement server will be listening on `http://localhost:8080`.
You'll be able to make changes to your components, and the page will automatically reload to reflect the changes.

---

By [Taylor8294 🌈🐧](https://www.taylrr.co.uk/)
