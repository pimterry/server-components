var expect = require('chai').expect;

var serverComponents = require("../src/index.js");

describe("Server components", () => {
    it("does nothing with vanilla HTML", () => {
        var input = "<html><head></head><body><div></div></body></html>";
        var output = serverComponents.render(input);
        expect(output).to.equal(input);
    });

    it("replaces components with their rendered result", () => {
        var NewElement = serverComponents.newElement();
        NewElement.createdCallback = function () { this.innerHTML = "hi there"; };
        serverComponents.registerElement("my-element", { prototype: NewElement });

        var output = serverComponents.render("<html><head></head><body><my-element></my-element></body></html>");

        expect(output).to.equal("<html><head></head><body><my-element>hi there</my-element></body></html>");
    });
});