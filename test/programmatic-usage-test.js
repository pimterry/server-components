var expect = require('chai').expect;

var serverComponents = require("../src/index.js");

describe("Programmatic usage", () => {
    it("returns the element constructor from the registration call", () => {
        var NewElement = serverComponents.newElement();
        var registrationResult = serverComponents.registerElement("my-element", { prototype: NewElement });
        expect(NewElement.constructor).to.equal(registrationResult);
    });
});
