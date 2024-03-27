const dayjs = require("dayjs")

function wait(seconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("1 second has passed");
    }, 1000 * seconds);
  });
}

function getISOString (timestamp = dayjs().unix()) {
  const isoString = dayjs.unix(timestamp).toISOString();
  return isoString

}

function validInteger(value) {
  return value <= Number.MAX_SAFE_INTEGER && value >= Number.MIN_SAFE_INTEGER
}

module.exports = {
  wait,
  getISOString,
  validInteger
};
