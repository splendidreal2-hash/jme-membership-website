const modal = document.getElementById('order-modal');
const form = document.getElementById('order-form');
const closeBtn = document.querySelector('.close');
const statusBox = document.getElementById('checkout-status');
const submitBtn = document.querySelector('.checkout-submit');

const packages = {
  'Membership 1': { label: 'Membership 1', price: '399.99', display: '$399.99' },
  'Membership 2': { label: 'Membership 2', price: '849.89', display: '$849.89' },
  'VIP Membership 3': { label: 'VIP Membership 3', price: '1200.00', display: '$1,200.00' }
};

document.querySelectorAll('.order-button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.getElementById('package').value = btn.dataset.package;
    document.getElementById('price').value = btn.dataset.price;
    statusBox.textContent = 'Continue to Noctra secure hosted checkout. Your card details will be entered on the provider page.';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.querySelector('#order-form input[name="name"]').focus();
  });
});

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}
closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const selected = packages[data.get('package')];
  if (!selected) {
    statusBox.textContent = 'Please select a valid JME membership package.';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Connecting securely…';
  statusBox.textContent = 'Creating your secure hosted checkout…';

  try {
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: String(data.get('name')).trim(),
        customerEmail: String(data.get('email')).trim(),
        packageId: data.get('package')
      })
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok && typeof result.checkoutUrl === 'string') {
      const checkoutUrl = new URL(result.checkoutUrl);
      if (checkoutUrl.protocol !== 'https:') throw new Error('The payment provider returned an invalid secure checkout link.');
      window.location.assign(checkoutUrl.href);
      return;
    }
    statusBox.textContent = result.message || 'Secure card checkout is not connected yet. No payment has been taken. Please contact JME management for an update.';
  } catch (error) {
    statusBox.textContent = error.message || 'Checkout could not be reached. No payment has been taken. Please try again later or contact JME management.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'JOIN & PAY';
  }
});

document.getElementById('year').textContent = new Date().getFullYear();
