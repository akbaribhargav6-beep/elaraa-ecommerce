// Contact page topic chips (ports the "Inquiry Category" buttons of
// frontend/src/app/contact/page.tsx): picking a chip fills the hidden
// contact[Topic] field that is posted with the form.

const ON = { background: 'var(--gold-deep)', color: 'var(--ivory)', border: '1px solid var(--gold-deep)' };
const OFF = { background: 'white', color: '', border: '1px solid rgba(43,38,32,.15)' };

export function initContactTopics() {
  if (document.body.dataset.topicsBound === '1') return;
  document.body.dataset.topicsBound = '1';
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-topic]');
    if (!chip) return;
    const group = chip.closest('[data-topics]');
    if (!group) return;
    const field = group.querySelector('[data-topic-field]');
    if (field) field.value = chip.dataset.topic;
    group.querySelectorAll('[data-topic]').forEach((el) => {
      const on = el === chip;
      Object.assign(el.style, on ? ON : OFF);
      el.setAttribute('aria-pressed', String(on));
    });
  });
}
