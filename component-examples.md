# Component examples

This page is a series of examples of increasing levels of complexity of component.

This list is still a work in progress, with broad outlines for functionality in some cases rather than completed examples. Every example in here is very buildable though right now, and the full examples will fill out here shortly.

Have a minute? Have a go at building one of the extras and filling this out yourself!

## Static rendering

The simplest web component just acts as a simple placeholder for some static content.

With the web component below, rendering `<my-greeting></my-greeting>` will result in
`<my-greeting>Hi there</my-greeting>`.

```javascript
var customElements = require("server-components");

class StaticElement extends customElements.HTMLElement {
    connectedCallback() {
        this.innerHTML = "Hi there"
    }
}
customElements.define("my-greeting", StaticElement);
```

This is very basic, and toy cases like this aren't immediately useful, but this can be helpful for standard
chunks of boilerplate that you need to include repeatedly.

Static page footers or sets of standard static meta tags can be easily swapped out, so you can ignore
all their cruft entirely and focus on the real content of your page.

As a more reusable example, you could create a `<country-selector><country-selector>` component, which
rendered a select dropdown with a list of every country.

## Dynamic rendering

Slightly more interesting web components emerge when we consider rendering dynamic content. A simple
example is below: a visitor counter. All the rage in the 90s, with web components these can make a
comeback!

```javascript
var customElements = require("server-components");

var currentCount = 0;

class CounterElement extends customElements.HTMLElement {
    connectedCallback() {
        currentCount += 1;
        this.innerHTML = "There have been " + currentCount + " visitors.";
    }
}
customElements.define("visitor-counter", CounterElement);
```

After a few visitors, this will render `<visitor-counter></visitor-counter>` into something like
`<visitor-counter>There have been 435 visitors</visitor-counter>`.

Some caveats:

* Storage here is just in a variable, not any persistent storage outside the server process, so this
counter will get reset whenever we restart the server.

* We count every time the component is rendered as a page load. If you have this component on the same
page repeatedly you'll be double counting.

## Parameterising components via attributes

TODO: A component that renders a QR code

`<qr-code url="http://google.com"></qr-code>`

becomes

`<qr-code url="http://google.com><img src="data:image/gif;base64,R0lGODlhEAAQAM..."></img></qr-code>"`

## Parameterising components via content

Components can be parameterized in all sorts of ways. One interesting pattern is to wrap some normal HTML content in a component, and use that to transform the content.

For example, you might want a component that wraps HTML, parses all the text within, and replaces URL strings with actual links (using the excellent [Linkify library](https://github.com/SoapBox/linkifyjs), but here in a server side DOM, not a real one):

```javascript
var customElements = require("server-components");
var linkify = require("linkifyjs/element");

class LinkifyElement extends customElements.HTMLElement {
    connectedCallback() {
        // Delegate the whole thing to a real front-end library!
        linkify(this, { target: () => null, linkClass: "autolinked" }, document);
    }
}
customElements.define("linkify-urls", LinkifyElement);
```

With this, we can pass HTML into Server Components that looks like

```html
<linkify-urls>Have you heard of www.facebook.com?</linkify-urls>
```

and then serve up to our users:

```html
<linkify-urls>
    Have you heard of
    <a href="http://www.facebook.com" class="autolinked">www.facebook.com</a>?
</linkify-urls>
```

## Loading external data

TODO: A component that queries twitter, and renders the output to the page

`<recent-tweets max=10></recent-tweets>`

## Including client-side content

TODO: An element that renders social media icons, from  its own set of bundled icons

`<social-media-icons twitter="pimterry"></social-media-icons>`

becomes

```html
<social-media-icons twitter="pimterry">
  <a href="http://twitter.com/pimterry">
    <img src="/components/social-media-icons/twitter.png" alt="My Twitter" />
  </a>
</social-media-icons>


## Element interactions through DOM properties

TODO: A component that renders a table of contents from the headings on the page

```html
<table-of-contents></table-of-contents>

<h1>Newsflash!</h1>
...
<h2>A subtitle</h2>
...
<h3>More news</h3>
...
<h2>And even more!</h2>
```

becomes

```html
<table-of-contents>
    <ol>
        <li>
            <a href="#h1-1">Newsflash</a>
            <ol>
                <li>
                    <a href="#h2-1">A subheading</a>
                    <ol>
                        <li><a href="#h3-1">More news</a></li>
                    </ol>
                </li>
                <li><a href="#h2-2">And even more!</a></li>
            </ol>
        </li>
    </ol>
</table-of-contents>

<h1 id='h1-1'>Newsflash!</h1>
...
<h2 id='h2-1'>A subheading</h2>
...
<h3 id='h3-1'>More news</h3>
...
<h2 id='h2-2'>And even more!</h2>
```


## Element interactions through events

TODO: A component that listens for content, and a series of subcomponents that load external data
and trigger DOM events when it arrives.

```html
<item-feed>
    <twitter-item-source username="pimterry"></twitter-item-source>
    <bbc-news-item-source></bbc-news-item-source>
    <rss-feed-item-source url="http://example.com/feed.xml"></rss-feed-item-source>
</item-feed>
```
