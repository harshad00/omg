const labels = document.querySelectorAll('.form-control label')

labels.forEach(label => {
    label.innerHTML = label.innerText
        .split('')
        .map((letter, index) => `<span style="transition-delay:${index * 40}ms">${letter}</span>`)
        .join('')
})
// mobile numbrr
document.getElementById('numberInput')
.addEventListener('input', function() {
    // Remove non-numeric characters
    this.value = this.value.replace(/\D/g, '');

    // Limit the input to 10 characters
    if (this.value.length < 10) {
        this.setCustomValidity('Minimum 10 digits required.');
      } else if (this.value.length > 10) {
        this.value = this.value.slice(0, 10);
        this.setCustomValidity('Maximum 10 digits allowed.');
      } else {
        this.setCustomValidity('');
      }
    });

    // password
    document.getElementById("registrationForm").addEventListener("submit", function(event) {
      var passwordInput = document.getElementById("passwordInput");
      var passwordError = document.getElementById("passwordError");
      var password = passwordInput.value;
      
      if (password.length < 5 || password.length > 18) {
          passwordError.textContent = "Password must be between 5 and 18 characters";
          event.preventDefault(); // Prevent form submission
      } else {
          passwordError.textContent = ""; // Clear previous error message
      }
  });
   