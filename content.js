/* Daily-prayer content: artworks, saint quotations, public-domain prayer texts, prayer flows.
 * Everything here is original curation or public-domain text (Douay-Rheims/Challoner wording for
 * Scripture canticles, Keble 1834 for Phos Hilaron). Extend freely — the app picks by season/date.
 */
const CONTENT = (() => {
  /* ---------- artworks (curated dates/origins; pinned museum images or verified live lookup) ---------- */
  // tags: advent christmas epiphany lent holyweek easter pentecost marian transfiguration dormition michaelmas nicholas general
  const ART = [
  {
    "t": "Christ Pantocrator",
    "a": "Unknown Byzantine artist",
    "tr": "East",
    "tags": [
      "general",
      "epiphany"
    ],
    "q": "Christ Pantocrator Sinai icon",
    "wt": "Christ Pantocrator (Sinai)",
    "fm": "pantocrator|sinai|sinay|vsederzhitel|pantokrator",
    "p": "An early surviving panel icon from Sinai, painted in encaustic, with subtly differing expressions on the two sides of Christ’s face.",
    "created": "6th century",
    "origin": "Saint Catherine’s Monastery, Sinai, Egypt; original workshop uncertain",
    "source": "https://www.sinaimonastery.com/st-catherine/index.php/en/treasures/icons"
  },
  {
    "t": "The Holy Trinity",
    "a": "Andrei Rublev",
    "tr": "East",
    "tags": [
      "general",
      "pentecost"
    ],
    "q": "Trinity Andrei Rublev icon",
    "wt": "Trinity (Andrei Rublev)",
    "fm": "rublev|trinity|troitsa",
    "p": "Rublev depicts three angels seated around a table, drawing on the hospitality of Abraham in Genesis 18.",
    "created": "ca. 1422–1427",
    "origin": "Trinity–Sergius Monastery, Sergiev Posad, Russia",
    "source": "https://www.tretyakovgallery.ru/about/history/p-m-tretyakov-priobretaet-ikony-iz-sobraniya-i-l-silina/"
  },
  {
    "t": "Theotokos of Vladimir",
    "a": "Unknown Byzantine artist",
    "tr": "East",
    "tags": [
      "marian",
      "advent",
      "christmas"
    ],
    "q": "Theotokos of Vladimir icon",
    "wt": "Theotokos of Vladimir",
    "fm": "vladimir",
    "p": "An Eleusa, or Virgin of Tenderness, icon in which the Christ Child presses his cheek against Mary's.",
    "created": "Early 12th century",
    "origin": "Constantinople (Istanbul, Turkey)",
    "source": "https://en.wikipedia.org/wiki/Theotokos_of_Vladimir"
  },
  {
    "t": "Our Lady of Częstochowa",
    "a": "Unknown icon painter",
    "tr": "East",
    "tags": [
      "marian"
    ],
    "q": "Our Lady of Czestochowa icon",
    "wt": "Black Madonna of Częstochowa",
    "fm": "cz[eę]stochow|madonna|jasna",
    "p": "The revered icon at Jasna Góra is distinguished by two visible scars on Mary's right cheek.",
    "created": "ca. early 14th century",
    "origin": "Origin uncertain; preserved at Jasna Góra, Częstochowa, Poland",
    "source": "https://en.wikipedia.org/wiki/Black_Madonna_of_Cz%C4%99stochowa"
  },
  {
    "t": "The Harrowing of Hell (Anastasis)",
    "a": "Unknown Byzantine artist",
    "tr": "East",
    "tags": [
      "easter",
      "holyweek"
    ],
    "q": "Anastasis fresco Chora Church",
    "wt": "Harrowing of Hell",
    "fm": "chora|anastasis|kariye",
    "p": "In the Chora fresco, the risen Christ grasps Adam and Eve by the wrists and raises them from their tombs.",
    "created": "ca. 1316–1321",
    "origin": "Chora Church, Constantinople (Istanbul, Turkey)",
    "source": "https://smarthistory.org/chora-church/"
  },
  {
    "t": "Deësis mosaic",
    "a": "Unknown Byzantine mosaicists",
    "tr": "East",
    "tags": [
      "general",
      "advent"
    ],
    "q": "Deësis mosaic Hagia Sophia",
    "wt": "Deesis",
    "fm": "de[eë]sis|deisis",
    "p": "The monumental Byzantine mosaic shows Christ between the Virgin Mary and John the Baptist, who intercede before him.",
    "created": "ca. 1261",
    "origin": "Hagia Sophia, Constantinople (Istanbul, Turkey)",
    "source": "https://smarthistory.org/deesis-christ-with-the-virgin-mary-and-john-the-baptist-hagia-sophia-istanbul/"
  },
  {
    "t": "Hodegetria · Virgin and Child",
    "a": "Unknown Byzantine artist",
    "tr": "East",
    "tags": [
      "marian"
    ],
    "q": "met-artwork-463984",
    "created": "Mid-10th–mid-11th century",
    "origin": "Probably Constantinople (Istanbul, Turkey)",
    "source": "https://www.metmuseum.org/art/collection/search/463984",
    "image": "https://collectionapi.metmuseum.org/api/collection/v1/iiif/463984/969117/main-image",
    "credit": "The Metropolitan Museum of Art",
    "license": "Public domain",
    "p": "A finely carved ivory icon shows Mary holding Christ and directing attention toward him."
  },
  {
    "t": "Dormition of the Theotokos · Koimesis",
    "a": "Unknown Byzantine artist",
    "tr": "East",
    "tags": [
      "dormition",
      "marian"
    ],
    "q": "met-artwork-464013",
    "created": "Late 10th century",
    "origin": "Probably Constantinople (Istanbul, Turkey)",
    "source": "https://www.metmuseum.org/art/collection/search/464013",
    "image": "https://collectionapi.metmuseum.org/api/collection/v1/iiif/464013/969516/main-image",
    "credit": "The Metropolitan Museum of Art",
    "license": "Public domain",
    "p": "This ivory relief depicts the apostles around Mary and Christ receiving her soul."
  },
  {
    "t": "The Last Supper",
    "a": "Leonardo da Vinci",
    "tr": "West",
    "tags": [
      "holyweek",
      "general"
    ],
    "q": "The Last Supper Leonardo da Vinci",
    "wt": "The Last Supper (Leonardo)",
    "fm": "last.?supper|leonardo|cenacolo|ultima",
    "p": "Leonardo arranges the apostles in groups of three at the moment Christ announces that one of them will betray him.",
    "created": "1495–1498",
    "origin": "Santa Maria delle Grazie, Milan, Italy",
    "source": "https://cenacolovinciano.org/en/museum/the-works/the-last-supper-leonardo-da-vinci-1452-1519/"
  },
  {
    "t": "Pietà",
    "a": "Michelangelo",
    "tr": "West",
    "tags": [
      "holyweek",
      "lent"
    ],
    "q": "Pietà Michelangelo St Peter’s Basilica",
    "wt": "Pietà (Michelangelo)",
    "fm": "piet",
    "p": "Michelangelo carved the youthful Mary holding Christ's body from a single block of marble for St Peter's Basilica.",
    "created": "1498–1499",
    "origin": "Rome, Italy; made for Saint Peter’s Basilica",
    "source": "https://www.turismoroma.it/en/itineraries/michelangelo"
  },
  {
    "t": "The Return of the Prodigal Son",
    "a": "Rembrandt",
    "tr": "West",
    "tags": [
      "lent",
      "general"
    ],
    "q": "Return of the Prodigal Son Rembrandt",
    "wt": "The Return of the Prodigal Son (Rembrandt)",
    "fm": "prodigal|rembrandt",
    "p": "Rembrandt places the kneeling son at the center of a quiet reunion, illuminated against a dark background.",
    "created": "ca. 1668–1669",
    "origin": "Netherlands; exact workshop not documented",
    "source": "https://www.hermitagefoundation.co.uk/prodigal-son-rembrandt"
  },
  {
    "t": "The Calling of Saint Matthew",
    "a": "Caravaggio",
    "tr": "West",
    "tags": [
      "general"
    ],
    "q": "Calling of Saint Matthew Caravaggio",
    "wt": "The Calling of Saint Matthew",
    "fm": "matthew|matteo|calling",
    "p": "Caravaggio uses a beam of light and Christ's pointing hand to mark the call of Matthew at the tax table.",
    "created": "1599–1600",
    "origin": "Contarelli Chapel, San Luigi dei Francesi, Rome, Italy",
    "source": "https://turismoroma.it/en/node/18610"
  },
  {
    "t": "The Annunciation",
    "a": "Fra Angelico",
    "tr": "West",
    "tags": [
      "advent",
      "marian"
    ],
    "q": "Annunciation Fra Angelico San Marco",
    "wt": "Annunciation (Fra Angelico, San Marco)",
    "fm": "angelico|annunciat",
    "p": "Painted for the convent of San Marco, this fresco sets Gabriel and Mary beneath a restrained Renaissance loggia.",
    "created": "ca. 1440–1445",
    "origin": "Convent of San Marco, Florence, Italy",
    "source": "https://en.wikipedia.org/wiki/Annunciation_(Fra_Angelico,_San_Marco)"
  },
  {
    "t": "Sistine Madonna",
    "a": "Raphael",
    "tr": "West",
    "tags": [
      "marian",
      "advent"
    ],
    "q": "Sistine Madonna Raphael",
    "wt": "Sistine Madonna",
    "fm": "sistine|sixtin|raffael|raphael",
    "p": "Raphael frames the Virgin and Child with opening curtains, Saints Sixtus and Barbara, and two cherubs below.",
    "created": "1512–1513",
    "origin": "Made for San Sisto, Piacenza, Italy",
    "source": "https://www.skd.museum/fileadmin/userfiles/SKD_allgemein/Publikationen/Jahresberichte/SKD-annual-report-2012.pdf"
  },
  {
    "t": "Christ Crucified",
    "a": "Diego Velázquez",
    "tr": "West",
    "tags": [
      "lent",
      "holyweek"
    ],
    "q": "Christ Crucified Velázquez Prado",
    "wt": "Christ Crucified (Velázquez)",
    "fm": "cristo|vel[aá]zquez|crucif",
    "p": "Velázquez isolates the crucified Christ against a dark background, emphasizing stillness and the body's naturalistic detail.",
    "created": "ca. 1632",
    "origin": "Convent of San Plácido, Madrid, Spain",
    "source": "https://www.museodelprado.es/en/the-collection/art-work/the-crucified-christ/72cbb57e-f622-4531-9b25-27ff0a9559d7"
  },
  {
    "t": "Isenheim Altarpiece (Crucifixion)",
    "a": "Matthias Grünewald",
    "tr": "West",
    "tags": [
      "lent",
      "holyweek"
    ],
    "q": "Isenheim Altarpiece Grünewald Crucifixion",
    "wt": "Isenheim Altarpiece",
    "fm": "isenheim|gr[uü]newald",
    "p": "Created for a hospital monastery at Isenheim, the altarpiece presents Christ's suffering with unusually stark physical detail.",
    "created": "1512–1516",
    "origin": "Antonite monastery, Isenheim, Alsace (France)",
    "source": "https://www.musee-unterlinden.com/en/oeuvres/the-isenheim-altarpiece/"
  },
  {
    "t": "The Incredulity of Saint Thomas",
    "a": "Caravaggio",
    "tr": "West",
    "tags": [
      "easter"
    ],
    "q": "Incredulity of Saint Thomas Caravaggio",
    "wt": "The Incredulity of Saint Thomas (Caravaggio)",
    "fm": "thomas|incredul|tommaso",
    "p": "Caravaggio brings Thomas's hand close to Christ's wound, concentrating the scene into a tightly grouped encounter.",
    "created": "ca. 1601–1602",
    "origin": "Rome, Italy; made for Vincenzo Giustiniani",
    "source": "https://en.wikipedia.org/wiki/The_Incredulity_of_Saint_Thomas_(Caravaggio)"
  },
  {
    "t": "Supper at Emmaus",
    "a": "Caravaggio",
    "tr": "West",
    "tags": [
      "easter"
    ],
    "q": "Supper at Emmaus Caravaggio National Gallery",
    "wt": "Supper at Emmaus (Caravaggio, London)",
    "fm": "emmaus",
    "p": "Caravaggio depicts the moment the disciples recognize Christ at a meal, using dramatic gestures and a carefully arranged table.",
    "created": "1601",
    "origin": "Rome, Italy",
    "source": "https://www.nationalgallery.org.uk/paintings/michelangelo-merisi-da-caravaggio-the-supper-at-emmaus"
  },
  {
    "t": "Ghent Altarpiece",
    "a": "Jan & Hubert van Eyck",
    "tr": "West",
    "tags": [
      "easter",
      "general"
    ],
    "q": "Ghent Altarpiece Adoration of the Mystic Lamb",
    "wt": "Ghent Altarpiece",
    "fm": "ghent|gent|eyck|lamb",
    "p": "The many-paneled altarpiece centers on the Adoration of the Mystic Lamb, with groups gathering in a detailed landscape.",
    "created": "1432",
    "origin": "Saint Bavo’s Cathedral, Ghent, Belgium",
    "source": "https://www.sintbaafskathedraal.be/en/history/the-ghent-altarpiece/"
  },
  {
    "t": "The Mystic Nativity",
    "a": "Sandro Botticelli",
    "tr": "West",
    "tags": [
      "christmas"
    ],
    "q": "Mystic Nativity Botticelli",
    "wt": "The Mystical Nativity",
    "fm": "nativity|botticelli",
    "p": "Botticelli combines the Nativity with dancing angels and scenes of reconciliation in a deliberately visionary composition.",
    "created": "1500",
    "origin": "Florence, Italy",
    "source": "https://www.nationalgallery.org.uk/paintings/sandro-botticelli-mystic-nativity"
  },
  {
    "t": "Adoration of the Magi",
    "a": "Gentile da Fabriano",
    "tr": "West",
    "tags": [
      "epiphany"
    ],
    "q": "Adoration of the Magi Gentile da Fabriano",
    "wt": "Adoration of the Magi (Gentile da Fabriano)",
    "fm": "gentile|magi|strozzi",
    "p": "This richly detailed International Gothic altarpiece was commissioned for the Strozzi chapel in Florence.",
    "created": "1423",
    "origin": "Strozzi Chapel, Santa Trinita, Florence, Italy",
    "source": "https://www.uffizi.it/en/artworks/adoration-of-the-magi"
  },
  {
    "t": "The Baptism of Christ",
    "a": "Piero della Francesca",
    "tr": "West",
    "tags": [
      "epiphany"
    ],
    "q": "Baptism of Christ Piero della Francesca",
    "wt": "The Baptism of Christ (Piero della Francesca)",
    "fm": "piero|baptism",
    "p": "Piero balances Christ's baptism with a white dove above him and a carefully ordered landscape behind.",
    "created": "ca. 1437–1445",
    "origin": "Made for San Giovanni Battista, Sansepolcro, Italy",
    "source": "https://www.nationalgallery.org.uk/paintings/piero-della-francesca-the-baptism-of-christ"
  },
  {
    "t": "Saint Francis in Meditation",
    "a": "Francisco de Zurbarán",
    "tr": "West",
    "tags": [
      "general",
      "lent"
    ],
    "q": "Saint Francis in Meditation Zurbarán",
    "wt": "Saint Francis in Meditation",
    "fm": "zurbar|francis",
    "p": "Zurbarán uses a dark habit, stark light, and a skull to depict Francis absorbed in contemplation.",
    "created": "ca. 1635–1639",
    "origin": "Spain; original commission unknown",
    "source": "https://www.nationalgallery.org.uk/paintings/francisco-de-zurbaran-saint-francis-in-meditation-1"
  },
  {
    "t": "The Descent from the Cross",
    "a": "Rogier van der Weyden",
    "tr": "West",
    "tags": [
      "holyweek"
    ],
    "q": "Descent from the Cross Rogier van der Weyden Prado",
    "wt": "The Descent from the Cross (van der Weyden)",
    "fm": "weyden|descent|deposition",
    "p": "Van der Weyden echoes the curve of Christ's fallen body in Mary's swooning figure within a shallow painted space.",
    "created": "ca. 1435",
    "origin": "Chapel of Our Lady Outside the Walls, Leuven, Belgium",
    "source": "https://en.wikipedia.org/wiki/The_Descent_from_the_Cross_(van_der_Weyden)"
  },
  {
    "t": "Pentecost",
    "a": "El Greco",
    "tr": "West",
    "tags": [
      "pentecost"
    ],
    "q": "Pentecost El Greco Prado",
    "wt": "Pentecost (El Greco)",
    "fm": "greco|pentecost",
    "p": "El Greco's elongated figures and vivid color convey the descent of the Holy Spirit upon the gathered disciples.",
    "created": "ca. 1600",
    "origin": "Doña María de Aragón college chapel, Madrid, Spain",
    "source": "https://en.wikipedia.org/wiki/Pentecost_(El_Greco)"
  },
  {
    "t": "The Resurrection",
    "a": "Piero della Francesca",
    "tr": "West",
    "tags": [
      "easter"
    ],
    "q": "Resurrection Piero della Francesca Sansepolcro",
    "wt": "Resurrection (Piero della Francesca)",
    "fm": "resurrect|piero",
    "p": "Piero depicts the risen Christ stepping from the tomb above four sleeping soldiers in Sansepolcro.",
    "created": "ca. 1460",
    "origin": "Palazzo della Residenza, Sansepolcro, Italy",
    "source": "https://www.museocivicosansepolcro.it/collezzioni.aspx"
  },
  {
    "t": "Holy Trinity",
    "a": "Masaccio",
    "tr": "West",
    "tags": [
      "general"
    ],
    "q": "Holy Trinity Masaccio Santa Maria Novella",
    "wt": "Holy Trinity (Masaccio)",
    "fm": "masaccio|trinit",
    "p": "Below the cross lies a skeleton: “I was what you are; you will be what I am.” How do you hold that?",
    "created": "ca. 1425–1427",
    "origin": "Santa Maria Novella, Florence, Italy",
    "source": "https://archivio.smn.it/arte/ch04.htm"
  },
  {
    "t": "Saint Demetrios",
    "a": "Unknown Byzantine artist",
    "tr": "East",
    "tags": [
      "general"
    ],
    "q": "met-artwork-465946",
    "created": "950–1000",
    "origin": "Byzantine Empire; exact workshop unknown",
    "source": "https://www.metmuseum.org/art/collection/search/465946",
    "image": "https://collectionapi.metmuseum.org/api/collection/v1/iiif/465946/951196/main-image",
    "credit": "The Metropolitan Museum of Art",
    "license": "Public domain",
    "p": "The military saint stands in a carved ivory icon, recalling his veneration as the patron of Thessaloniki."
  },
  {
    "t": "Virgin Eleousa · Mosaic Icon",
    "a": "Unknown Byzantine artist",
    "tr": "East",
    "tags": [
      "marian",
      "advent"
    ],
    "q": "met-artwork-474336",
    "created": "Early 14th century",
    "origin": "Probably Constantinople (Istanbul, Turkey)",
    "source": "https://www.metmuseum.org/art/collection/search/474336",
    "image": "https://collectionapi.metmuseum.org/api/collection/v1/iiif/474336/2311579/main-image",
    "credit": "The Metropolitan Museum of Art",
    "license": "Public domain",
    "p": "Tiny mosaic pieces form an intimate image of the Virgin of Compassion and the Christ Child."
  },
  {
    "t": "Four Feast Icons",
    "a": "Unknown Byzantine artist",
    "tr": "East",
    "tags": [
      "epiphany",
      "easter",
      "nicholas"
    ],
    "q": "met-artwork-479796",
    "created": "Early 15th century",
    "origin": "Possibly Crete, Greece",
    "source": "https://www.metmuseum.org/art/collection/search/479796",
    "image": "https://collectionapi.metmuseum.org/api/collection/v1/iiif/479796/1712114/main-image",
    "credit": "The Metropolitan Museum of Art",
    "license": "Public domain",
    "p": "Four painted panels show John and Prochoros, Christ’s Baptism, the Anastasis, and Saint Nicholas."
  },
  {
    "t": "Deësis · Ivory Icon",
    "a": "Unknown Byzantine artist",
    "tr": "East",
    "tags": [
      "general",
      "advent"
    ],
    "q": "met-artwork-464014",
    "created": "Mid-10th century",
    "origin": "Probably Constantinople (Istanbul, Turkey)",
    "source": "https://www.metmuseum.org/art/collection/search/464014",
    "image": "https://collectionapi.metmuseum.org/api/collection/v1/iiif/464014/931556/main-image",
    "credit": "The Metropolitan Museum of Art",
    "license": "Public domain",
    "p": "Christ appears between the Virgin Mary and John the Baptist, who intercede before him."
  },
  {
    "t": "Christ and the Virgin · Pendant Icon",
    "a": "Unknown Byzantine artist",
    "tr": "East",
    "tags": [
      "general",
      "marian"
    ],
    "q": "met-artwork-466272",
    "created": "ca. 1100",
    "origin": "Constantinople (Istanbul, Turkey)",
    "source": "https://www.metmuseum.org/art/collection/search/466272",
    "image": "https://collectionapi.metmuseum.org/api/collection/v1/iiif/466272/945951/main-image",
    "credit": "The Metropolitan Museum of Art",
    "license": "Public domain",
    "p": "A small gold-and-enamel devotional pendant bears Christ Pantokrator and the praying Virgin on its two sides."
  },
  {
    "t": "Christ Pantokrator · Stone Icon",
    "a": "Unknown Byzantine artist",
    "tr": "East",
    "tags": [
      "general"
    ],
    "q": "met-artwork-466046",
    "created": "ca. 1350 or later",
    "origin": "Probably Greece",
    "source": "https://www.metmuseum.org/art/collection/search/466046",
    "image": "https://collectionapi.metmuseum.org/api/collection/v1/iiif/466046/939465/main-image",
    "credit": "The Metropolitan Museum of Art",
    "license": "Public domain",
    "p": "Christ blesses the viewer in a small green steatite icon, a material widely used for personal devotion."
  },
  {
    "t": "Saint Peter · Enamel Medallion",
    "a": "Unknown Byzantine artist",
    "tr": "East",
    "tags": [
      "general"
    ],
    "q": "met-artwork-464543",
    "created": "ca. 1100",
    "origin": "Constantinople (Istanbul, Turkey)",
    "source": "https://www.metmuseum.org/art/collection/search/464543",
    "image": "https://collectionapi.metmuseum.org/api/collection/v1/iiif/464543/941786/main-image",
    "credit": "The Metropolitan Museum of Art",
    "license": "Public domain",
    "p": "Saint Peter appears in a gold-and-enamel medallion originally associated with an icon frame."
  },
  {
    "t": "Saints Peter and Paul",
    "a": "Unknown Byzantine artist",
    "tr": "East",
    "tags": [
      "general"
    ],
    "q": "met-artwork-330100",
    "created": "Late 14th–15th century",
    "origin": "Byzantine Empire; exact workshop unknown",
    "source": "https://www.metmuseum.org/art/collection/search/330100",
    "image": "https://collectionapi.metmuseum.org/api/collection/v1/iiif/330100/702380/main-image",
    "credit": "The Metropolitan Museum of Art",
    "license": "Public domain",
    "p": "The two apostles face one another in a carved steatite plaque."
  },
  {
    "t": "The New Testament Trinity",
    "a": "Unknown Byzantine artist",
    "tr": "East",
    "tags": [
      "pentecost",
      "general"
    ],
    "q": "cleveland-artwork-2016.32",
    "created": "ca. 1450",
    "origin": "Constantinople (Istanbul, Turkey)",
    "source": "https://www.clevelandart.org/art/2016.32",
    "image": "https://openaccess-cdn.clevelandart.org/2016.32/2016.32_web.jpg",
    "credit": "Cleveland Museum of Art",
    "license": "CC0",
    "p": "Christ and the Ancient of Days are enthroned beneath the dove of the Holy Spirit, flanked by two hymnographers."
  },
  {
    "t": "Mother of God and Infant Christ",
    "a": "Attributed to Angelos Akotantos",
    "tr": "East",
    "tags": [
      "marian"
    ],
    "q": "cleveland-artwork-2010.154",
    "created": "ca. 1425–1450",
    "origin": "Candia (Heraklion, Crete) or Constantinople",
    "source": "https://www.clevelandart.org/art/2010.154",
    "image": "https://openaccess-cdn.clevelandart.org/2010.154/2010.154_web.jpg",
    "credit": "Cleveland Museum of Art",
    "license": "CC0",
    "p": "Mary and Christ touch cheeks in a painted icon of tenderness, with rich gold details against the dark robes."
  }
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
      // The Roman Office already supplies its own canticles, intercessions,
      // Lord's Prayer and conclusion. Do not append parallel devotional texts.
      morning: [{ type: 'office', title: 'Morning Prayer (Lauds)', which: 'L', hour: 'lauds' }],
      readings: [{ type: 'oor', title: 'Office of Readings' }],
      evening: [{ type: 'office', title: 'Evening Prayer (Vespers)', which: 'V', hour: 'vespers' }],
      // The examination of conscience is permitted before Compline.
      night: [{ type: 'office', title: 'Night Prayer (Compline)', which: 'C', hour: 'compline' }]
    },
    byz: {
      morning: [P('Sign of the Cross', T.cross), P('Blessing', T.bwg), P('O Heavenly King', T.heavenly), P('Trisagion Prayers', T.trisagion), P('Our Father', T.our), { type: 'calendar', title: 'Today in the Church' },
        P('Morning Troparion', T.morningTrop), { type: 'hourlink', title: 'Orthros (Matins) and the Hours', hour: 'orthros' }, 
        { type: 'quote', title: 'From the Fathers' }, { type: 'silence', title: 'Jesus Prayer', seconds: 180, text: T.jesus }, P('Dismissal', T.dismissal)],
      evening: [P('Sign of the Cross', T.cross), P('Blessing', T.bwg), P('O Heavenly King', T.heavenly), P('Trisagion Prayers', T.trisagion), P('Our Father', T.our), { type: 'calendar', title: 'Today in the Church' },
        P('Lord, I Have Cried', T.lordcried), P('Phos Hilaron — O Gladsome Light', T.phos), P('Vouchsafe, O Lord', T.vouchsafe),
        { type: 'silence', title: 'Jesus Prayer', seconds: 180, text: T.jesus }, P('Theotokion', T.theotokion), P('Song of Simeon', T.nunc), { type: 'hourlink', title: 'Full Vespers and Compline (Horologion)', hour: 'vespers' }, P('Dismissal', T.dismissal)],
      night: [P('Sign of the Cross', T.cross), P('Blessing', T.bwg), P('Trisagion Prayers', T.trisagion), P('Our Father', T.our), P('Song of Simeon', T.nunc), P('Prayer before sleep', 'Into your hands, O Lord, I commend my spirit. Protect me through this night and grant me peaceful rest.'), { type: 'hourlink', title: 'Full Byzantine Compline (Horologion)', hour: 'compline' }]
    },
    sarum: {
      // the Traditional tab is laid out by hour: Matins, Lauds, the Little Hours, Vespers, Compline
      M: [P('Sign of the Cross', T.cross), { type: 'calendar', title: 'Today in the Church' }, { type: 'matins', title: 'Matins' },
        P('Pater noster (Our Father)', T.our), P('Ave Maria (Hail Mary)', T.hail)],
      L: [P('Sign of the Cross', T.cross), { type: 'calendar', title: 'Today in the Church' }, { type: 'quote', title: 'From the Saints' },
        { type: 'office', title: 'Lauds', which: 'L' }, { type: 'bvm', title: 'Commemoration of Our Lady · Saturday', hrs: [['L', 'Lauds']] },
        P('Kyrie', T.kyrie), P('Pater noster (Our Father)', T.our), P('Ave Maria (Hail Mary)', T.hail), P('Blessing', T.blessing)],
      LH: [P('Sign of the Cross', T.cross), { type: 'calendar', title: 'Today in the Church' },
        { type: 'little', title: 'Prime, Terce, Sext and None' }, { type: 'bvm', title: 'Commemoration of Our Lady · Saturday', hrs: [['P', 'Prime'], ['T', 'Terce'], ['S', 'Sext'], ['N', 'None']] },
        P('Pater noster (Our Father)', T.our), P('Ave Maria (Hail Mary)', T.hail)],
      V: [P('Sign of the Cross', T.cross), { type: 'calendar', title: 'Today in the Church' },
        { type: 'office', title: 'Vespers', which: 'V' }, { type: 'bvm', title: 'Commemoration of Our Lady · Saturday', hrs: [['V', 'Vespers']] },
        P('Kyrie', T.kyrie), P('Pater noster (Our Father)', T.our), P('Ave Maria (Hail Mary)', T.hail), P('Blessing', T.blessing)],
      C: [P('Sign of the Cross', T.cross), { type: 'office', title: 'Compline', which: 'C' }, { type: 'bvm', title: 'Commemoration of Our Lady · Saturday', hrs: [['C', 'Compline']] },
        P('Pater noster (Our Father)', T.our), P('Ave Maria (Hail Mary)', T.hail), P('Blessing', T.blessing)],
      morning: [P('Sign of the Cross', T.cross), { type: 'calendar', title: 'Today in the Church' },
        { type: 'quote', title: 'From the Saints' }, { type: 'silence', title: 'Silence', seconds: 120 },
        { type: 'office', title: 'Lauds', which: 'L' }, P('Kyrie', T.kyrie), P('Pater noster (Our Father)', T.our), P('Ave Maria (Hail Mary)', T.hail), P('Blessing', T.blessing)],
      evening: [P('Sign of the Cross', T.cross), { type: 'calendar', title: 'Today in the Church' },
        { type: 'silence', title: 'Silence', seconds: 120 }, { type: 'office', title: 'Vespers', which: 'V' }, P('Kyrie', T.kyrie),
        P('Pater noster (Our Father)', T.our), P('Ave Maria (Hail Mary)', T.hail), P('Blessing', T.blessing),
        { type: 'office', title: 'Compline · before sleep', which: 'C' }]
    }
  };

  /* ---------- hours (traditional times) ---------- */
  const HOURS = {
    roman: [
      { n: 'Office of Readings', alt: 'Matins', at: 'Any time', start: null, d: 'A long Scripture reading and a reading from a Father or saint.', oor: true },
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
      { w: 'M', n: 'Matins', alt: 'Matutinae', at: 'Night', start: null, d: 'Night office with psalms and lessons.' },
      { w: 'L', n: 'Lauds', alt: 'Laudes', at: 'Dawn', start: 5, d: 'Morning praise with the Benedictus.' },
      { w: 'P', n: 'Prime', alt: 'Prima', at: '6 am', start: 6, d: 'First hour; reading of the martyrology and chapter.' },
      { w: 'T', n: 'Terce', alt: 'Tertia', at: '9 am', start: 9, d: 'Third hour.' },
      { w: 'S', n: 'Sext', alt: 'Sexta', at: 'Noon', start: 12, d: 'Sixth hour.' },
      { w: 'N', n: 'None', alt: 'Nona', at: '3 pm', start: 15, d: 'Ninth hour.' },
      { w: 'V', n: 'Vespers', alt: 'Vesperae', at: 'Evening', start: 17, d: 'Evening praise with the Magnificat.' },
      { w: 'C', n: 'Compline', alt: 'Completorium', at: 'Before sleep', start: 20, d: 'Night prayer with the Nunc dimittis.' }
    ]
  };

  /* Popes: short quotations, each checked word for word against the text on vatican.va */
  const POPEQ = [
{
"s": "Pope Leo XIV",
"w": "First blessing Urbi et Orbi, 8 May 2025",
"u": "https://www.vatican.va/content/leo-xiv/en/messages/urbi/documents/20250508-prima-benedizione-urbietorbi.html",
"t": "God loves us, God loves you all, and evil will not prevail!"
},
{
"s": "Pope Francis",
"w": "Evangelii Gaudium 1",
"u": "https://www.vatican.va/content/francesco/en/apost_exhortations/documents/papa-francesco_esortazione-ap_20131124_evangelii-gaudium.html",
"t": "The joy of the gospel fills the hearts and lives of all who encounter Jesus."
},
{
"s": "Pope Benedict XVI",
"w": "Homily at the start of his pontificate, 24 April 2005",
"u": "https://www.vatican.va/content/benedict-xvi/en/homilies/2005/documents/hf_ben-xvi_hom_20050424_inizio-pontificato.html",
"t": "Do not be afraid of Christ! He takes nothing away, and he gives you everything."
},
{
"s": "Pope Leo XIV",
"w": "Homily at the start of his pontificate, 18 May 2025",
"u": "https://www.vatican.va/content/leo-xiv/en/homilies/2025/documents/20250518-inizio-pontificato.html",
"t": "Brothers and sisters, this is the hour for love!"
},
{
"s": "Pope Francis",
"w": "Evangelii Gaudium 3",
"u": "https://www.vatican.va/content/francesco/en/apost_exhortations/documents/papa-francesco_esortazione-ap_20131124_evangelii-gaudium.html",
"t": "God never tires of forgiving us; we are the ones who tire of seeking his mercy."
},
{
"s": "Pope Benedict XVI",
"w": "Spe Salvi 2",
"u": "https://www.vatican.va/content/benedict-xvi/en/encyclicals/documents/hf_ben-xvi_enc_20071130_spe-salvi.html",
"t": "The one who has hope lives differently; the one who hopes has been granted the gift of a new life."
},
{
"s": "Pope Leo XIV",
"w": "Dilexi Te 5",
"u": "https://www.vatican.va/content/leo-xiv/en/apost_exhortations/documents/20251004-dilexi-te.html",
"t": "In the poor, he continues to speak to us."
},
{
"s": "Pope Francis",
"w": "Gaudete et Exsultate 1",
"u": "https://www.vatican.va/content/francesco/en/apost_exhortations/documents/papa-francesco_esortazione-ap_20180319_gaudete-et-exsultate.html",
"t": "He wants us to be saints and not to settle for a bland and mediocre existence."
},
{
"s": "Pope Benedict XVI",
"w": "Spe Salvi 26",
"u": "https://www.vatican.va/content/benedict-xvi/en/encyclicals/documents/hf_ben-xvi_enc_20071130_spe-salvi.html",
"t": "It is not science that redeems man: man is redeemed by love."
},
{
"s": "Pope Leo XIV",
"w": "Homily at the start of his pontificate, 18 May 2025",
"u": "https://www.vatican.va/content/leo-xiv/en/homilies/2025/documents/20250518-inizio-pontificato.html",
"t": "The heart of the Gospel is the love of God that makes us brothers and sisters."
},
{
"s": "Pope Francis",
"w": "Gaudete et Exsultate 9",
"u": "https://www.vatican.va/content/francesco/en/apost_exhortations/documents/papa-francesco_esortazione-ap_20180319_gaudete-et-exsultate.html",
"t": "Holiness is the most attractive face of the Church."
},
{
"s": "Pope Benedict XVI",
"w": "Spe Salvi 32",
"u": "https://www.vatican.va/content/benedict-xvi/en/encyclicals/documents/hf_ben-xvi_enc_20071130_spe-salvi.html",
"t": "When no one listens to me any more, God still listens to me."
},
{
"s": "Pope Leo XIV",
"w": "Dilexi Te 75",
"u": "https://www.vatican.va/content/leo-xiv/en/apost_exhortations/documents/20251004-dilexi-te.html",
"t": "Where the world sees threats, she sees children; where walls are built, she builds bridges."
},
{
"s": "Pope Francis",
"w": "Gaudete et Exsultate 14",
"u": "https://www.vatican.va/content/francesco/en/apost_exhortations/documents/papa-francesco_esortazione-ap_20180319_gaudete-et-exsultate.html",
"t": "To be holy does not require being a bishop, a priest or a religious."
},
{
"s": "Pope Benedict XVI",
"w": "Homily at the start of his pontificate, 24 April 2005",
"u": "https://www.vatican.va/content/benedict-xvi/en/homilies/2005/documents/hf_ben-xvi_hom_20050424_inizio-pontificato.html",
"t": "There is nothing more beautiful than to be surprised by the Gospel, by the encounter with Christ."
},
{
"s": "Pope Leo XIV",
"w": "First blessing Urbi et Orbi, 8 May 2025",
"u": "https://www.vatican.va/content/leo-xiv/en/messages/urbi/documents/20250508-prima-benedizione-urbietorbi.html",
"t": "Help us, one and all, to build bridges through dialogue and encounter, joining together as one people, always at peace."
},
{
"s": "Pope Francis",
"w": "Gaudete et Exsultate 32",
"u": "https://www.vatican.va/content/francesco/en/apost_exhortations/documents/papa-francesco_esortazione-ap_20180319_gaudete-et-exsultate.html",
"t": "Do not be afraid of holiness. It will take away none of your energy, vitality or joy."
},
{
"s": "Pope Benedict XVI",
"w": "Spe Salvi 32",
"u": "https://www.vatican.va/content/benedict-xvi/en/encyclicals/documents/hf_ben-xvi_enc_20071130_spe-salvi.html",
"t": "When I can no longer talk to anyone or call upon anyone, I can always talk to God."
},
{
"s": "Pope Leo XIV",
"w": "Homily at the start of his pontificate, 18 May 2025",
"u": "https://www.vatican.va/content/leo-xiv/en/homilies/2025/documents/20250518-inizio-pontificato.html",
"t": "Look to Christ! Come closer to him!"
},
{
"s": "Pope Francis",
"w": "Laudato Si’ 84",
"u": "https://www.vatican.va/content/francesco/en/encyclicals/documents/papa-francesco_20150524_enciclica-laudato-si.html",
"t": "Soil, water, mountains: everything is, as it were, a caress of God."
},
{
"s": "Pope Benedict XVI",
"w": "Spe Salvi 33",
"u": "https://www.vatican.va/content/benedict-xvi/en/encyclicals/documents/hf_ben-xvi_enc_20071130_spe-salvi.html",
"t": "Man was created for greatness—for God himself; he was created to be filled by God."
},
{
"s": "Pope Leo XIV",
"w": "Dilexi Te 61",
"u": "https://www.vatican.va/content/leo-xiv/en/apost_exhortations/documents/20251004-dilexi-te.html",
"t": "Christian charity is liberating when it becomes incarnate."
},
{
"s": "Pope Francis",
"w": "Gaudete et Exsultate 34",
"u": "https://www.vatican.va/content/francesco/en/apost_exhortations/documents/papa-francesco_esortazione-ap_20180319_gaudete-et-exsultate.html",
"t": "Holiness does not make you less human, since it is an encounter between your weakness and the power of God’s grace."
},
{
"s": "Pope Benedict XVI",
"w": "Spe Salvi 34",
"u": "https://www.vatican.va/content/benedict-xvi/en/encyclicals/documents/hf_ben-xvi_enc_20071130_spe-salvi.html",
"t": "Hope in a Christian sense is always hope for others as well."
},
{
"s": "Pope Francis",
"w": "Laudato Si’ 13",
"u": "https://www.vatican.va/content/francesco/en/encyclicals/documents/papa-francesco_20150524_enciclica-laudato-si.html",
"t": "The Creator does not abandon us; he never forsakes his loving plan or repents of having created us."
}
];

  return { ART, QUOTES, POPEQ, TEXTS: T, FLOWS, HOURS };
})();
if (typeof module === 'object' && module.exports) module.exports = CONTENT;
