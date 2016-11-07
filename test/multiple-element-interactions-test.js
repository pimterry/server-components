var expect = require('chai').expect;

var components = require("../src/index.js");

describe("When multiple DOM elements are present", () => {
    describe("nested elements", () => {
        it("are rendered correctly", () => {
            var PrefixedElement = components.newElement();
            PrefixedElement.createdCallback = function () {
                this.innerHTML = "prefix:" + this.innerHTML;
            };
            components.registerElement("prefixed-element", {
                prototype: PrefixedElement
            });

            return components.renderFragment(
                "<prefixed-element><prefixed-element>existing-content</prefixed-element></prefixed-element>"
            ).then((output) => {
                expect(output).to.equal(
                    "<prefixed-element>prefix:<prefixed-element>prefix:existing-content</prefixed-element></prefixed-element>"
                );
            });
        });
    });

    describe("parent elements", () => {
        it("can see child elements", () => {
            var ChildCountElement = components.newElement();
            ChildCountElement.createdCallback = function () {
                var newNode = this.doc.createElement("div");
                newNode.textContent = this.childNodes.length + " children";
                this.insertBefore(newNode, this.firstChild);
            };
            components.registerElement("child-count", { prototype: ChildCountElement });

            return components.renderFragment(
                "<child-count><div>A child</div><div>Another child</div></child-count>"
            ).then((output) => {
                expect(output).to.equal(
                    "<child-count><div>2 children</div><div>A child</div><div>Another child</div></child-count>"
                );
            });
        });

        // Pending until we implement custom elements v1
        xit("can read attributes from custom child element's prototypes", () => {
            var DataSource = components.newElement();
            DataSource.data = [1, 2, 3];
            components.registerElement("data-source", { prototype: DataSource });

            var DataDisplayer = components.newElement();
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
            components.registerElement("data-displayer", { prototype: DataDisplayer });

            return components.renderFragment(
                "<data-displayer><data-source></data-source></data-displayer>"
            ).then((output) => {
                expect(output).to.equal(
                    "<data-displayer>Data: [1,2,3]</data-displayer>"
                );
            });
        });

        it("receive bubbling events from child elements", () => {
            var EventRecorder = components.newElement();
            EventRecorder.createdCallback = function (document) {
                var resultsNode = document.createElement("p");
                this.appendChild(resultsNode);

                this.addEventListener("my-event", (event) => {
                    resultsNode.innerHTML = "Event received";
                });
            };
            components.registerElement("event-recorder", { prototype: EventRecorder });

            var EventElement = components.newElement();
            EventElement.createdCallback = function () {
                this.dispatchEvent(new components.dom.CustomEvent('my-event', {
                    bubbles: true
                }));
            };
            components.registerElement("event-source", { prototype: EventElement });

            return components.renderFragment(
                "<event-recorder><event-source></event-source></event-recorder>"
            ).then((output) => {
                expect(output).to.equal(
                    "<event-recorder><event-source></event-source><p>Event received</p></event-recorder>"
                );
            });
        });
    });
});
