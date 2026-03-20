const multiply = require("../util/multiply");
const get_chai = require("../util/get_chai");

describe("testing multiply", () => {
  it("should give 7*6 is 42", async () => {
    const { expect } = await get_chai();
    expect(multiply(7, 6)).to.equal(42);
  });
  /*   it('should give 7*6 is 97', async () => {
    const {expect} = await get_chai();
    expect(multiply(7,6)).to.equal(97);
  });   */
  it("should multiply positive numbers", async () => {
  const { expect } = await get_chai();
  expect(multiply(3, 5)).to.equal(15);
});

it("should handle zero", async () => {
  const { expect } = await get_chai();
  expect(multiply(0, 10)).to.equal(0);
});

it("should handle negative numbers", async () => {
  const { expect } = await get_chai();
  expect(multiply(-4, 5)).to.equal(-20);
});
});