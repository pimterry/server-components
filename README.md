# Server Components [![Travis Build Status](https://img.shields.io/travis/pimterry/server-components.svg)](https://travis-ci.org/pimterry/server-components) [![Join the chat at https://gitter.im/pimterry/server-components](https://badges.gitter.im/pimterry/server-components.svg)](https://gitter.im/pimterry/server-components?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Server Components are a simple, lightweight tool for Node.js server-side rendering, following the web components spec.

Composable flexible and powerful approaches to building web applications don't have to require heavyweight front-end JS frameworks, buildsteps, pre-compilers, and enormous downloads.

You can take the same ideas (and standards), apply them directly server side, to gain all that power without serving any of the page weight, without having to maintain all the complexity, and without breaking accessibility/SEO/client-side performance.

**Server Components is still in its early stages, and subject to change!** The core functionality is all in place and working though, and it should be stable and ready to play around with whenever you are.

## Why does this exist?

Server Components is designed for anybody building web pages who wants to build on the web natively, with all its built-in accessibility, performance and SEO benefits, not floating on a wobbly JavaScript layer on top.

For 90% of web sites, you don't need the core of your app to run purely inside big ultra-flashy web-breaking client-side JavaScript. Many of us have been doing so not because our sites need to because server side rendering isn't enough to deliver our core experience, but because JS frameworks offer the best developer experience.

Tools like React, Ember, Angular and friends make building web pages a delight. That's because they've been in a great place to discover and develop better approaches to building and managing UI complexity though, not because they're running client-side. We've conflated the two.

We can fix this. We can take those same ideas and designs (critically, the key element they all agree on: composing applications together from many standalone elements), and get the magic and maintainability on the server side too, without the costs.

Server Components is an attempt to do that, by supporting the Web Components spec (the W3C work pulling out the core magic of these frameworks into a standard) in server-side Node.js.

#### Example:

