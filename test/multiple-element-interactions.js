var expect = require('chai').expect;

var ServerComponents = require("../src/index.js");

function body(content) {
    return "<html><head></head><body>" + content + "</body></html>";
}

describe("When multiple DOM elements are present", () => {
    describe("nested elements", () => {
        it("are rendered correctly", () => {
            var PrefixedElement = ServerComponents.newElement();
            PrefixedElement.createdCallback = function () {
                this.innerHTML = "prefix:" + this.innerHTML;
            };
            ServerComponents.registerElement("prefixed-element", {
                prototype: PrefixedElement
            });

            return ServerComponents.render(body(
                "<prefixed-element><prefixed-element>existing-content</prefixed-element></prefixed-element>"
            )).then((output) => {
                expect(output).to.equal(body(
                    "<prefixed-element>prefix:<prefixed-element>prefix:existing-content</prefixed-element></prefixed-element>"
                ));
            });
        });
    });

    describe("parent elements", () => {
        it("can see child elements", () => {
            var ChildCountElement = ServerComponents.newElement();
            ChildCountElement.createdCallback = function () {
                var newNode = this.doc.createElement("div");
                newNode.textContent = this.childNodes.length + " children";
                this.insertBefore(newNode, this.firstChild);
            };
            ServerComponents.registerElement("child-count", { prototype: ChildCountElement });

            return ServerComponents.render(body(
                "<child-count><div>A child</div><div>Another child</div></child-count>"
            )).then((output) => {
                expect(output).to.equal(body(
                    "<child-count><div>2 children</div><div>A child</div><div>Another child</div></child-count>"
                ));
            });
        });

        it("can read attributes from custom child element's prototypes", () => {
            var DataSource = ServerComponents.newElement();
            DataSource.data = [1, 2, 3];
            ServerComponents.registerElement("data-source", { prototype: DataSource });

            var DataDisplayer = ServerComponents.newElement();
            DataDisplayer.createdCallback = function () {
                return new Promise((resolve) => {
                    // Has to be async, as child node prototypes aren't set: http://stackoverflow.com/questions/36187227/
                    // This is a web components limitation generally. TODO: Find a nicer pattern for handle this.
                    setTimeout(() => {
                        var data = this.childNodes[0].data;
                        this.textContent = "Data: " + JSON.stringify(data);
                        resolve();
                    }, 0);
                });
            };
            ServerComponents.registerElement("data-displayer", { prototype: DataDisplayer });

            return ServerComponents.render(body(
                "<data-displayer><data-source></data-source></data-displayer>"
            )).then((output) => {
                expect(output).to.equal(body(
                    "<data-displayer>Data: [1,2,3]</data-displayer>"
                ));
            });
        });

        it("receive bubbling events from child elements", () => {
            var EventRecorder = ServerComponents.newElement();
            EventRecorder.createdCallback = function () {
                var resultsNode = this.ownerDocument.createElement("p");
                this.appendChild(resultsNode);

                this.addEventListener("my-event", (event) => {
                    resultsNode.innerHTML = "Event received";
                });
            };
            ServerComponents.registerElement("event-recorder", { prototype: EventRecorder });

            var EventElement = ServerComponents.newElement();
            EventElement.createdCallback = function () {
                this.dispatchEvent(new ServerComponents.dom.CustomEvent('my-event', {
                    bubbles: true
                }));
            };
            ServerComponents.registerElement("event-source", { prototype: EventElement });

            return ServerComponents.render(body(
                "<event-recorder><event-source></event-source></event-recorder>"
            )).then((output) => {
                expect(output).to.equal(body(
                    "<event-recorder><event-source></event-source><p>Event received</p></event-recorder>"
                ));
            });
        });
    });
});
