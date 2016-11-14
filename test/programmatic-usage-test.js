"use strict";
var expect = require('chai').expect;

var customElements = require("../src/index.js");

describe("Programmatic usage", () => {

    // Pending until we decide what we want from this
    it("returns the element constructor from the registration call", () => {
        class NewElement extends customElements.HTMLElement {}
        customElements.define("test-element", NewElement);

        var klass = customElements.customElements.get("test-element");
        expect(klass).to.equal(NewElement);
    });
});
