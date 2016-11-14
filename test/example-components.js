"use strict";
var expect = require('chai').expect;
var customElements = require("../src/index.js");

var linkify = require("linkifyjs/element");

describe("An example component:", () => {
    beforeEach(() => {
        customElements.customElements.reset();
    });

    describe("using static rendering", () => {
        beforeEach(() => {
            class StaticElement extends customElements.HTMLElement {
                connectedCallback() {
                    this.innerHTML = "Hi there";
                }
            }
            customElements.define("my-greeting", StaticElement);
        });

        it("replaces its content with the given text", () => {
            return customElements.renderFragment("<my-greeting></my-greeting>").then((output) => {
                expect(output).to.equal("<my-greeting>Hi there</my-greeting>");
            });
        });
    });

    describe("using dynamic logic for rendering", () => {
        beforeEach(() => {
            var currentCount = 0;

            class CounterElement extends customElements.HTMLElement {
                connectedCallback() {
                    currentCount += 1;
                    this.innerHTML = "There have been " + currentCount + " visitors.";
                }
            }
            customElements.define("visitor-counter", CounterElement);
        });

        it("dynamically changes its content", () => {
            customElements.renderFragment("<visitor-counter></visitor-counter>");
            customElements.renderFragment("<visitor-counter></visitor-counter>");
            customElements.renderFragment("<visitor-counter></visitor-counter>");

            return customElements.renderFragment("<visitor-counter></visitor-counter>").then((output) => {
                expect(output).to.equal(
                    "<visitor-counter>There have been 4 visitors.</visitor-counter>"
                );
            });
        });
    });

    describe("parameterised by HTML content", () => {
        beforeEach(() => {
            class LinkifyElement extends customElements.HTMLElement {
                connectedCallback(document) {
                    // Delegate the whole thing to a real front-end library!
                    linkify(this, { target: () => null, linkClass: "autolinked" }, document);
                }
            }
            customElements.define("linkify-urls", LinkifyElement);
        });

        it("should be able to parse and manipulate it's content", () => {
            return customElements.renderFragment(
                "<linkify-urls>Have you heard of www.facebook.com?</linkify-urls>"
            ).then((output) => expect(output).to.equal(
                '<linkify-urls>Have you heard of <a href="http://www.facebook.com" class="autolinked">www.facebook.com</a>?</linkify-urls>'
            ));
        });
    });
});
