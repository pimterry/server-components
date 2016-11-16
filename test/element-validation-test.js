"use strict";
var expect = require('chai').expect;

var components = require("../src/index.js");

describe("Custom element validation", () => {
    it("requires a non-empty name", () => {
        class InvalidElement {}
        expect(() => {
            components.define("", InvalidElement);
        }).to.throw(
            /The element name '' is not valid./
        );
    });

    it("requires a hyphen in the element name", () => {
        class InvalidElement {}
        expect(() => {
            components.define("invalidname", InvalidElement);
        }).to.throw(
            /The element name 'invalidname' is not valid./
        );
    });

    it("doesn't allow elements to start with a hyphen", () => {
        class InvalidElement {}
        expect(() => {
            components.define("-invalid-name", InvalidElement);
        }).to.throw(
            /The element name '-invalid-name' is not valid./
        );
    });

    it("requires element names to be lower case", () => {
        class InvalidElement {}
        expect(() => {
            components.define("INVALID-NAME", InvalidElement);
        }).to.throw(
            /The element name 'INVALID-NAME' is not valid./
        );
    });
});
