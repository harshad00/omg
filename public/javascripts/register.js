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
   