# Server Components [![Travis Build Status](https://img.shields.io/travis/pimterry/server-components.svg)](https://travis-ci.org/pimterry/server-components) [![Join the chat at https://gitter.im/pimterry/server-components](https://badges.gitter.im/pimterry/server-components.svg)](https://gitter.im/pimterry/server-components?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Server Components are a simple, lightweight tool for composable HTML rendering in Node.js, broadly following the [web components](http://www.html5rocks.com/en/tutorials/webcomponents/customelements/) browser specification, but on the server side.

Server Components let you build web pages from `<google-maps lat=12.2 long=41.2>`, `<qr-code data="http://...">` and `<twitter-feed username="pimterry">`, in an accessible, incredibly-fast and SEO-loving way, without zero front-end cost or complexity.

Composable flexible and powerful approaches to building web applications don't have to require heavyweight front-end JS frameworks, buildsteps, pre-compilers, and enormous downloads.

You can take the same ideas (and standards), apply them directly server side, to gain all that power without *any* of the page weight, without having to maintain all the complexity, and without breaking accessibility/SEO/client-side performance. Even better, you move all your logic into your server-side JS engine: browser discrepancies disappear, testing gets vastly easier, and you can use every JS feature your Node version supports natively, right now.

**Server Components is still in its very early stages, and subject to change!** The core functionality is in place and working though, and it's stable and ready to play with whenever you are.

## Contents:
#### [Basic usage example](#basic-usage)
#### [Setup](#setting-it-up)
#### [API docs](#api-documentation)
#### [Why?](#why-does-this-exist)
#### [Caveats](#some-caveats)
#### [Plugins](#existing-plugins)
#### [Contributing](#how-to-contribute)

## Basic Usage

#### Define a component

```javascript
var components = require("server-components");

// Get the prototype for a new element
var NewElement = components.newElement();

// When the element is created during DOM parsing, you can transform the HTML inside it.
// This can be configurable too, either by setting attributes or adding HTML content
// inside it or elsewhere in the page it can interact with. Elements can fire events
// that other elements can receive to allow interactions, or even expose methods
// or data that other elements in the page can access directly.
NewElement.createdCallback = function () {
    this.innerHTML = "Hi there";
};

// Register the element with an element name
components.registerElement("my-new-element", { prototype: NewElement });
```

