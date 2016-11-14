"use strict";
var expect = require('chai').expect;

var customElements = require("../src/index.js");

describe("An asynchronous element", () => {
    beforeEach(() => {
        customElements.customElements.reset();
    });

    it("blocks rendering until they complete", () => {
        class SlowElement extends customElements.HTMLElement {
            connectedCallback() {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        this.textContent = "loaded!";
                        resolve();
                    }, 1);
                });
            }
        }
        customElements.define("slow-element", SlowElement);

        return customElements.renderFragment("<slow-element></slow-element>").then((output) => {
            expect(output).to.equal("<slow-element>loaded!</slow-element>");
        });
    });

    it("throw an async error if a component fails to render synchronously", () => {
        class FailingElement extends customElements.HTMLElement {
            connectedCallback() {
                throw new Error();
            }
        }
        customElements.define("failing-element", FailingElement);

        return customElements.renderFragment(
            "<failing-element></failing-element>"
        ).then((output) => {
            throw new Error("Should not successfully render");
        }).catch(() => { /* All good. */ });
    });

    it("throw an async error if a component fails to render asynchronously", () => {
        class FailingElement extends customElements.HTMLElement {
            connectedCallback() {
                return Promise.reject(new Error());
            }
        }
        customElements.define("failing-element", FailingElement);

        return customElements.renderFragment(
            "<failing-element></failing-element>"
        ).then((output) => {
            throw new Error("Should not successfully render");
        }).catch(() => { /* All good */ });
    });
});
