# Sarum Martinmas and octave biography match — v304

Ora shares the source-backed biography of Saint Martin of Tours between the Roman and Traditional readings. The Roman commemoration is titled `Saint Martin of Tours, Bishop`, but the Traditional calendar uses different wording:

- November 11: `Martinmas / Saint Martin's Lent`
- November 18: `Octave Day of St. Martin`

The original common matcher was `/Martin of Tours/i`, which did not recognize either Sarum phrase. The Traditional mode now uses a rite-specific alias matcher while keeping exactly the same source, biography, and 50-word length limit. The Roman calendar retains its own match. This change does **not** alter the calendar, the Martinmas fast, or the precedence of Sundays and other feasts. The app still checks the selected date and primary observance before displaying the biography.
