"use strict";
var expect = require('chai').expect;

var components = require("../src/index.js");

describe("Programmatic usage", () => {

    // Pending until we decide what we want from this
    it("returns the element constructor from the registration call", () => {
        class NewElement extends components.HTMLElement {}
        components.define("test-element", NewElement);

        var klass = components.get("test-element");
        expect(klass).to.equal(NewElement);
    });
});
