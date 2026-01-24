/**
 * Hospital Login JavaScript
 */

const API_BASE = 'api/';

function handleLogin(event) {
  event.preventDefault();
  
  const form = document.getElementById('loginForm');
  const errorDiv = document.getElementById('errorMessage');
  const hospitalID = document.getElementById('hospitalID').value.trim();
  const password = document.getElementById('password').value;
  
  // Clear previous error
  errorDiv.classList.remove('show');
  errorDiv.textContent = '';
  
  // Show loading state
  form.classList.add('loading');
  
  // Create form data
  const formData = new FormData();
  formData.append('hospitalID', hospitalID);
  formData.append('password', password);
  
  // Send login request
  fetch(API_BASE + 'hospital_login.php', {
    method: 'POST',
    credentials: 'same-origin',
    body: formData
  })
  .then(response => response.json())
  .then(result => {
    form.classList.remove('loading');
    
    if (result.success) {
      // Redirect to dashboard
      window.location.href = 'dashboard.html';
    } else {
      // Show error message
      errorDiv.textContent = result.message || 'Login failed. Please try again.';
      errorDiv.classList.add('show');
    }
  })
  .catch(error => {
    form.classList.remove('loading');
    console.error('Login error:', error);
    errorDiv.textContent = 'An error occurred. Please try again.';
    errorDiv.classList.add('show');
  });
}
