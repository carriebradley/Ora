/* Daily-prayer content: artworks, saint quotations, public-domain prayer texts, prayer flows.
 * Everything here is original curation or public-domain text (Douay-Rheims/Challoner wording for
 * Scripture canticles, Keble 1834 for Phos Hilaron). Extend freely — the app picks by season/date.
 */
const CONTENT = (() => {
  /* ---------- artworks (image + metadata fetched live from Wikipedia by search query) ---------- */
  // tags: advent christmas epiphany lent holyweek easter pentecost marian transfiguration dormition michaelmas nicholas general
  const ART = [
    { t: 'Christ Pantocrator', a: 'Icon, St Catherine’s Monastery, Sinai · 6th c.', tr: 'East', tags: ['general', 'epiphany'], q: 'Christ Pantocrator Sinai icon', p: 'Notice the two faces — one gentle, one severe. Which one is looking at you today?' },
    { t: 'The Holy Trinity', a: 'Andrei Rublev · c. 1411', tr: 'East', tags: ['general', 'pentecost'], q: 'Trinity Andrei Rublev icon', p: 'One chair is empty at the table. Sit in it, and receive the cup.' },
    { t: 'Theotokos of Vladimir', a: 'Byzantine icon · c. 1131', tr: 'East', tags: ['marian', 'advent', 'christmas'], q: 'Theotokos of Vladimir icon', p: 'Cheek to cheek: tenderness as theology. What does the Child ask of her — and of you?' },
    { t: 'Our Lady of Częstochowa', a: 'Icon, Jasna Góra, Poland', tr: 'East', tags: ['marian'], q: 'Our Lady of Czestochowa icon', p: 'The scars on her cheek remain. Bring one of your own wounds to her gaze.' },
    { t: 'The Harrowing of Hell (Anastasis)', a: 'Chora Church, Constantinople · c. 1315', tr: 'East', tags: ['easter', 'holyweek'], q: 'Anastasis fresco Chora Church', p: 'Christ pulls Adam and Eve from their tombs by the wrist. Whom is he pulling you toward?' },
    { t: 'The Transfiguration', a: 'Theophanes the Greek · 15th c.', tr: 'East', tags: ['transfiguration', 'general'], q: 'Transfiguration Theophanes the Greek icon', p: 'The disciples fall; the light does not. Let yourself be undone by glory.' },
    { t: 'The Nativity icon', a: 'Byzantine tradition', tr: 'East', tags: ['christmas'], q: 'Nativity of Jesus icon Byzantine', p: 'The manger is shaped like a tomb. Hold both joy and sorrow in one look.' },
    { t: 'Theophany (Baptism of Christ)', a: 'Byzantine tradition', tr: 'East', tags: ['epiphany'], q: 'Baptism of Christ icon Theophany', p: 'The waters are sanctified by touching him. What in your day wants blessing?' },
    { t: 'Christ Pantocrator, Daphni', a: 'Mosaic, Daphni Monastery · c. 1100', tr: 'East', tags: ['general', 'lent'], q: 'Christ Pantocrator Daphni mosaic', p: 'The gaze is severe and full of mercy at once. Stay under it for a minute.' },
    { t: 'Deësis mosaic', a: 'Hagia Sophia · c. 1261', tr: 'East', tags: ['general', 'advent'], q: 'Deësis mosaic Hagia Sophia', p: 'Mary and John turn toward Christ in intercession. Whom would you name beside them?' },
    { t: 'Hodegetria', a: 'Byzantine icon type', tr: 'East', tags: ['marian'], q: 'Hodegetria icon', p: 'She points to the Way. Where is it pointing today?' },
    { t: 'Dormition of the Theotokos', a: 'Byzantine tradition', tr: 'East', tags: ['dormition', 'marian'], q: 'Dormition of the Mother of God icon', p: 'Christ holds her soul like a swaddled child. Death as birth.' },
    { t: 'Descent of the Holy Spirit', a: 'Byzantine tradition', tr: 'East', tags: ['pentecost'], q: 'Pentecost icon Orthodox', p: 'The seat at the center is empty: the Spirit gathers, the Church is the guest.' },
    { t: 'Archangel Michael', a: 'Byzantine icon', tr: 'East', tags: ['michaelmas'], q: 'Archangel Michael icon', p: 'Courage, not violence. What needs defending in you?' },
    { t: 'The Last Supper', a: 'Leonardo da Vinci · 1495–98', tr: 'West', tags: ['holyweek', 'general'], q: 'The Last Supper Leonardo da Vinci', p: 'Find the moment: “one of you will betray me.” Which disciple are you?' },
    { t: 'Pietà', a: 'Michelangelo · 1498–99', tr: 'West', tags: ['holyweek', 'lent'], q: 'Pietà Michelangelo St Peter’s Basilica', p: 'Her hands are open, not clenched. What would it mean to hold what you cannot save?' },
    { t: 'The Return of the Prodigal Son', a: 'Rembrandt · c. 1669', tr: 'West', tags: ['lent', 'general'], q: 'Return of the Prodigal Son Rembrandt', p: 'One father’s hand is a man’s, the other a woman’s. Rest in the whole embrace.' },
    { t: 'The Calling of Saint Matthew', a: 'Caravaggio · 1599–1600', tr: 'West', tags: ['general'], q: 'Calling of Saint Matthew Caravaggio', p: 'A shaft of light, a pointing hand. Who is being called — and to leave what table?' },
    { t: 'The Annunciation', a: 'Fra Angelico · c. 1440', tr: 'West', tags: ['advent', 'marian'], q: 'Annunciation Fra Angelico San Marco', p: 'The question has been asked; the answer has not yet been given. What are you being asked?' },
    { t: 'Sistine Madonna', a: 'Raphael · 1512', tr: 'West', tags: ['marian', 'advent'], q: 'Sistine Madonna Raphael', p: 'She steps out of the clouds toward you. The two cherubs at the bottom are all of us, looking up.' },
    { t: 'Christ Crucified', a: 'Diego Velázquez · c. 1632', tr: 'West', tags: ['lent', 'holyweek'], q: 'Christ Crucified Velázquez Prado', p: 'Hair across the face, hidden and revealed. Sit with the silence of the cross.' },
    { t: 'Isenheim Altarpiece (Crucifixion)', a: 'Matthias Grünewald · c. 1512–16', tr: 'West', tags: ['lent', 'holyweek'], q: 'Isenheim Altarpiece Grünewald Crucifixion', p: 'Painted for plague patients: a God who bears sores. Which of yours does he share?' },
    { t: 'The Incredulity of Saint Thomas', a: 'Caravaggio · c. 1601–02', tr: 'West', tags: ['easter'], q: 'Incredulity of Saint Thomas Caravaggio', p: 'The wound is a door. What doubt of yours needs to touch it?' },
    { t: 'Supper at Emmaus', a: 'Caravaggio · 1601', tr: 'West', tags: ['easter'], q: 'Supper at Emmaus Caravaggio National Gallery', p: 'They recognize him in the breaking of the bread. Where have you walked beside him unaware?' },
    { t: 'Ghent Altarpiece', a: 'Jan & Hubert van Eyck · 1432', tr: 'West', tags: ['easter', 'general'], q: 'Ghent Altarpiece Adoration of the Mystic Lamb', p: 'All of creation processes to the Lamb. Find your place in the line.' },
    { t: 'The Mystic Nativity', a: 'Sandro Botticelli · 1500', tr: 'West', tags: ['christmas'], q: 'Mystic Nativity Botticelli', p: 'Angels dance above, and on earth men and angels embrace. Heaven and earth are reconciled.' },
    { t: 'Adoration of the Magi', a: 'Gentile da Fabriano · 1423', tr: 'West', tags: ['epiphany'], q: 'Adoration of the Magi Gentile da Fabriano', p: 'Kings kneel. Which of your “kingdoms” is ready to kneel?' },
    { t: 'The Baptism of Christ', a: 'Piero della Francesca · c. 1450', tr: 'West', tags: ['epiphany'], q: 'Baptism of Christ Piero della Francesca', p: 'A still, ordinary river, a still, ordinary man. This is where heaven opens.' },
    { t: 'Saint Francis in Meditation', a: 'Francisco de Zurbarán · c. 1635–39', tr: 'West', tags: ['general', 'lent'], q: 'Saint Francis in Meditation Zurbarán', p: 'A skull, a cord, and a face hidden in the cowl. Where is your own attention directed?' },
    { t: 'The Descent from the Cross', a: 'Rogier van der Weyden · c. 1435', tr: 'West', tags: ['holyweek'], q: 'Descent from the Cross Rogier van der Weyden Prado', p: 'Mary’s body mirrors his in grief. Compassion as shared posture.' },
    { t: 'Pentecost', a: 'El Greco · c. 1600', tr: 'West', tags: ['pentecost'], q: 'Pentecost El Greco Prado', p: 'Flames above every head, and every face turned up. What would you ask the Spirit for?' },
    { t: 'The Resurrection', a: 'Piero della Francesca · c. 1460', tr: 'West', tags: ['easter'], q: 'Resurrection Piero della Francesca Sansepolcro', p: 'The sleepers sleep on as he steps out. What morning are you sleeping through?' },
    { t: 'Christ of Saint John of the Cross', a: 'Salvador Dalí · 1951', tr: 'West', tags: ['lent', 'holyweek'], q: 'Christ of Saint John of the Cross Dalí', p: 'We see the cross from above, as God sees it. What is the view like from there?' },
    { t: 'Holy Trinity', a: 'Masaccio · c. 1427', tr: 'West', tags: ['general'], q: 'Holy Trinity Masaccio Santa Maria Novella', p: 'Below the cross lies a skeleton: “I was what you are; you will be what I am.” How do you hold that?' }
  ];

  /* ---------- quotations: saints recognized by the Catholic Church, East and West ---------- */
  // Wording is a modern English rendering of public-domain translations; each cites the work. tags optional.
  const QUOTES = [
    { s: 'St. Augustine of Hippo', w: 'Confessions I.1', tr: 'West', t: 'You have made us for yourself, O Lord, and our heart is restless until it rests in you.' },
    { s: 'St. Augustine of Hippo', w: 'Confessions X.27', tr: 'West', t: 'Late have I loved you, O Beauty so ancient and so new, late have I loved you! You were within me, and I was outside.' },
    { s: 'St. Augustine of Hippo', w: 'Sermon 169', tr: 'West', t: 'He who created you without you will not save you without you.' },
    { s: 'St. Augustine of Hippo', w: 'Sermon 272', tr: 'West', tags: ['easter'], t: 'Be what you see, and receive what you are.' },
    { s: 'St. Augustine of Hippo', w: 'Homilies on 1 John 7.8', tr: 'West', t: 'Love, and do what you will.' },
    { s: 'St. Augustine of Hippo', w: 'Sermon 43', tr: 'West', t: 'Faith is to believe what you do not see; the reward of this faith is to see what you believe.' },
    { s: 'St. Thomas Aquinas', w: 'Summa Theologiae I, q.1, a.8', tr: 'West', t: 'Grace does not destroy nature but perfects it.' },
    { s: 'St. Thomas Aquinas', w: 'Commentary on the Apostles’ Creed, Prologue', tr: 'West', t: 'Three things are necessary for the salvation of man: to know what he ought to believe, to know what he ought to desire, and to know what he ought to do.' },
    { s: 'St. Benedict of Nursia', w: 'Rule, Prologue', tr: 'West', t: 'Listen carefully, my child, to the master’s instructions, and attend to them with the ear of your heart.' },
    { s: 'St. Benedict of Nursia', w: 'Rule 72', tr: 'West', t: 'Prefer nothing whatever to Christ, and may he bring us all together to everlasting life.' },
    { s: 'St. Bernard of Clairvaux', w: 'On Loving God I.1', tr: 'West', t: 'The reason for loving God is God; the measure of love is to love without measure.' },
    { s: 'St. Jerome', w: 'Commentary on Isaiah, Prologue', tr: 'West', t: 'Ignorance of Scripture is ignorance of Christ.' },
    { s: 'St. Irenaeus of Lyons', w: 'Against Heresies IV.20.7', tr: 'West', t: 'The glory of God is a living man; and the life of man is the vision of God.' },
    { s: 'St. Ignatius of Antioch', w: 'Letter to the Ephesians 15', tr: 'East', t: 'It is better to be silent and be, than to speak and not be.' },
    { s: 'St. Francis of Assisi', w: 'Celano, Second Life 103', tr: 'West', t: 'Let us begin, brothers, to serve the Lord God, for up to now we have done little or nothing.' },
    { s: 'St. Clare of Assisi', w: 'Second Letter to Agnes of Prague', tr: 'West', t: 'Gaze upon him, consider him, contemplate him, as you desire to imitate him.' },
    { s: 'St. Teresa of Ávila', w: 'Bookmark (found in her breviary)', tr: 'West', t: 'Let nothing disturb you, let nothing frighten you. All things pass; God does not change. Patience obtains all things. Whoever has God lacks nothing: God alone suffices.' },
    { s: 'St. Teresa of Ávila', w: 'Life 8.5', tr: 'West', t: 'Prayer is nothing else than an intimate sharing between friends; it means taking time frequently to be alone with him who we know loves us.' },
    { s: 'St. John of the Cross', w: 'Sayings of Light and Love 57', tr: 'West', t: 'In the evening of life, we will be judged on love alone.' },
    { s: 'St. Ignatius of Loyola', w: 'Spiritual Exercises 230', tr: 'West', t: 'Love ought to show itself in deeds more than in words.' },
    { s: 'St. Thérèse of Lisieux', w: 'Story of a Soul, Ms. C', tr: 'West', t: 'For me, prayer is a surge of the heart; it is a simple look turned toward heaven, a cry of gratitude and love in the midst of trial as well as joy.' },
    { s: 'St. Francis de Sales', w: 'Letters', tr: 'West', t: 'Do not wish to be anything but what you are, and try to be that perfectly.' },
    { s: 'St. Faustina Kowalska', w: 'Diary 327', tr: 'West', t: 'Jesus, I trust in you.' },
    { s: 'St. John Henry Newman', w: 'Meditations and Devotions', tr: 'West', t: 'God has created me to do him some definite service; he has committed some work to me which he has not committed to another.' },
    { s: 'St. John Paul II', w: 'Homily, 22 October 1978', tr: 'West', t: 'Do not be afraid! Open wide the doors for Christ.' },
    { s: 'St. John Chrysostom', w: 'Homilies on Matthew 50.3', tr: 'East', t: 'Do you wish to honor the body of Christ? Do not neglect him when he is naked. Do not honor him here in church with silken garments while neglecting him outside, where he is cold and naked.' },
    { s: 'St. John Chrysostom', w: 'Paschal Homily', tr: 'East', tags: ['easter'], t: 'Christ is risen, and the demons are fallen! Christ is risen, and the angels rejoice! Christ is risen, and life reigns!' },
    { s: 'St. Basil the Great', w: 'Homily on Luke 12:18 (“I will tear down my barns”) 7', tr: 'East', t: 'The bread which you do not use is the bread of the hungry; the garment hanging in your wardrobe is the garment of him who is naked; the shoes you do not wear are the shoes of the barefoot.' },
    { s: 'St. Ephrem the Syrian', w: 'Prayer of St. Ephrem', tr: 'East', tags: ['lent'], t: 'O Lord and Master of my life, take from me the spirit of sloth, despondency, lust of power, and idle talk. But give rather the spirit of chastity, humility, patience and love to your servant.' },
    { s: 'St. Gregory of Nazianzus', w: 'Letter 101 to Cledonius', tr: 'East', t: 'What is not assumed is not healed; what is united to God is saved.' },
    { s: 'St. Athanasius of Alexandria', w: 'On the Incarnation 54', tr: 'East', tags: ['christmas'], t: 'He became man that we might become God.' },
    { s: 'St. Maximus the Confessor', w: 'Four Hundred Texts on Love I.1', tr: 'East', t: 'Love is a good disposition of the soul, in which it prefers nothing that exists to the knowledge of God.' },
    { s: 'St. John Climacus', w: 'The Ladder of Divine Ascent, Step 28', tr: 'East', t: 'Prayer is by its nature a dialogue and a union of man with God.' },
    { s: 'St. Anthony the Great', w: 'Sayings of the Desert Fathers', tr: 'East', t: 'Our life and our death is with our neighbor. If we gain our brother, we have gained God; but if we scandalize our brother, we have sinned against Christ.' },
    { s: 'St. John Damascene', w: 'On the Divine Images I.16', tr: 'East', t: 'I do not worship matter; I worship the Creator of matter, who became matter for my sake and willed to take his abode in matter.' },
  ];

  /* ---------- public-domain prayer texts ---------- */
  const T = {
    cross: 'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.',
    lips: 'O Lord, open my lips, and my mouth shall declare your praise.',
    help: 'O God, come to my assistance. O Lord, make haste to help me.',
    glory: 'Glory be to the Father, and to the Son, and to the Holy Spirit; as it was in the beginning, is now, and ever shall be, world without end. Amen.',
    our: 'Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.',
    hail: 'Hail Mary, full of grace, the Lord is with thee; blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.',
    benedictus: 'Blessed be the Lord God of Israel; because he hath visited and wrought the redemption of his people: And hath raised up an horn of salvation to us, in the house of David his servant: As he spoke by the mouth of his holy prophets, who are from the beginning: Salvation from our enemies, and from the hand of all that hate us: To perform mercy to our fathers, and to remember his holy testament, the oath which he swore to Abraham our father, that he would grant to us, that being delivered from the hand of our enemies, we may serve him without fear, in holiness and justice before him, all our days. And thou, child, shalt be called the prophet of the Highest: for thou shalt go before the face of the Lord to prepare his ways: To give knowledge of salvation to his people, unto the remission of their sins: Through the bowels of the mercy of our God, in which the Orient from on high hath visited us: To enlighten them that sit in darkness, and in the shadow of death: to direct our feet into the way of peace.',
    magnificat: 'My soul doth magnify the Lord. And my spirit hath rejoiced in God my Saviour. Because he hath regarded the humility of his handmaid; for behold from henceforth all generations shall call me blessed. Because he that is mighty hath done great things to me; and holy is his name. And his mercy is from generation unto generations, to them that fear him. He hath shewed might in his arm: he hath scattered the proud in the conceit of their heart. He hath put down the mighty from their seat, and hath exalted the humble. He hath filled the hungry with good things; and the rich he hath sent empty away. He hath received Israel his servant, being mindful of his mercy: as he spoke to our fathers, to Abraham and to his seed for ever.',
    nunc: 'Now thou dost dismiss thy servant, O Lord, according to thy word in peace; because my eyes have seen thy salvation, which thou hast prepared before the face of all peoples: a light to the revelation of the Gentiles, and the glory of thy people Israel.',
    blessing: 'May the Lord bless us, protect us from all evil, and bring us to everlasting life. Amen.',
    // Byzantine
    bwg: 'Blessed is our God, always, now and ever, and unto ages of ages. Amen.',
    heavenly: 'O Heavenly King, the Comforter, the Spirit of Truth, who art everywhere present and fillest all things; Treasury of blessings and Giver of life: come and dwell within us, cleanse us from every stain, and save our souls, O Good One.',
    trisagion: 'Holy God, Holy Mighty, Holy Immortal, have mercy on us. Holy God, Holy Mighty, Holy Immortal, have mercy on us. Holy God, Holy Mighty, Holy Immortal, have mercy on us. Glory to the Father, and to the Son, and to the Holy Spirit, now and ever and unto ages of ages. Amen. All-holy Trinity, have mercy on us. Lord, cleanse us from our sins. Master, pardon our iniquities. Holy One, visit and heal our infirmities for thy name’s sake. Lord, have mercy. Lord, have mercy. Lord, have mercy.',
    morningTrop: 'Having risen from sleep, we fall down before thee, O Good One, and sing to thee, O Mighty One, the angelic hymn: Holy, holy, holy art thou, O God; through the Theotokos, have mercy on us.',
    jesus: 'Lord Jesus Christ, Son of God, have mercy on me, a sinner.',
    phos: 'O gladsome light, O grace of God the Father’s face, the eternal splendour wearing; celestial, holy, blest, our Saviour Jesus Christ, joyful in thine appearing. Now, ere day fadeth quite, we see the evening light, our wonted hymn outpouring; Father of might unknown, thee, his incarnate Son, and Holy Ghost adoring. To thee of right belongs all praise of holy songs, O Son of God, Lifegiver; thee, therefore, O Most High, the world doth glorify, and shall exalt forever.',
    lordcried: 'Lord, I have cried to thee, hear me: hearken to my voice, when I cry to thee. Let my prayer be directed as incense in thy sight; the lifting up of my hands as evening sacrifice.',
    vouchsafe: 'Vouchsafe, O Lord, to keep us this evening without sin. Blessed art thou, O Lord, God of our fathers, and praised and glorified is thy name unto the ages. Amen. Let thy mercy, O Lord, be upon us, as we have hoped in thee.',
    theotokion: 'Rejoice, O Virgin Theotokos, Mary full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, for thou hast borne the Saviour of our souls.',
    dismissal: 'Through the prayers of our holy fathers, O Lord Jesus Christ our God, have mercy on us and save us. Amen.',
    // Sarum / Latin-flavoured devotions
    kyrie: 'Lord, have mercy. Christ, have mercy. Lord, have mercy.',
    sarumHelp: 'O God, make speed to save us. O Lord, make haste to help us. Glory be to the Father, and to the Son, and to the Holy Ghost; as it was in the beginning, is now, and ever shall be, world without end. Amen.'
  };

  /* ---------- prayer flows ----------
   * step types: prayer (spoken), canticle, readings, hourlink, quote, art, silence, calendar
   */
  const P = (title, text) => ({ type: 'prayer', title, text });
  const FLOWS = {
    roman: {
      morning: [P('Sign of the Cross', T.cross), P('Opening', T.lips + ' ' + T.glory), { type: 'calendar', title: 'Today in the Church' },
        { type: 'hourlink', title: 'Psalms of the Morning (Lauds)', hour: 'lauds' }, { type: 'readings', title: 'Mass Readings' },
        { type: 'quote', title: 'From the Saints' }, { type: 'silence', title: 'Silence', seconds: 120 }, P('Canticle of Zechariah (Benedictus)', T.benedictus),
        P('Intercessions', 'Lord, I offer you this day: my work, my words, my joys and my sufferings. Bless those I love. Remember the sick, the dying and the lonely, and those who have asked for my prayers.'),
        P('Our Father', T.our), P('Blessing', T.blessing)],
      evening: [P('Sign of the Cross', T.cross), P('Opening', T.help + ' ' + T.glory), { type: 'calendar', title: 'Today in the Church' },
        { type: 'hourlink', title: 'Psalms of the Evening (Vespers)', hour: 'vespers' }, { type: 'art', title: 'Sacred Art' },
        { type: 'silence', title: 'Silence', seconds: 120 }, P('Canticle of Mary (Magnificat)', T.magnificat),
        P('Examen', 'Where was God in this day? For what am I most grateful? Where did I fall short, and where did I feel most alive? What do I ask for tomorrow?'),
        P('Our Father', T.our), P('Hail Mary', T.hail), P('Blessing', T.blessing)]
    },
    byz: {
      morning: [P('Blessing', T.bwg), P('O Heavenly King', T.heavenly), P('Trisagion Prayers', T.trisagion), P('Our Father', T.our), { type: 'calendar', title: 'Today in the Church' },
        P('Morning Troparion', T.morningTrop), { type: 'hourlink', title: 'Orthros (Matins) and the Hours', hour: 'orthros' }, { type: 'readings', title: 'Epistle & Gospel' },
        { type: 'quote', title: 'From the Fathers' }, { type: 'silence', title: 'Jesus Prayer', seconds: 180, text: T.jesus }, P('Dismissal', T.dismissal)],
      evening: [P('Blessing', T.bwg), P('O Heavenly King', T.heavenly), P('Trisagion Prayers', T.trisagion), P('Our Father', T.our), { type: 'calendar', title: 'Today in the Church' },
        P('Lord, I Have Cried', T.lordcried), P('Phos Hilaron — O Gladsome Light', T.phos), P('Vouchsafe, O Lord', T.vouchsafe), { type: 'art', title: 'Icon' },
        { type: 'silence', title: 'Jesus Prayer', seconds: 180, text: T.jesus }, P('Theotokion', T.theotokion), P('Song of Simeon', T.nunc), P('Dismissal', T.dismissal)]
    },
    sarum: {
      morning: [P('Sign of the Cross', T.cross), P('Deus in adjutorium', T.sarumHelp), { type: 'calendar', title: 'Today in the Church (Sarum)' },
        { type: 'readings', title: 'Mass Readings' }, { type: 'quote', title: 'From the Saints' }, { type: 'silence', title: 'Silence', seconds: 120 },
        { type: 'office', title: 'Lauds — Psalms, Hymn, Benedictus, Collect', which: 'L' }, P('Kyrie', T.kyrie), P('Pater noster (Our Father)', T.our), P('Ave Maria (Hail Mary)', T.hail), P('Blessing', T.blessing)],
      evening: [P('Sign of the Cross', T.cross), P('Deus in adjutorium', T.sarumHelp), { type: 'calendar', title: 'Today in the Church (Sarum)' },
        { type: 'art', title: 'Sacred Art' }, { type: 'silence', title: 'Silence', seconds: 120 }, { type: 'office', title: 'Vespers — Psalms, Hymn, Magnificat, Collect', which: 'V' }, P('Kyrie', T.kyrie),
        P('Pater noster (Our Father)', T.our), P('Ave Maria (Hail Mary)', T.hail), P('Nunc dimittis', T.nunc), P('Blessing', T.blessing)]
    }
  };

  /* ---------- hours (traditional times) ---------- */
  const HOURS = {
    roman: [
      { n: 'Office of Readings', alt: 'Matins', at: 'Any time', start: null, d: 'Psalms, a long Scripture reading and a patristic reading.' },
      { n: 'Morning Prayer', alt: 'Lauds', at: 'Dawn', start: 5, d: 'Hymn, three psalms, short reading, Canticle of Zechariah (Benedictus).', hour: 'lauds' },
      { n: 'Midmorning Prayer', alt: 'Terce', at: '9 am', start: 9, d: 'Short daytime office.', hour: 'daytime' },
      { n: 'Midday Prayer', alt: 'Sext', at: 'Noon', start: 12, d: 'Short daytime office.', hour: 'daytime' },
      { n: 'Midafternoon Prayer', alt: 'None', at: '3 pm', start: 15, d: 'Short daytime office.', hour: 'daytime' },
      { n: 'Evening Prayer', alt: 'Vespers', at: 'Sunset', start: 17, d: 'Psalms, reading, Canticle of Mary (Magnificat), intercessions.', hour: 'vespers' },
      { n: 'Night Prayer', alt: 'Compline', at: 'Before sleep', start: 21, d: 'Examination of conscience, psalm, Canticle of Simeon.', hour: 'compline' }
    ],
    byz: [
      { n: 'Midnight Office', alt: 'Mesonyktikon', at: 'Midnight', start: 0, d: 'Watchful prayer of the night.', hour: 'midnight' },
      { n: 'Matins', alt: 'Orthros', at: 'Dawn', start: 4, d: 'Six Psalms, litany, canon, praises.', hour: 'orthros' },
      { n: 'First Hour', alt: 'Prime', at: '6 am', start: 6, d: 'Consecrating the day to God.', hour: 'hours' },
      { n: 'Third Hour', alt: 'Terce', at: '9 am', start: 9, d: 'Remembering the descent of the Holy Spirit.', hour: 'hours' },
      { n: 'Sixth Hour', alt: 'Sext', at: 'Noon', start: 12, d: 'Remembering the Crucifixion.', hour: 'hours' },
      { n: 'Ninth Hour', alt: 'None', at: '3 pm', start: 15, d: 'Remembering the death of Christ.', hour: 'hours' },
      { n: 'Vespers', alt: 'Esperinos', at: 'Sunset', start: 17, d: 'Lord, I Have Cried; Phos Hilaron; Prokeimenon.', hour: 'vespers' },
      { n: 'Compline', alt: 'Apodeipnon', at: 'Before sleep', start: 20, d: 'Psalms, Prayer of Manasseh, Forgive-Us Prayers.', hour: 'compline' }
    ],
    sarum: [
      { n: 'Matins', alt: 'Matutinae', at: 'Night', start: null, d: 'Night office with psalms and lessons.' },
      { n: 'Lauds', alt: 'Laudes', at: 'Dawn', start: 5, d: 'Morning praise with the Benedictus.' },
      { n: 'Prime', alt: 'Prima', at: '6 am', start: 6, d: 'First hour; reading of the martyrology and chapter.' },
      { n: 'Terce', alt: 'Tertia', at: '9 am', start: 9, d: 'Third hour.' },
      { n: 'Sext', alt: 'Sexta', at: 'Noon', start: 12, d: 'Sixth hour.' },
      { n: 'None', alt: 'Nona', at: '3 pm', start: 15, d: 'Ninth hour.' },
      { n: 'Vespers', alt: 'Vesperae', at: 'Evening', start: 17, d: 'Evening praise with the Magnificat.' },
      { n: 'Compline', alt: 'Completorium', at: 'Before sleep', start: 20, d: 'Night prayer with the Nunc dimittis.' }
    ]
  };

  return { ART, QUOTES, TEXTS: T, FLOWS, HOURS };
})();
if (typeof module === 'object' && module.exports) module.exports = CONTENT;
