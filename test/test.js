var expect = require('chai').expect;

var serverComponents = require("../src/index.js");

function bodyWrapped(content) {
    return "<html><head></head><body>" + content + "</body></html>";
}

describe("Server components", () => {
    it("does nothing with vanilla HTML", () => {
        var input = bodyWrapped("<div></div>");
        var output = serverComponents.render(input);
        expect(output).to.equal(input);
    });

    it("replaces components with their rendered result", () => {
        var NewElement = serverComponents.newElement();
        NewElement.createdCallback = function () { this.innerHTML = "hi there"; };
        serverComponents.registerElement("my-element", { prototype: NewElement });

        var output = serverComponents.render(bodyWrapped("<my-element></my-element>"));

        expect(output).to.equal(bodyWrapped("<my-element>hi there</my-element>"));
    });
});