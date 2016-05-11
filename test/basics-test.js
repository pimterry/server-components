var expect = require('chai').expect;

var components = require("../src/index.js");

function body(content) {
    return "<html><head></head><body>" + content + "</body></html>";
}

describe("Basic component functionality", () => {
    it("does nothing with vanilla HTML", () => {
        var input = body("<div></div>");

        return components.render(input).then((output) => {
            expect(output).to.equal(input);
        });
    });

    it("replaces components with their rendered result", () => {
        var NewElement = components.newElement();
        NewElement.createdCallback = function () { this.textContent = "hi there"; };
        components.registerElement("my-element", { prototype: NewElement });

        return components.render(body("<my-element></my-element>")).then((output) => {
            expect(output).to.equal(body("<my-element>hi there</my-element>"));
        });
    });

    it("can wrap existing content", () => {
        var PrefixedElement = components.newElement();
        PrefixedElement.createdCallback = function () {
            this.innerHTML = "prefix:" + this.innerHTML;
        };
        components.registerElement("prefixed-element", {
            prototype: PrefixedElement
        });

        return components.render(body(
            "<prefixed-element>existing-content</prefixed-element>"
        )).then((output) => {
            expect(output).to.equal(
                body("<prefixed-element>prefix:existing-content</prefixed-element>")
            );
        });
    });

    it("allows attribute access", () => {
        var BadgeElement = components.newElement();
        BadgeElement.createdCallback = function () {
            var name = this.getAttribute("name");
            this.innerHTML = "My name is: <div class='name'>" + name + "</div>";
        };
        components.registerElement("name-badge", { prototype: BadgeElement });

        return components.render(
            body('<name-badge name="Tim Perry"></name-badge>')
        ).then((output) => {
            expect(output).to.equal(body(
                '<name-badge name="Tim Perry">My name is: <div class="name">Tim Perry</div></name-badge>'
            ));
        });
    });
});
