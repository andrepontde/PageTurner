const paymentForm = document.getElementById('paymentForm');

paymentForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  //Validate form fields
  const cardNumber = document.getElementById('cardNumber').value.trim();
  const expiryDate = document.getElementById('expiryDate').value.trim();
  const cvv = document.getElementById('cvv').value.trim();
  const cardHolder = document.getElementById('cardHolder').value.trim();

  if (!cardNumber || !expiryDate || !cvv || !cardHolder) {
    alert('Please fill in all fields.');
    return;
  }

  // Simulate payment success and proceed to checkout
  alert('Payment successful!');
  await fetch('/api/checkout', { method: 'POST' });
  window.location.href = 'user.html'; // Redirect to user page after checkout
});
