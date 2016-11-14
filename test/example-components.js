"use strict";
var expect = require('chai').expect;
var components = require("../src/index.js");

var linkify = require("linkifyjs/element");

describe("An example component:", () => {
    beforeEach(() => {
        components.customElements.reset();
    });

    describe("using static rendering", () => {
        beforeEach(() => {
            class StaticElement extends components.HTMLElement {
                connectedCallback() {
                    this.innerHTML = "Hi there";
                }
            }
            components.customElements.define("my-greeting", StaticElement);
        });

        it("replaces its content with the given text", () => {
            return components.renderFragment("<my-greeting></my-greeting>").then((output) => {
                expect(output).to.equal("<my-greeting>Hi there</my-greeting>");
            });
        });
    });

    describe("using dynamic logic for rendering", () => {
        beforeEach(() => {
            var currentCount = 0;

            class CounterElement extends components.HTMLElement {
                connectedCallback() {
                    currentCount += 1;
                    this.innerHTML = "There have been " + currentCount + " visitors.";
                }
            }
            components.customElements.define("visitor-counter", CounterElement);
        });

        it("dynamically changes its content", () => {
            components.renderFragment("<visitor-counter></visitor-counter>");
            components.renderFragment("<visitor-counter></visitor-counter>");
            components.renderFragment("<visitor-counter></visitor-counter>");

            return components.renderFragment("<visitor-counter></visitor-counter>").then((output) => {
                expect(output).to.equal(
                    "<visitor-counter>There have been 4 visitors.</visitor-counter>"
                );
            });
        });
    });

    describe("parameterised by HTML content", () => {
        beforeEach(() => {
            class LinkifyElement extends components.HTMLElement {
                connectedCallback(document) {
                    // Delegate the whole thing to a real front-end library!
                    linkify(this, { target: () => null, linkClass: "autolinked" }, document);
                }
            }
            components.customElements.define("linkify-urls", LinkifyElement);
        });

        it("should be able to parse and manipulate it's content", () => {
            return components.renderFragment(
                "<linkify-urls>Have you heard of www.facebook.com?</linkify-urls>"
            ).then((output) => expect(output).to.equal(
                '<linkify-urls>Have you heard of <a href="http://www.facebook.com" class="autolinked">www.facebook.com</a>?</linkify-urls>'
            ));
        });
    });
});
