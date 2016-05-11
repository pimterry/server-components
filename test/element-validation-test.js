var expect = require('chai').expect;

var serverComponents = require("../src/index.js");

describe("Custom element validation", () => {
    it("requires a non-empty name", () => {
        var InvalidElement = serverComponents.newElement();
        expect(() => {
            serverComponents.registerElement("", { prototype: InvalidElement });
        }).to.throw(
            /Registration failed for ''. Missing element name./
        );
    });

    it("requires a hyphen in the element name", () => {
        var InvalidElement = serverComponents.newElement();
        expect(() => {
            serverComponents.registerElement("invalidname", { prototype: InvalidElement });
        }).to.throw(
            /Registration failed for 'invalidname'. Custom element names must contain a hyphen./
        );
    });

    it("doesn't allow elements to start with a hyphen", () => {
        var InvalidElement = serverComponents.newElement();
        expect(() => {
            serverComponents.registerElement("-invalid-name", { prototype: InvalidElement });
        }).to.throw(
            /Registration failed for '-invalid-name'. Custom element names must not start with a hyphen./
        );
    });

    it("requires element names to be lower case", () => {
        var InvalidElement = serverComponents.newElement();
        expect(() => {
            serverComponents.registerElement("INVALID-NAME", { prototype: InvalidElement });
        }).to.throw(
            /Registration failed for 'INVALID-NAME'. Custom element names must not contain uppercase ASCII characters./
        );
    });
});
