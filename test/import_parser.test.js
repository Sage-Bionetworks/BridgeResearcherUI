import { expect } from 'chai';
import parser from '../app/src/import_parser';

describe("import_parser", function() {
  it("splits simple records", () => {
    let results = parser("A , B , , C");
    expect(results.length).to.equal(3);
    expect(results[0].externalId).to.equal("A");
    expect(results[1].externalId).to.equal("B");
    expect(results[2].externalId).to.equal("C");
  })
  it("parses external ID = password records", () => {
    let results = parser("extId=password,C=D,E=F");
    expect(results.length).to.equal(3);
    expect(results[0].externalId).to.equal("extId");
    expect(results[0].password).to.equal("password");
    expect(results[1].externalId).to.equal("C");
    expect(results[1].password).to.equal("D");
    expect(results[2].externalId).to.equal("E");
    expect(results[2].password).to.equal("F");
  });
  it("parses multi field records", () => {
    let results = parser('firstName="Alx Dark" externalId="B" password="C", '+
      'firstName="Tim Powers" externalId=C password=D');
    expect(results.length).to.equal(2);

    let obj1 = results[0];
    expect(obj1.firstName).to.equal("Alx Dark");
    expect(obj1.externalId).to.equal("B");
    expect(obj1.password).to.equal("C");

    let obj2 = results[1];
    expect(obj2.firstName).to.equal("Tim Powers");
    expect(obj2.externalId).to.equal("C");
    expect(obj2.password).to.equal("D");
  });
  it("adds password if missing", () => {
    let results = parser('firstName=Alx');
    expect(results[0].firstName).to.equal("Alx");
    expect(results[0].password.length).to.equal(32);

    let results2 = parser('B,C');
    expect(results2[0].password.length).to.equal(32);
    expect(results2[1].password.length).to.equal(32);
  });
  it("is not confused by special characters", () => {
    let results = parser('firstName="Alx, Dark"');
    expect(results.length).to.equal(1);
    expect(results[0].firstName).to.equal("Alx, Dark");
    expect(results[0].password.length).to.equal(32);
  });
});