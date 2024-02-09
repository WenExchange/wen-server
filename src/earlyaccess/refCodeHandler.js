
const voucher_codes = require('voucher-code-generator');
const fs = require('fs/promises');

const createUniqueRefCode = async () => {
    try {
        let refCodeJson = await fs.readFile("referralcode.json", "utf-8")
        refCodeJson = JSON.parse(refCodeJson)

        const codes = refCodeJson.codes
        
        let isValid = true
        let code = ""
        while (isValid) {
            console.log("555");
            code = voucher_codes.generate({
                length: 6,
                count: 1,
                charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            })[0];
            if (!codes.includes(code)) isValid = false
        }

        const newCodes = [...codes, code]

        await fs.writeFile("referralcode.json",JSON.stringify({
            codes: newCodes
        }))

        return code
    } catch (error) {
        console.error(error.message)
    }
}

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
    createUniqueRefCode,
    createRefCode
}
