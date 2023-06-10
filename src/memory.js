const sha1 = require("sha1");
const MemoryStorage = require("memorystorage");
const { faker } = require("@faker-js/faker/locale/tr");

const myStorage = new MemoryStorage("kolayca-teslimat");

(() => {
  let users = [];

  for (let i = 1000; i < 10000; i++) {
    users.push({
      id: i,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phoneNumber: `555444${i}`,
      balanceAmount: 0,
      // token: faker.string.alphanumeric(32),
      token: sha1(`555444${i}`)
    });
  }

  myStorage.setItem("users", users);
})();

(() => {
  let packages = [];

  for (let i = 1; i <= 100; i++) {
    let pos = faker.location.nearbyGPSCoordinate({
      origin: [37.214994, 28.363613],
      radius: 1,
      isMetric: true
    });

    packages.push({
      id: i,
      responsibleUserId: null,
      typeName: "Standart Teslimat",
      status: "Bekleniyor",
      price: Number(faker.finance.amount(10, 100, 2)),
      description: `${i}. pakete dair açıklama`,
      photo: null,
      position: {
        latitude: pos[0],
        longitude: pos[1]
      },
      sender: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phoneNumber: faker.phone.number(),
        city: faker.location.city(),
        district: faker.location.county(),
        address: faker.location.streetAddress(),
        postalCode: faker.location.zipCode()
      },
      receiver: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phoneNumber: faker.phone.number(),
        city: faker.location.city(),
        district: faker.location.county(),
        address: faker.location.streetAddress(),
        postalCode: faker.location.zipCode()
      }
    });
  }

  myStorage.setItem("packages", packages);
})();

module.exports = myStorage;
