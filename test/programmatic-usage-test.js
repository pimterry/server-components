"use strict";
var expect = require('chai').expect;

var components = require("../src/index.js");

describe("Programmatic usage", () => {

    // Pending until we decide what we want from this
    xit("returns the element constructor from the registration call", () => {
        class NewElement extends components.HTMLElement {}
        var registrationResult = components.customElements.define("test-element", NewElement);
        expect(NewElement.constructor).to.equal(registrationResult);
    });
});
