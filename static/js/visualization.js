// Function to handle button clicks
function handleExampleButtonClick(event) {
  // Remove active class from all buttons
  document.querySelectorAll('.example-button').forEach(btn => {
    btn.classList.remove('is-active');
  });
  
  // Add active class to clicked button
  event.target.classList.add('is-active');
  
  // Get example number
  const exampleNum = event.target.dataset.example;
  
  // Update iframe source
  const container = document.getElementById('example-container');
  container.innerHTML = `<iframe src="visualization/example_${exampleNum}/example.html" 
                               style="width: 100%; height: 1100px; border: none;"></iframe>`;  
}

// Initialize visualization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add click handlers to all example buttons
  document.querySelectorAll('.example-button').forEach(button => {
    button.addEventListener('click', handleExampleButtonClick);
  });

  // Auto-select first example on page load
  document.querySelector('.example-button').click();
});

