var expect = require('chai').expect;

var serverComponents = require("../src/index.js");

function body(content) {
    return "<html><head></head><body>" + content + "</body></html>";
}

describe("Server components", () => {
    it("does nothing with vanilla HTML", () => {
        var input = body("<div></div>");

        return serverComponents.render(input).then((output) => {
            expect(output).to.equal(input);
        });
    });

    it("replaces components with their rendered result", () => {
        var NewElement = serverComponents.newElement();
        NewElement.createdCallback = function () { this.textContent = "hi there"; };
        serverComponents.registerElement("my-element", { prototype: NewElement });

        return serverComponents.render(body("<my-element></my-element>")).then((output) => {
            expect(output).to.equal(body("<my-element>hi there</my-element>"));
        });
    });

    it("can wrap existing content", () => {
        var PrefixedElement = serverComponents.newElement();
        PrefixedElement.createdCallback = function () { this.innerHTML = "prefix:" + this.innerHTML; };
        serverComponents.registerElement("prefixed-element", { prototype: PrefixedElement });

        return serverComponents.render(body(
            "<prefixed-element>existing-content</prefixed-element>"
        )).then((output) => {
            expect(output).to.equal(body("<prefixed-element>prefix:existing-content</prefixed-element>"));
        });
    });

    it("allows nested elements", () => {
        var PrefixedElement = serverComponents.newElement();
        PrefixedElement.createdCallback = function () { this.innerHTML = "prefix:" + this.innerHTML; };
        serverComponents.registerElement("prefixed-element", { prototype: PrefixedElement });

        return serverComponents.render(body(
            "<prefixed-element><prefixed-element>existing-content</prefixed-element></prefixed-element>"
        )).then((output) => {
            expect(output).to.equal(body(
                "<prefixed-element>prefix:<prefixed-element>prefix:existing-content</prefixed-element></prefixed-element>"
            ));
        });
    });

    it("can read from nested elements", () => {
        var ChildCountElement = serverComponents.newElement();
        ChildCountElement.createdCallback = function () {
            var newNode = this.doc.createElement("div");
            newNode.textContent = this.childNodes.length + " children";
            this.insertBefore(newNode, this.firstChild);
        };
        serverComponents.registerElement("child-count", { prototype: ChildCountElement });

        return serverComponents.render(body(
            "<child-count><div>A child</div><div>Another child</div></child-count>"
        )).then((output) => {
            expect(output).to.equal(body(
                "<child-count><div>2 children</div><div>A child</div><div>Another child</div></child-count>"
            ));
        });
    });

    it("allows asynchronous rendering", () => {
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

    it("exposes methods on custom elements", () => {
        var DataSource = serverComponents.newElement();
        DataSource.data = [1, 2, 3];
        serverComponents.registerElement("data-source", { prototype: DataSource });

        var DataDisplayer = serverComponents.newElement();
        DataDisplayer.createdCallback = function () {
            return new Promise((resolve) => {
                // Has to be async, as child node prototypes aren't set: http://stackoverflow.com/questions/36187227/
                // TODO: Find a nicer way to handle this.
                setTimeout(() => {
                    var data = this.childNodes[0].data;
                    this.textContent = "Data: " + JSON.stringify(data);
                    resolve();
                }, 0);
            })
        };
        serverComponents.registerElement("data-displayer", { prototype: DataDisplayer });

        return serverComponents.render(body(
            "<data-displayer><data-source></data-source></data-displayer>"
        )).then((output) => {
            expect(output).to.equal(body(
                "<data-displayer>Data: [1,2,3]</data-displayer>"
            ));
        });
    });

    it("allows attribute access", () => {
        var BadgeElement = serverComponents.newElement();
        BadgeElement.createdCallback = function () {
            var name = this.getAttribute("name");
            this.innerHTML = "My name is: <div class='name'>" + name + "</div>";
        };
        serverComponents.registerElement("name-badge", { prototype: BadgeElement });

        return serverComponents.render(body('<name-badge name="Tim Perry"></name-badge>')).then((output) => {
            expect(output).to.equal(body(
                '<name-badge name="Tim Perry">My name is: <div class="name">Tim Perry</div></name-badge>'
            ));
        });
    });

    it("throws an async error if any components fail to render synchronously", () => {
        var FailingElement = serverComponents.newElement();
        FailingElement.createdCallback = () => { throw new Error() };
        serverComponents.registerElement("failing-element", { prototype: FailingElement });

        return serverComponents.render(body("<failing-element></failing-element>")).then((output) => {
            throw new Error("Should not successfully render");
        }).catch(() => {});
    });

    it("throws an async error if any components fail to render asynchronously", () => {
        var FailingElement = serverComponents.newElement();
        FailingElement.createdCallback = () => { return Promise.reject(new Error()) };
        serverComponents.registerElement("failing-element", { prototype: FailingElement });

        return serverComponents.render(body("<failing-element></failing-element>")).then((output) => {
            throw new Error("Should not successfully render");
        }).catch(() => {});
    });
});