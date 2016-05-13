var expect = require('chai').expect;
var components = require("../src/index.js");

var linkify = require("linkifyjs/element");

describe("An example component:", () => {
    describe("using static rendering", () => {
        before(() => {
            var StaticElement = components.newElement();
            StaticElement.createdCallback = function () {
                this.innerHTML = "Hi there";
            };

            components.registerElement("my-greeting", { prototype: StaticElement });
        });

        it("replaces its content with the given text", () => {
            return components.renderFragment("<my-greeting></my-greeting>").then((output) => {
                expect(output).to.equal("<my-greeting>Hi there</my-greeting>");
            });
        });
    });

    describe("using dynamic logic for rendering", () => {
        before(() => {
            var CounterElement = components.newElement();
            var currentCount = 0;

            CounterElement.createdCallback = function () {
                currentCount += 1;
                this.innerHTML = "There have been " + currentCount + " visitors.";
            };

            components.registerElement("visitor-counter", { prototype: CounterElement });
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
        before(() => {
            var LinkifyElement = components.newElement();

            LinkifyElement.createdCallback = function (document) {
                // Delegate the whole thing to a real normal front-end library!
                linkify(this, { target: () => null, linkClass: "autolinked" }, document);
             };

            components.registerElement("linkify-urls", { prototype: LinkifyElement });
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
