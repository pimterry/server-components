var expect = require('chai').expect;

var serverComponents = require("../src/index.js");

function body(content) {
    return "<html><head></head><body>" + content + "</body></html>";
}

describe("An asynchronous element", () => {
    it("blocks rendering until they complete", () => {
        var SlowElement = serverComponents.newElement();
        SlowElement.createdCallback = function () {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    this.textContent = "loaded!";
                    resolve();
                }, 1);
            });
        };
        serverComponents.registerElement("slow-element", { prototype: SlowElement });

        return serverComponents.render(body("<slow-element></slow-element>")).then((output) => {
            expect(output).to.equal(body("<slow-element>loaded!</slow-element>"));
        });
    });

    it("throw an async error if a component fails to render synchronously", () => {
        var FailingElement = serverComponents.newElement();
        FailingElement.createdCallback = () => { throw new Error(); };
        serverComponents.registerElement("failing-element", { prototype: FailingElement });

        return serverComponents.render(
            body("<failing-element></failing-element>")
        ).then((output) => {
            throw new Error("Should not successfully render");
        }).catch(() => { /* All good. */ });
    });

    it("throw an async error if a component fails to render asynchronously", () => {
        var FailingElement = serverComponents.newElement();
        FailingElement.createdCallback = () => Promise.reject(new Error());
        serverComponents.registerElement("failing-element", { prototype: FailingElement });

        return serverComponents.render(
            body("<failing-element></failing-element>")
        ).then((output) => {
            throw new Error("Should not successfully render");
        }).catch(() => { /* All good */ });
    });
});
