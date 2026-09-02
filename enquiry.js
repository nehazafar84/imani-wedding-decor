const form = document.getElementById('quoteForm');
const note = document.getElementById('formNote');
const button = document.querySelector('#quoteForm button[type="submit"]');

function setFormMessage(message, type = 'info') {
  if (!note) return;
  note.textContent = message;
  note.dataset.state = type;
}

function normalisePhone(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function isPhoneReasonable(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

if (form && note && button) {
  const dateField = document.getElementById('date');
  if (dateField) {
    const today = new Date();
    const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    dateField.min = localToday;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (button.disabled) return;

    const nameField = document.getElementById('name');
    const phoneField = document.getElementById('phone');
    const emailField = document.getElementById('email');
    const guestField = document.getElementById('guests');

    const name = nameField.value.trim();
    const phone = normalisePhone(phoneField.value);
    const email = emailField ? emailField.value.trim() : '';
    const guestValue = guestField.value;

    if (name.length < 2) {
      setFormMessage('Please enter your name.', 'error');
      nameField.focus();
      return;
    }

    if (!isPhoneReasonable(phone)) {
      setFormMessage('Please enter a valid phone number, including the area or country code if needed.', 'error');
      phoneField.focus();
      return;
    }

    if (email && !emailField.checkValidity()) {
      setFormMessage('Please enter a valid email address, or leave the email field blank.', 'error');
      emailField.focus();
      return;
    }

    if (guestValue && (Number(guestValue) < 1 || Number(guestValue) > 10000)) {
      setFormMessage('Please enter a guest count between 1 and 10,000.', 'error');
      guestField.focus();
      return;
    }

    button.disabled = true;
    button.textContent = 'Sending...';
    setFormMessage('Please wait while we send your enquiry.', 'info');

    const payload = {
      name,
      phone,
      email,
      event_type: document.getElementById('event').value,
      event_date: dateField.value || null,
      venue: document.getElementById('venue').value.trim(),
      guest_count: guestValue ? Number(guestValue) : null,
      budget: document.getElementById('budget').value,
      message: document.getElementById('message').value.trim()
    };

    try {
      const response = await fetch('https://lgdhudhsorazcjhtisrs.supabase.co/functions/v1/submit-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Request failed');

      form.reset();
      if (dateField) dateField.min = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
      setFormMessage('Thank you — your enquiry has been sent successfully. Imani Events can now review your details.', 'success');
      button.textContent = 'Enquiry sent';

      setTimeout(() => {
        button.disabled = false;
        button.textContent = 'Send enquiry';
      }, 3000);
    } catch (error) {
      console.error(error);
      setFormMessage('Sorry, we could not send your enquiry right now. Please check your connection and try again.', 'error');
      button.disabled = false;
      button.textContent = 'Send enquiry';
    }
  });
}
