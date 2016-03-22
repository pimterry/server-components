var expect = require('chai').expect;

var serverComponents = require("../src/index.js");

function body(content) {
    return "<html><head></head><body>" + content + "</body></html>";
}

describe("Server components", () => {
    it("does nothing with vanilla HTML", () => {
        var input = body("<div></div>");
        var output = serverComponents.render(input);
        expect(output).to.equal(input);
    });

    it("replaces components with their rendered result", () => {
        var NewElement = serverComponents.newElement();
        NewElement.createdCallback = function () { this.innerHTML = "hi there"; };
        serverComponents.registerElement("my-element", { prototype: NewElement });

        var output = serverComponents.render(body("<my-element></my-element>"));

        expect(output).to.equal(body("<my-element>hi there</my-element>"));
    });

    it("can wrap existing content", () => {
        var PrefixedElement = serverComponents.newElement();
        PrefixedElement.createdCallback = function () { this.innerHTML = "prefix:" + this.innerHTML; };
        serverComponents.registerElement("prefixed-element", { prototype: PrefixedElement });

        var output = serverComponents.render(body("<prefixed-element>existing-content</prefixed-element>"));

        expect(output).to.equal(body("<prefixed-element>prefix:existing-content</prefixed-element>"));
    });

    it("allows nested elements", () => {
        var PrefixedElement = serverComponents.newElement();
        PrefixedElement.createdCallback = function () { this.innerHTML = "prefix:" + this.innerHTML; };
        serverComponents.registerElement("prefixed-element", { prototype: PrefixedElement });

        var output = serverComponents.render(body("<prefixed-element><prefixed-element>existing-content</prefixed-element></prefixed-element>"));

        expect(output).to.equal(body("<prefixed-element>prefix:<prefixed-element>prefix:existing-content</prefixed-element></prefixed-element>"));
    });
});