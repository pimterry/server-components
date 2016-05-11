var expect = require('chai').expect;

var components = require("../src/index.js");

describe("Programmatic usage", () => {
    it("returns the element constructor from the registration call", () => {
        var NewElement = components.newElement();
        var registrationResult = components.registerElement("my-element", { prototype: NewElement });
        expect(NewElement.constructor).to.equal(registrationResult);
    });
});
