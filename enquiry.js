const form = document.getElementById('quoteForm');
const note = document.getElementById('formNote');
const button = document.querySelector('#quoteForm button[type="submit"]');

if (form && note && button) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    button.disabled = true;
    button.textContent = 'Sending...';
    note.textContent = 'Please wait while we send your enquiry.';

    const guestValue = document.getElementById('guests').value;
    const emailField = document.getElementById('email');

    const payload = {
      name: document.getElementById('name').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: emailField ? emailField.value.trim() : '',
      event_type: document.getElementById('event').value,
      event_date: document.getElementById('date').value || null,
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
      note.textContent = 'Thank you — your enquiry has been sent successfully.';
      button.textContent = 'Enquiry sent';

      setTimeout(() => {
        button.disabled = false;
        button.textContent = 'Send enquiry';
      }, 3000);
    } catch (error) {
      console.error(error);
      note.textContent = 'Sorry, we could not send your enquiry. Please try again.';
      button.disabled = false;
      button.textContent = 'Send enquiry';
    }
  });
}
