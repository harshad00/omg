const otpGenerator = require('otp-generator');

function generateOTP() {
    const otp = otpGenerator.generate(4, { digits: true, upperCase: false, specialChars: false, alphabets: false });

    // Check if OTP consists only of digits (numbers)
    if (/^\d+$/.test(otp)) {
        return otp;
    } else {
        // Regenerate OTP if it doesn't consist only of digits
        return generateOTP();
    }
}

module.exports = generateOTP;
