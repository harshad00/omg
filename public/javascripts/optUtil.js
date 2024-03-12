// otpUtil.js
const otpGenerator = require('otp-generator');

function generateOTP() {
    return otpGenerator.generate(4, { digits: true, upperCase: false, specialChars: false, alphabets: false });
}

module.exports = generateOTP;
