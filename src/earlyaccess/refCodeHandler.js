
const voucher_codes = require('voucher-code-generator');


const createRefCode = () => {
    try {

        let code = voucher_codes.generate({
            length: 6,
            count: 1,
            charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        })[0]
      
        return code
    } catch (error) {
        console.error(error.message)
    }
}

module.exports = {
    createRefCode
}