```javascript
<html>
<head>

<social-media-meta-tags name="My Profile Page" image="./social-media-image.png" ></social-media-tags>

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

## Caveats

Server Components is building on the Web Components specs, but really almost entirely the custom elements spec. HTML Imports are out of scope initially (although it's interesting to think about what that might look like on the server), template tags are supported but are unnecessary really since all DOM is inert here, and the Shadow DOM is challenging and less useful here, so not the main focus right now.

Core DOM functionality now built on [Domino](https://github.com/fgnass/domino), so DOM manipulation comes with Domino's
limitations. File issues if you hit any of these, Domino is aiming to be an accurate representation of the full DOM spec, so there's any serious divergences should probably be fixable upstream.

IE 8 and earlier render unknown elements poorly, and will probably render the output of this badly. This is [solvable by hand](https://blog.whatwg.org/supporting-new-elements-in-ie) (although it requires front-end JS), but isn't solved automatically for you here yet.

## Basic Usage

#### Component definition

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

For examples of more complex component definitions, with explanations, take a look at [component-examples.md](component-examples.md) (TODO)

#### Component usage

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

## API Documentation

### Top-level API

#### `components.newElement()`

Creates a returns a new custom HTML element prototype, extending the HTMLElement prototype.

Note that this does *not* register the element. To do that, call serverComponents.registerElement with an element name, and options (typically including the prototype returned here as your 'prototype' value).

This is broadly equivalent to `Object.create(HTMLElement.prototype)` in browser land, and exactly equivalent here to `Object.create(components.dom.HTMLElement.prototype)`. You can call that yourself instead if you like, but it's a bit of a mouthful.

#### `components.registerElement(componentName, options)`

Registers an element, so that it will be used when the given element name is found during parsing.

Element names are required to contain a hyphen (to disambiguate them from existing element names), be entirely lower-case, and not start with a hyphen.

The only option currently supported is 'prototype', which sets the prototype of the given element. This prototype will have its various callbacks called when it is found during document parsing, and properties of the prototype will be exposed within the DOM to other elements there in turn.

This returns the constructor for the new element, so you can construct and insert them into the DOM programmatically if desired.

This is broadly equivalent to `document.registerElement` in browser land.

#### `components.render(html)`

Takes an HTML string, and returns a promise for the HTML string of the rendered result. Server components parses the HTML, and for each registered element within calls its various callbacks (see the Component API) below as it does so.

Unrecognized elements are ignored. When calling the callbacks any returned promises are collected, and this call will not return until all returned promises have completed. If any promises are rejected, the render call will be rejected too.

#### `components.dom`

The DOM object (components.dom) exposes tradition DOM objects (normally globally available in browsers) such as the CustomEvent and various HTMLElement classes, typically use inside your component implementations.

This is (very) broadly equivalent to `window` in browser land.

### Component API

These methods are methods you can implement on your component prototype (as returned by `newElement`) before registering your element with `registerElement`. Implementing every method here is optional.

Any methods that are implemented, from this selection or otherwise, will be exposed on your element in the DOM during rendering. I.e. you can call `document.querySelector("my-element").setTitle("New Title")` and to call the `setTitle` method on your object, which can then potentially change how your component is rendered.

#### `yourComponent.createdCallback()`

Called when an element is created, with `this` set as the element itself. If you need the document you're being rendered into, use `this.ownerDocument`.

**This is where you put your magic!** Rewrite the elements contents to dynamically generate what your users will actually see client side. Read configuration from attributes or the initial child nodes to create flexible reconfigurable reusable elements. Register for events to create elements that interact with the rest of the application structure. Build your page.

If this callback returns a promise, the rendering process will not resolve until that promise does, and will fail if that promise fails. You can use this to perform asynchronous actions without your component definitions. Pull tweets from twitter and draw them into the page, or anything else you can imagine.

These callbacks are called in opening tag order, so a parent's createdCallback is called, then each of its children's, then its next sibling element.

#### `yourComponent.attachedCallback()`

Called when the element is attached to the DOM. This is different to when it's created when your component is being built programmatically, not through HTML parsing. *Not yet implemented*

#### `yourComponent.detachedCallback`

Called when the element is removed from the DOM. *Not yet implemented*

#### `yourComponent.attributeChangedCallback`

Called when an attribute of the element is added, changed, or removed. *Not yet implemented*.

**So far only the createdCallback is implemented here, as the others are less relevant initially for the key simpler cases. Each of those will be coming in time though! Watch this space.**

## Plugins

TODO - Static, Express

## Progress

- [x] Allow definition of components
- [x] Render components, triggering the createdCallback and allowing component transformation
- [x] Allow attribute access
- [x] Allow asynchronous rendering
- [x] Allow associating behaviour with component nodes
- [x] Sensibly expose failures in components
- [x] Find a clean way to expose useful dom globals (e.g. Event/CustomEvent)
- [x] Only allow components with '-' in the name (as on the front-end)
- [x] Publish on NPM
- [x] Work out approaches for loading resources (CSS/images) from components ([PostCSS](https://github.com/outpunk/postcss-modules)?)
- [x] Document how to use this in detail
- [ ] Move this TODO list to Github issues
- [ ] Announce a bit, to get some feedback and traction
- [ ] Debug mode: enable per-component to log initial & resulting HTML and all DOM events
- [ ] Check element.attributes behaviour is correct (and usable)
- [ ] Allow programmatic component creation & trigger attachedCallbacks
- [ ] Allow rendering of document fragments (not just whole documents)
- [ ] Support type extension elements
- [ ] Document differences with real web components
- [ ] Come up with easy patterns to build external easily registered custom element plugins (`serverComponents.use(require('my-element'))`?)
- [ ] Make it easy to integrate server components with a data-binding templating library (e.g. mustache)
- [ ] Make it easy to integrate with Express as a view engine
- [ ] Write a selection of useful components to start with
- [ ] Tests with some common example implementation of existing web components
- [ ] Create transparent front-end support (i.e. translate back to normal web components API internally)
