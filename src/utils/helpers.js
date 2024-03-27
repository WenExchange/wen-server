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

module.exports = {
  wait,
  getISOString
};
