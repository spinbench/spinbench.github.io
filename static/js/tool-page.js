let isFirstImage = true;

// Check if example2.png exists
function checkSecondImage() {
  const img = new Image();
  img.onload = function() {
    document.getElementById('switchButton').style.display = 'block';
  };
  img.onerror = function() {
    document.getElementById('switchButton').style.display = 'none';
  };
  img.src = 'example2.png';
}

function toggleImage() {
  const img = document.getElementById('exampleImage');
  if (isFirstImage) {
    img.src = 'example2.png';
  } else {
    img.src = 'example.png';
  }
  isFirstImage = !isFirstImage;
}

// Load metadata from JSON file
function loadMetadata() {
    fetch('metadata.json')
      .then(response => response.json())
      .then(data => {
        const metadataContent = document.getElementById('metadata-content');
        
        // Tool Name
        let html = '<h4 class="is-5">Name:</h3><ul>';
        html += `${data.tool_name}`;
        html += '</ul>';

        // Tool Description
        html += '<h4 class="is-5">Description:</h3><ul>';
        html += `${data.tool_description}`;
        html += '</ul>';

        // Input Types
        html += '<h4 class="is-5">Input types:</h3><ul>';
        for (const [key, value] of Object.entries(data.input_types)) {
          html += `<li><strong>${key}:</strong> ${value}</li>`;
        }
        html += '</ul>';
  
        // Output Type
        // html += `<h4 class="is-5">Output Type:</h3><p>${data.output_type}</p>`;

        // Output Type
        html += '<h4 class="is-5">Output type:</h3><ul>';
        html += `<li>${data.output_type}</li>`;
        html += '</ul>';
  
        // Demo Commands
        html += '<h4 class="is-5">Demo commands:</h3>';
        data.demo_commands.forEach(demo => {
          html += `<div class="box">
            <pre><code>${demo.command}</code></pre>
            <p class="help is-size-6">${demo.description}</p>
          </div>`;
        });
  
        // User Metadata (optional)
        if ('user_metadata' in data && data.user_metadata && Object.keys(data.user_metadata).length > 0) {
            html += '<h4 class="is-5">User metadata:</h3><ul>';
            for (const [key, value] of Object.entries(data.user_metadata)) {
              html += `<li><strong>${key}:</strong> ${JSON.stringify(value)}</li>`;
            }
            html += '</ul>';
        }
  
        metadataContent.innerHTML = html;
      })
      .catch(error => {
        console.error('Error loading metadata:', error);
        document.getElementById('metadata-content').innerHTML = 
          '<p class="has-text-danger">Error loading metadata. Please check the console for details.</p>';
      });
  }
  
  // Initialize everything when page loads
  window.onload = function() {
    checkSecondImage();
    loadMetadata();
  };
