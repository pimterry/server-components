"use strict";
var expect = require('chai').expect;

var customElements = require("../src/index.js");

describe("Basic component functionality", () => {
    it("does nothing with vanilla HTML", () => {
        var input = "<div></div>";

        return customElements.renderFragment(input).then((output) => {
            expect(output).to.equal(input);
        });
    });

    it("replaces customElements with their rendered result", () => {
        class NewElement extends customElements.HTMLElement {
            connectedCallback() {
                this.textContent = "hi there";
            }
        }
        customElements.define("my-element", NewElement);

        return customElements.renderFragment("<my-element></my-element>").then((output) => {
            expect(output).to.equal("<my-element>hi there</my-element>");
        });
    });

    it("can wrap existing content", () => {
        class PrefixedElement extends customElements.HTMLElement {
            connectedCallback() {
                this.innerHTML = "prefix:" + this.innerHTML;
            }
        }
        customElements.define("prefixed-element", PrefixedElement);

        return customElements.renderFragment(
            "<prefixed-element>existing-content</prefixed-element>"
        ).then((output) => expect(output).to.equal(
            "<prefixed-element>prefix:existing-content</prefixed-element>"
        ));
    });

    it("allows attribute access", () => {
        class BadgeElement extends customElements.HTMLElement {
            connectedCallback() {
                var name = this.getAttribute("name");
                this.innerHTML = "My name is: <div class='name'>" + name + "</div>";
            }
        }
        customElements.define("name-badge", BadgeElement);

        return customElements.renderFragment(
            '<name-badge name="Tim Perry"></name-badge>'
        ).then((output) => expect(output).to.equal(
            '<name-badge name="Tim Perry">My name is: <div class="name">Tim Perry</div></name-badge>'
        ));
    });

    it("can use normal document methods like QuerySelector", () => {
        class SelfFindingElement extends customElements.HTMLElement {
            connectedCallback(document) {
                var hopefullyThis = document.querySelector("self-finding-element");
                if (hopefullyThis === this) this.innerHTML = "Found!";
                else this.innerHTML = "Not found, found " + hopefullyThis;
            }
        }
        customElements.define("self-finding-element", SelfFindingElement);

        return customElements.renderFragment(
            '<self-finding-element></self-finding-element>'
        ).then((output) => expect(output).to.equal(
            '<self-finding-element>Found!</self-finding-element>'
        ));
    });

    it("wraps content in valid page content, if rendering a page", () => {
        return customElements.renderPage("<empty-div></empty-div>").then((output) => {
            expect(output).to.equal(
                "<html><head></head><body><empty-div></empty-div></body></html>"
            );
        });
    });

    it("strips <html>, <head> and <body> tags, if only rendering a fragment", () => {
        return customElements.renderFragment("<html><body><empty-div><head></head></empty-div></body></html>").then((output) => {
            expect(output).to.equal(
                "<empty-div></empty-div>"
            );
        });
    });
});
