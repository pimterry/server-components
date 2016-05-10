var expect = require('chai').expect;

var domino = require("domino");
var serverComponents = require("../src/index.js");

function body(content) {
    return "<html><head></head><body>" + content + "</body></html>";
}

describe("When multiple DOM elements are present", () => {
    describe("nested elements", () => {
        it("are rendered correctly", () => {
            var PrefixedElement = serverComponents.newElement();
            PrefixedElement.createdCallback = function () {
                this.innerHTML = "prefix:" + this.innerHTML;
            };
            serverComponents.registerElement("prefixed-element", {
                prototype: PrefixedElement
            });

            return serverComponents.render(body(
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

        it("can read attributes from custom child element's prototypes", () => {
            var DataSource = serverComponents.newElement();
            DataSource.data = [1, 2, 3];
            serverComponents.registerElement("data-source", { prototype: DataSource });

            var DataDisplayer = serverComponents.newElement();
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
            serverComponents.registerElement("data-displayer", { prototype: DataDisplayer });

            return serverComponents.render(body(
                "<data-displayer><data-source></data-source></data-displayer>"
            )).then((output) => {
                expect(output).to.equal(body(
                    "<data-displayer>Data: [1,2,3]</data-displayer>"
                ));
            });
        });

        it("receive bubbling events from child elements", () => {
            var EventRecorder = serverComponents.newElement();
            EventRecorder.createdCallback = function () {
                var resultsNode = this.ownerDocument.createElement("p");
                this.appendChild(resultsNode);

                this.addEventListener("my-event", (event) => {
                    resultsNode.innerHTML = "Event received";
                });
            };
            serverComponents.registerElement("event-recorder", { prototype: EventRecorder });

            var EventElement = serverComponents.newElement();
            EventElement.createdCallback = function () {
                this.dispatchEvent(new domino.impl.CustomEvent('my-event', {
                    bubbles: true
                }));
            };
            serverComponents.registerElement("event-source", { prototype: EventElement });

            return serverComponents.render(body(
                "<event-recorder><event-source></event-source></event-recorder>"
            )).then((output) => {
                expect(output).to.equal(body(
                    "<event-recorder><event-source></event-source><p>Event received</p></event-recorder>"
                ));
            });
        });
    });
});
