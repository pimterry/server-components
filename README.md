# Server Components

An dumb simple component framework for server-side rendering, based on web components.

This is a proof of concept right now, to look at using web components for structure on the server-side, not just the client-side.

Going to be quite hacky, serious fully web-component compatible support is probably blocked on
https://github.com/tmpvar/jsdom/issues/1030, and I expect JSDom performance will block quite a bit of this for any serious use
for quite a while.

## Motivation

Web components are a way of composing isolated logic components of UI together. This is useful on the client-side, but is equally
relevant on the server, where we often want to compose views together too.

Existing templating languages focus mostly on how data is bound to individual elements on the page. Support for composition
typically works only at a string level, inserting blocks of strings on demand, without meaningful structure. You can see
this in Jade's [mixins](http://jade-lang.com/reference/mixins/) & [includes](http://jade-lang.com/reference/includes/)),
Mustache's [partials](https://mustache.github.io/mustache.5.html#Partials).

Some tools do support this, but only with very heavy-weight approaches, and almost entirely only on the client-side.

Server Components is solving this: it's a minimal tool to compose together your application UI.

It doesn't dynamically build templates from data (although you can easily layer a typical templating language on top to do so). It
doesn't allow any logic in templates whatsoever. It allows you to compose together components (who in turn can contain whatever
logic internally they'd like).

This is currently aiming to be structurally the same as front-end custom elements, with the minimal changes required
to make this work outside a full DOM environment. In principle, this should mean you can take a server-side component and
render it client-side with no changes (but this is early stages, there's some basic string replacement needed right now,
and generally YMMV).

This is not attempting to polyfill HTML Imports (although it potentially could as an import mechanism in future? Interesting
idea, not sure if that's important), Template tags (unnecessary; all DOM is inert server-side) or the Shadow DOM (technically
challenging, and less useful server-side).

## Usage

```javascript
// Define and register an element somewhere

var NewElement = serverComponents.newElement();

NewElement.createdCallback = function () {
    this.innerHTML = "Hi there";
};

serverComponents.registerElement("my-new-element", { prototype: NewElement });

// Later, render an HTML document that references that element

var output = serverComponents.render(`
    <html>
    <head></head>
    <body>
        <my-new-element></my-new-element>
    </body>
    </html>
`);

// Output = "<html><head></head><body><my-new-element>Hi there</my-new-element></body></html>"
```

Larger motivating example:

```javascript
<html>
<body>
<section>
    <feed id="major-content">
        <manual-source icon="./blog-icon" source="blog-posts" />
        <manual-source icon="./talk-icon" source="talks-given" />
        <manual-source icon="./project-icon" source="project-events" />
    </feed>
</section>

<section>
    <feed id="minor-events">
        <twitter-source />
        <github-source include="PullRequest" />
    </feed>
</section>

<section>
    <carousel>
        <slidedeck-source    icon="./slides-icon" format="image" />
        <manual-image-source icon="./slides-icon" source="slidesets" />
    </carousel>
    <carousel>
        <manual-image-source icon="./video-icon" source="talk-videos" />
        <manual-image-source icon="./photo-icon" source="talk-photos" />
    </carousel>
</section>
</body>
</html>
```

## Progress

- [x] Allow definition of components
- [x] Render components, triggering the createdCallback and allowing component transformation
- [ ] Trigger attachedCallbacks
- [ ] Allow attribute access
- [ ] Allow rendering of document fragments (not just whole documents)
- [ ] Only allow components with '-' in the name (as on the front-end)
- [ ] Document differences with real web components
- [ ] Publish on NPM
- [ ] Make it easy to build external easily registered custom element plugins (`serverComponents.use(require('my-element'))`?)
- [ ] Make it easy to integrate server components with a data-binding templating library (e.g. mustache)
- [ ] Make it easy to integrate with Express as a view engine
- [ ] Include a selection of useful components to start with
- [ ] Tests with some common example implementation of existing web components
- [ ] Add transparent front-end support (i.e. translate back to normal web components API internally)