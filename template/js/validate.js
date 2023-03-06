export function validatePassword(passwordInput, confirmPasswordInput) {
  if (passwordInput.value !== confirmPasswordInput.value) {
    confirmPasswordInput.focus();
    alert("Passwords do not match");
  } 
}

export function checkPasswordStrength(passwordInput) {
  const password = passwordInput.value;

  if (password.length < 8) {
    passwordInput.focus();
    alert( "Password should be at least 8 characters long");
  } else if (!password.match(/[A-Z]/)) {
    passwordInput.focus();
    alert("Password should contain at least one uppercase letter");
  } else if (!password.match(/[0-9]/)) {
    passwordInput.focus();  
    alert("Password should contain at least one number");
  } 
}
