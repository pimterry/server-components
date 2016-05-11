var expect = require('chai').expect;

var components = require("../src/index.js");

describe("Custom element validation", () => {
    it("allows elements without options", () => {
        components.registerElement("my-element");

        return components.render("<my-element></my-element");
    });

    it("requires a non-empty name", () => {
        var InvalidElement = components.newElement();
        expect(() => {
            components.registerElement("", { prototype: InvalidElement });
        }).to.throw(
            /Registration failed for ''. Missing element name./
        );
    });

    it("requires a hyphen in the element name", () => {
        var InvalidElement = components.newElement();
        expect(() => {
            components.registerElement("invalidname", { prototype: InvalidElement });
        }).to.throw(
            /Registration failed for 'invalidname'. Custom element names must contain a hyphen./
        );
    });

    it("doesn't allow elements to start with a hyphen", () => {
        var InvalidElement = components.newElement();
        expect(() => {
            components.registerElement("-invalid-name", { prototype: InvalidElement });
        }).to.throw(
            /Registration failed for '-invalid-name'. Custom element names must not start with a hyphen./
        );
    });

    it("requires element names to be lower case", () => {
        var InvalidElement = components.newElement();
        expect(() => {
            components.registerElement("INVALID-NAME", { prototype: InvalidElement });
        }).to.throw(
            /Registration failed for 'INVALID-NAME'. Custom element names must not contain uppercase ASCII characters./
        );
    });
});
