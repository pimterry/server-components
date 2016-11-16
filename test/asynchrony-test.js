"use strict";
var expect = require('chai').expect;

var components = require("../src/index.js");

describe("An asynchronous element", () => {
    beforeEach(() => {
        components.reset();
    });

    it("blocks rendering until they complete", () => {
        class SlowElement extends components.HTMLElement {
            connectedCallback() {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        this.textContent = "loaded!";
                        resolve();
                    }, 1);
                });
            }
        }
        components.define("slow-element", SlowElement);

        return components.renderFragment("<slow-element></slow-element>").then((output) => {
            expect(output).to.equal("<slow-element>loaded!</slow-element>");
        });
    });

    it("throw an async error if a component fails to render synchronously", () => {
        class FailingElement extends components.HTMLElement {
            connectedCallback() {
                throw new Error();
            }
        }
        components.define("failing-element", FailingElement);

        return components.renderFragment(
            "<failing-element></failing-element>"
        ).then((output) => {
            throw new Error("Should not successfully render");
        }).catch(() => { /* All good. */ });
    });

    it("throw an async error if a component fails to render asynchronously", () => {
        class FailingElement extends components.HTMLElement {
            connectedCallback() {
                return Promise.reject(new Error());
            }
        }
        components.define("failing-element", FailingElement);

        return components.renderFragment(
            "<failing-element></failing-element>"
        ).then((output) => {
            throw new Error("Should not successfully render");
        }).catch(() => { /* All good */ });
    });
});
