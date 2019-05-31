import gen from '../app/src/password_generator.js';
import { expect } from 'chai';

describe("passwordGenerator", () => {
  it("creates a password", () => {
      expect(gen.generatePassword(32)).not.null;
  });
  it("validates password", () => {
    expect(gen.isPasswordValid({}, "abc")).to.be.true;

    expect(gen.isPasswordValid({minLength:8}, "abc")).to.be.false;
    expect(gen.isPasswordValid({minLength:8}, "abcabcabc")).to.be.true;

    expect(gen.isPasswordValid({numericRequired: true}, "abc")).to.be.false;
    expect(gen.isPasswordValid({numericRequired: true}, "abc1")).to.be.true;

    expect(gen.isPasswordValid({symbolRequired: true}, "abc")).to.be.false;
    expect(gen.isPasswordValid({symbolRequired: true}, "abc@")).to.be.true;

    expect(gen.isPasswordValid({lowerCaseRequired: true}, "ABC")).to.be.false;
    expect(gen.isPasswordValid({lowerCaseRequired: true}, "ABCa")).to.be.true;

    expect(gen.isPasswordValid({upperCaseRequired: true}, "abc")).to.be.false;
    expect(gen.isPasswordValid({upperCaseRequired: true}, "abcD")).to.be.true;
  });
});