import { test, expect, beforeAll } from "vitest";
import demo from "../demo.html?raw";

beforeAll(async () => {
	let main = new DOMParser().parseFromString(demo, "text/html").querySelector("main");
	document.body.innerHTML = main.innerHTML;
	await import("../heading-anchors.js");
});

function parts(id) {
	let heading = document.getElementById(id);
	let placeholder = heading.querySelector(".ha-placeholder");
	let anchor = heading.nextElementSibling;
	let label = anchor?.querySelector(".ha-visualhide");
	let visible = anchor?.querySelector(":scope > [aria-hidden]");
	return { placeholder, anchor, label, visible };
}

test("Default content is #", () => {
	let { placeholder, anchor, label, visible } = parts("heading-2");
	expect(placeholder.textContent).toBe("#");
	expect(visible.textContent).toBe("#");
	expect(anchor.getAttribute("href")).toBe("#heading-2");
	expect(label.textContent).toBe("Jump to section titled: Heading 2");
});

test("data-ha-exclude skips a heading", () => {
	let { placeholder, anchor } = parts("heading-2c");
	expect(placeholder).toBeNull();
	expect(anchor.classList.contains("ha")).toBe(false);
});

test("prefix changes the accessible text", () => {
	expect(parts("i18n").label.textContent).toBe("Ir a la sección titulada: Internationalized accessible link text");
});

test("content attribute is plain text in both places", () => {
	let { placeholder, visible } = parts("glyph");
	expect(placeholder.textContent).toBe("&");
	expect(visible.textContent).toBe("&");
});

test("Empty content attribute renders nothing", () => {
	let { placeholder, visible } = parts("fontawesome-heading");
	expect(placeholder.hasChildNodes()).toBe(false);
	expect(visible).toBeNull();
});

test("Template content is cloned identically into placeholder and link", () => {
	let { placeholder, visible } = parts("icon");
	let svg = placeholder.querySelector("svg");
	expect(svg.querySelector("use").getAttribute("href")).toBe("#fas-fa-link");
	expect(visible.innerHTML).toBe(placeholder.innerHTML);
	expect(placeholder.getAttribute("aria-hidden")).toBe("true");
	expect(visible.getAttribute("aria-hidden")).toBe("true");
});

test("Heading text and prefix are escaped in the label", () => {
	let wrapper = document.createElement("div");
	wrapper.innerHTML = `<heading-anchors prefix="<b>Jump</b> to"><h2 id="escaped">Using <code>&lt;b&gt;</code></h2></heading-anchors>`;
	document.body.append(wrapper);

	let { label } = parts("escaped");
	expect(label.textContent).toBe("<b>Jump</b> to: Using <b>");
	expect(label.children.length).toBe(0);
});

test("Custom elements in template content upgrade in both places", () => {
	class TestIcon extends HTMLElement {}
	customElements.define("test-icon", TestIcon);

	let wrapper = document.createElement("div");
	wrapper.innerHTML = `<heading-anchors><template data-ha-content><test-icon></test-icon></template><h2 id="custom">Custom</h2></heading-anchors>`;
	document.body.append(wrapper);

	let { placeholder, visible } = parts("custom");
	let icons = [placeholder.querySelector("test-icon"), visible.querySelector("test-icon")];
	expect(icons.every(icon => icon instanceof TestIcon)).toBe(true);
	expect(icons[0]).not.toBe(icons[1]);
});