For examples of more complex component definitions, take a look at the [example components](https://github.com/pimterry/server-components/blob/master/component-examples.md)

#### Use your components

```javascript
var components = require("server-components");

// Render the HTML, and receive a promise for the resulting HTML string.
// The result is a promise because elements can render asynchronously, by returning
// promises from their callbacks. This allows elements to render content from
// external web services, your database, or anything else you can imagine.
components.render(`
    <html>
    <head></head>
    <body>
        <my-new-element></my-new-element>
    </body>
    </html>
`).then(function (output) {
    // Output = "<html><head></head><body><my-new-element>Hi there</my-new-element></body></html>"
});
```

## Setting it up

Want to try this out? Add it to your Node project with:

```bash
npm install --save server-components
```

You'll then want to add render calls ([as shown above](#use-your-components)) to your server endpoints that return HTML, to render that HTML with whatever components you have registered.

From there you can start simplifying your code, moving parts of your logic, page structure and rendering out into standalone components. Install other people's components, writing your own, and then just use them directly in your HTML. 

There aren't many published sharable components to drop in quite yet, as it's still early days, but as they appear you can find them by searching NPM for the `server-component` keyword: https://www.npmjs.com/browse/keyword/server-component. Building your own is easy though, take a look at the [example components](https://github.com/pimterry/server-components/blob/master/component-examples.md) for inspiration and patterns, and get building.

## API Documentation

### Top-level API

#### `components.newElement()`

Creates a returns a new custom HTML element prototype, extending the HTMLElement prototype.

Note that this does *not* register the element. To do that, call `components.registerElement` with an element name, and options (typically including the prototype returned here as your 'prototype' value).

This is broadly equivalent to `Object.create(HTMLElement.prototype)` in browser land, and exactly equivalent here to `Object.create(components.dom.HTMLElement.prototype)`. You can call that yourself instead if you like, but it's a bit of a mouthful.

#### `components.registerElement(componentName, options)`

Registers an element, so that it will be used when the given element name is found during parsing.

Element names are required to contain a hyphen (to disambiguate them from existing element names), be entirely lower-case, and not start with a hyphen.

The only option currently supported is 'prototype', which sets the prototype of the given element. This prototype will have its various callbacks called when it is found during document parsing, and properties of the prototype will be exposed within the DOM to other elements there in turn.

This returns the constructor for the new element, so you can construct and insert them into the DOM programmatically if desired.

This is broadly equivalent to `document.registerElement` in browser land.

#### `components.renderPage(html)`

Takes an HTML string for a full page, and returns a promise for the HTML string of the rendered result. Server Components parses the HTML, and for each registered element within calls its various callbacks (see the Component API) below as it does so.

Unrecognized elements are left unchanged. When calling custom element callbacks any returned promises are collected, and this call will not return until all these promises have completed. If any promises are rejected, this renderPage call will be rejected too.

To support the full DOM Document API, this method requires that you are rendering a full page (including `<html>`, `<head>` and `<body>` tags). If you don't pass in content wrapped in those tags then they'll be automatically added, ensuring your resulting HTML has a full valid page structure. If that's not what you want, take a look at `renderFragment` below.

#### `components.renderFragment(html)`

Takes an HTML string for part of a page, and returns a promise for the HTML string of the rendered result. Server Components parses the HTML, and for each registered element within calls its various callbacks (see the Component API) below as it does so.

Unrecognized elements are left unchanged. When calling custom element callbacks any returned promises are collected, and this call will not return until all these promises have completed. If any promises are rejected, this renderFragment call will be rejected too.

This method renders the content as a [Document Fragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment), a sub-part of a full document. This means if you there are any `<html>`, `<head>` or `<body>` tags in your input, they'll be stripped, as they're not legal within a fragment of a document. Note that this means the provided `document` object in your components will actually be a `DocumentFragment`, not a true `Document` object (although in most cases you can merrily ignore this). If you want to render a full page, take a look at `renderPage` above.

#### `components.dom`

The DOM object (components.dom) exposes traditional DOM objects (normally globally available in browsers) such as the CustomEvent and various HTMLElement classes, typically use inside your component implementations.

This is (very) broadly equivalent to `window` in browser land.

### Component API

These methods are methods you can implement on your component prototype (as returned by `newElement`) before registering your element with `registerElement`. Implementing every method here is optional.

Any methods that are implemented, from this selection or otherwise, will be exposed on your element in the DOM during rendering. I.e. you can call `document.querySelector("my-element").setTitle("New Title")` and to call the `setTitle` method on your object, which can then potentially change how your component is rendered.

#### `yourComponent.createdCallback(document)`

Called when an element is created.

**This is where you put your magic!** Rewrite the elements contents to dynamically generate what your users will actually see client side. Read configuration from attributes or the initial child nodes to create flexible reconfigurable reusable elements. Register for events to create elements that interact with the rest of the application structure. Build your page.

This method is called with `this` bound to the element that's being rendered (just like in browser-land). The `document` object that would normally be available as a global in the browser is instead passed as an argument here for convenience (useful if you want to use `document.querySelectorAll` and friends). Note that if you're rendering with `renderFragment` instead of `renderPage` this will be a DocumentFragment, not a Document, although in almost all cases you can safely ignore this.

If this callback returns a promise, the rendering process will not resolve until that promise does, and will fail if that promise fails. You can use this to perform asynchronous actions without your component definitions. Pull tweets from twitter and draw them into the page, or anything else you can imagine.

These callbacks are called in opening tag order, so a parent's createdCallback is called, then each of its children's, then its next sibling element.

#### `yourComponent.attachedCallback(document)`

Called when the element is attached to the DOM. This is different to when it's created when your component is being built programmatically, not through HTML parsing. *Not yet implemented*

#### `yourComponent.detachedCallback(document)`

Called when the element is removed from the DOM. *Not yet implemented*

#### `yourComponent.attributeChangedCallback(document)`

Called when an attribute of the element is added, changed, or removed. *Not yet implemented*.

**So far only the createdCallback is implemented here, as the others are less relevant initially for the key simpler cases. Each of those will be coming in time though! Watch this space.**

## Why does this exist?

Server Components is designed for anybody building web pages who wants to build on the web natively, with all its built-in accessibility, performance and SEO benefits, not floating on a wobbly JavaScript layer on top.

For 90% of web sites, you don't need the core of your app to run purely inside big ultra-flashy web-breaking client-side JavaScript. Many of us have been doing so not because our sites need to because server side rendering isn't enough to deliver our core experience, but because JS frameworks offer the best developer experience.

Tools like React, Ember, Angular and friends make building web pages a delight. That's because they've been in a great place to discover and develop better approaches to building and managing UI complexity though, not because they're running client-side. We've conflated the two.

We can fix this. We can take those same ideas and designs (critically, the key element they all agree on: composing applications together from many standalone elements), and get the magic and maintainability on the server side too, without the costs.

Server Components is an attempt to do that, by supporting the [Web Components spec](http://www.html5rocks.com/en/tutorials/webcomponents/customelements/) (the W3C work to pull out the core magic of these frameworks into an official standard), when rendering HTML in server-side Node.js.

#### Example:

```html
<html>
<head>

<social-media-metatags name="My Page" image="./logo.png" ></social-media-metatags>

</head>
<body>
<h1>My Profile Page</h1>

<social-media-icons twitter="pimterry" github="pimterry" />

<google-map latitude="41.390205" longitude="2.154007"></google-map>

<item-feed id="minor-events">
    <twitter-source username="pimterry" />
    <github-source  username="pimterry" type-filter="PullRequestEvent" />
</item-feed>

<item-feed id="manually-curated-content">
    <manual-source icon="./blog-icon"    source="blog-posts" />
    <manual-source icon="./talk-icon"    source="talks-given" />
    <manual-source icon="./project-icon" source="project-events" />
</item-feed>

<item-carousel>
    <speakerdeck-source icon="./slides-icon" />
    <manual-source      icon="./slides-icon" source="slidesets" />
</item-carousel>

<item-carousel>
    <manual-source icon="./video-icon" source="talk-videos" />
    <manual-source icon="./photo-icon" source="talk-photos" />
</item-carousel>

</body>
</html>
```

It would be fantastic to write websites like the above, render it on the server, and serve up your users a fully populated page the works in browsers from the dawn of time, takes no mountain of JS to run, renders at lightning speed, and that search engines and screen readers can effortlessly understand.

Code like this is a pleasure to write, clicking abstractions together to build incredible applications at high-speed, but right now it happens only on the client side. If you render this server side though, you can get the power of this, and the benefits of just serving static HTML + CSS (and more JS too, if you like, to progressively enhance your site with extra interactivity as well).

You can do this right now with Server Components. It's somewhere between a classic JavaScript framework (but much smaller, faster, simpler, and server-side) and a templating library (but much cleverer, more powerful and more flexible).

This doesn't end there though. The end goal of this is to provide an API so close to the client-side web component standard that it becomes easy to write components which work on both sides, enabling isomorphic JavaScript entirely on web standards. It's server side only for now, but watch this space.

## Some Caveats

Server Components is building on the Web Components specs, but really almost entirely the custom elements spec. HTML Imports are out of scope initially (although it's interesting to think about what that might look like on the server), template tags are supported but are unnecessary really since all DOM is inert here, and the Shadow DOM is challenging and less useful here, so not the main focus right now.

Core DOM functionality now built on [Domino](https://github.com/fgnass/domino), so DOM manipulation comes with Domino's
limitations. File issues if you hit any of these, Domino is aiming to be an accurate representation of the full DOM spec, so there's any serious divergences should probably be fixable upstream.

IE 8 and earlier render unknown elements poorly, and will probably render the output of this badly. This is [solvable by hand](https://blog.whatwg.org/supporting-new-elements-in-ie) (although it requires front-end JS), but isn't solved automatically for you here yet.

This is not intended to be used as an all encompassing framework, but as a tool for rendering a page. It's designed to compose together standalone chunks of HTML, nothing more. For any substantial application there will be steps that happen totally orthogonally to the resulting page structure (e.g. checking authentication, performing the action requested by the request, loading page-wide data), and trying to shoehorn those into server components will be painful for everybody.

Instead, build general logic as normal, and once you're at the stage where the page-wide logic is compete and you simply have to glue everything together for the bits of your final page, break out the components. Use templating libraries like Mustache and friends to build your purely high-level HTML template with your data, and then use server components to render that HTML into the basic page HTML your users will actually see, letting individual components handling all the complexity behind that.

## Existing Plugins

[Static](https://github.com/pimterry/server-components-static): Static file extension, making it easy to include references to external content in the resulting HTML, and providing a mapping to transform resource URLs used back to find the static content in their corresponding components later.

[Express](https://github.com/pimterry/server-components-express): Express integration, automatically completely set up static file configuration for Express.

Writing more plugins to make it easy to integrate Server Components with other tools, and to help enable other useful patterns would be fantastic. If you write one, feel free to file a pull request on this repository to add it to the list.

## How to Contribute

It's great to hear you're interested in helping out!

Right now the key thing is getting people using Server Components used in practice, and getting feedback
on how well that works. If you're just keen generally, pick up Server Components, try to build
something quick yourself now, and file bugs (or even fixes!) as you go.

It would also be really great to see more components available for general use. Take a look at
[the examples](https://github.com/pimterry/server-components/blob/master/component-examples.md), and try 
putting some together yourself. Don't forget to add the [server-components](https://www.npmjs.com/browse/keyword/server-component) keyword when you push to NPM,
so they're findable!

Finally, if you'd like to dive into framework development anyway, take a look at the Huboard at
https://huboard.com/pimterry/server-components/ to see the currently prioritised issues and their
status. If you'd like to pick one up, add a quick note on the ticket that you're interested and outlining
your approach, and then jump in!

#### Building the project

Everything you need should be installed after a clone and `npm install`. There's very few build scripts,
but they're managed just through NPM directly, take a look at the [package.json](package.json) for details.

To test the project: `npm test`

To watch the project locally and automatically run tests on changes: `npm run dev`
