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

 function isEthereumAddress(address) {
  // Check if the address is exactly 42 characters long
  if (address.length !== 42) {
      return false;
  }
  
  // Check if the address starts with '0x'
  if (address.substring(0, 2) !== '0x') {
      return false;
  }
  
  // Check if the rest of the address consists of valid hexadecimal characters
  const hexPart = address.substring(2);
  const hexRegex = /^[0-9a-fA-F]+$/;
  
  return hexRegex.test(hexPart);
}

 function isTwitterLink(url) {
  const twitterBaseUrl = 'https://twitter.com/';
  return url.startsWith(twitterBaseUrl);
}

 function isDiscordLink(url) {
  const twitterBaseUrl = 'https://discord.gg/';
  return url.startsWith(twitterBaseUrl);
} 

 function isLink(url) {
  const twitterBaseUrl = 'https://';
  return url.startsWith(twitterBaseUrl);
} 


module.exports = {
  wait,
  getISOString,
  validInteger,
  isEthereumAddress,
  isTwitterLink,
  isDiscordLink,
  isLink
};


