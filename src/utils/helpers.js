function wait(seconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("1 second has passed");
    }, 1000 * seconds);
  });
}

module.exports = {
  wait
};
