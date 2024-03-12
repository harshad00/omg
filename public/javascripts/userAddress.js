document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('userAddressForm');
  
    form.addEventListener('submit', function (event) {
      if (!validateForm()) {
        event.preventDefault();
      }
    });
  
    function validateForm() {
      const userId = document.getElementById('userId').value.trim();
      const street = document.getElementById('street').value.trim();
      const city = document.getElementById('city').value.trim();
      const state = document.getElementById('state').value.trim();
      const zipCode = document.getElementById('zipCode').value.trim();
  
      if (userId === '' || street === '' || city === '' || state === '' || zipCode === '') {
        alert('Please fill out all fields.');
        return false;
      }
  
      // Add more advanced validation if needed
  
      return true;
    }
  });

  //  For add zip code
  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("city").addEventListener("blur", function () {
      const cityInput = document.getElementById("city");
      const zipCodeInput = document.getElementById("zipCode");
      const statenput = document.getElementById("state");

  
      if (cityInput.value.trim() !== "") {
        const apiKey = 'd475885c7d354e9a82d5d1696258830a';
        const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(cityInput.value)}&key=${apiKey}`;
  
        fetch(apiUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            if (data.results && data.results.length > 0) {
              const firstResult = data.results[0];
              // Extract city information, including city code if available
              const cityInfo = {
                city: firstResult.components.city || "",
                cityCode: firstResult.components['ISO_3166-2'] ? firstResult.components['ISO_3166-2'][0] : null,
                zipCode: firstResult.components.postcode || null, 
                state: firstResult.components.state || null
              }
  
              // Use cityInfo as needed, for example, log it to the console
              console.log(cityInfo);
              zipCodeInput.value = cityInfo.zipCode || "";
              statenput.value = cityInfo.state || "";
            }
          })
          .catch(error => console.error('Error fetching data:', error));
      }
    });
  });