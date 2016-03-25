# Server Components [![Travis Build Status](https://img.shields.io/travis/pimterry/server-components.svg)](https://travis-ci.org/pimterry/server-components)

An simple & lightweight component framework for Node.js server-side rendering, based on web components.

This is a proof of concept right now, to look at using web components for structure on the server-side, not just the client-side.

Composable flexible and powerful approaches to building web applications don't have to require heavyweight front-end JS frameworks,
buildsteps, pre-compilers, and enormous downloads. We can take the same ideas (and standards), apply them directly server side,
and gain all that power without the page weight.

## Motivation

```javascript
<html>
<head>

<social-media-tags name="My Page" image="./social-media-image" ></social-media-tags>

</head>
<body>
<h1>What am I up to?</h1>

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

Web components are a way of composing isolated logic components of UI together. This is useful on the client-side, but is equally
relevant on the server, where we often want to compose views together too.

Existing templating languages focus mostly on how data is bound to individual elements on the page, and composing together
elements is something of an after thought. See Mustache's [partials](https://mustache.github.io/mustache.5.html#Partials),
for example, which provide no isolation and no ability to parameterize their use whatsoever, or Mustache's
[functions](https://github.com/janl/mustache.js/#functions) and Jade's [mixins](http://jade-lang.com/reference/mixins/),
which can take basic parameters, but can only really provide basic string transformations. Templating libraries rarely let you
introspect or interact with the rest of the content they're given, as web components can on the front-end. This simple but powerful
change opens the possibility to compose together interacting & easily configurable components (see the motivating example above).

Fundamentally these limitations exist because templating libraries typically work purely on flat string. They're given content
that often defines a clear structure (an HTML DOM hierarchy), but they rarely interpret and use that, throwing away the semantics
and structure of what they're given.

This isn't everywhere: a few tools do do this somewhat better, but only with more heavy-weight approaches, almost entirely
only on the client-side, and diverging substantially from the existing custom elements standard for this. That's all great
if you want to commit to a big framework in which to build your huge single page app, but if you want an simple light-weight
works-without-javascript easily-accessible fast way to build websites, you need a small standalone tool to render your page
server-side. You don't need a whole front-end UI framework, with all the page weight and complexity that brings, just to be
able to define and compose together a page of widgets.

Server Components is solving this: it's a minimal tool to compose together your application UI on the server side.

It doesn't dynamically build templates from data (although you can easily layer a typical templating language on top to do so). It
doesn't allow any logic in templates whatsoever. It allows you to compose together components (who in turn can contain whatever
logic internally they'd like).

This is currently aiming to be structurally the same as front-end custom elements, with the minimal changes required
to make this work in Node, outside the traditional DOM environment. In principle, this compatibility should mean you can take a
server-side component and render it client-side with no changes (but this is early stages, there's some basic find/replace steps
required right now, and generally YMMV).

## Caveats

This is not attempting to polyfill HTML Imports (although it potentially could as an import mechanism in future? Interesting
idea, not sure if that's important), Template tags (unnecessary; all DOM is inert server-side) or the Shadow DOM (technically
challenging, and less useful server-side).

Core DOM functionality now built on [Domino](https://github.com/fgnass/domino), so DOM manipulation comes with Domino's
limitations (no issues so far though).

Full serious web-component compatible support is probably blocked on https://github.com/tmpvar/jsdom/issues/1030, and I
expect JSDom performance will block using that for any serious use for quite a while. Domino perf is much better.

IE 8 and earlier render unknown elements poorly, and will probably render the output of this badly. This is
[solvable](https://blog.whatwg.org/supporting-new-elements-in-ie) in future (although it requires front-end JS), but isn't solved
here quite yet.

## Usage

```javascript
// Define and register an element somewhere

var NewElement = serverComponents.newElement();

NewElement.createdCallback = function () {
    this.innerHTML = "Hi there";
};

serverComponents.registerElement("my-new-element", { prototype: NewElement });

// Later, render an HTML document that references that element

serverComponents.render(`
    <html>
    <head></head>
    <body>
        <my-new-element></my-new-element>
    </body>
    </html>
`).then((output) => {
    // Output = "<html><head></head><body><my-new-element>Hi there</my-new-element></body></html>"
});
```

## Progress

- [x] Allow definition of components
- [x] Render components, triggering the createdCallback and allowing component transformation
- [x] Allow attribute access
- [x] Allow asynchronous rendering
- [x] Allow associating behaviour with component nodes
- [x] Sensibly expose failures in components
- [ ] Only allow components with '-' in the name (as on the front-end)
- [x] Publish on NPM
- [ ] Allow programmatic component creation & trigger attachedCallbacks
- [ ] Allow rendering of document fragments (not just whole documents)
- [ ] Support type extension elements
- [ ] Work out approaches for loading resources (CSS/images) from components
- [ ] Document how to use this in detail
- [ ] Document differences with real web components
- [ ] Make it easy to build external easily registered custom element plugins (`serverComponents.use(require('my-element'))`?)
- [ ] Make it easy to integrate server components with a data-binding templating library (e.g. mustache)
- [ ] Make it easy to integrate with Express as a view engine
- [ ] Write a selection of useful components to start with
- [ ] Tests with some common example implementation of existing web components
- [ ] Create transparent front-end support (i.e. translate back to normal web components API internally)
