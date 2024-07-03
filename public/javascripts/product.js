
  document.getElementById('addVariant').addEventListener('click', function() {
    var variantsContainer = document.getElementById('variantsContainer');

    // Create a new div for the variant
    var newVariantDiv = document.createElement('div');
    newVariantDiv.className = 'variant';

    // Create new input fields
    var newSizeInput = document.createElement('input');
    newSizeInput.type = 'text';
    newSizeInput.name = 'variantSize[]';
    newSizeInput.placeholder = 'Size';

    var newColorInput = document.createElement('input');
    newColorInput.type = 'text';
    newColorInput.name = 'variantColor[]';
    newColorInput.placeholder = 'Color';

    var newPriceInput = document.createElement('input');
    newPriceInput.type = 'number';
    newPriceInput.name = 'variantPrice[]';
    newPriceInput.placeholder = 'Price';

    var newStockQuantityInput = document.createElement('input');
    newStockQuantityInput.type = 'number';
    newStockQuantityInput.name = 'variantStockQuantity[]';
    newStockQuantityInput.placeholder = 'Stock Quantity';

    var newAvailabilitySelect = document.createElement('select');
    newAvailabilitySelect.name = 'variantAvailability[]';
    newAvailabilitySelect.placeholder = 'Availability';

    var trueOption = document.createElement('option');
    trueOption.value = 'true';
    trueOption.text = 'Available';

    var falseOption = document.createElement('option');
    falseOption.value = 'false';
    falseOption.text = 'Not Available';

    newAvailabilitySelect.appendChild(trueOption);
    newAvailabilitySelect.appendChild(falseOption);

    // Append the new input fields to the variant div
    newVariantDiv.appendChild(newSizeInput);
    newVariantDiv.appendChild(newColorInput);
    newVariantDiv.appendChild(newPriceInput);
    newVariantDiv.appendChild(newStockQuantityInput);
    newVariantDiv.appendChild(newAvailabilitySelect);

    // Append the new variant div to the variants container
    variantsContainer.appendChild(newVariantDiv);
  });
