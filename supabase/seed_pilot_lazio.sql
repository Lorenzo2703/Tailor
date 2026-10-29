-- Seed: Pilot Lazio partner shelters and initial listings (Milestone 15)
-- Verified partner organizations across Lazio provinces: Roma, Viterbo, Rieti, Latina.
-- Compliant with Italian animal welfare standards (15-digit microchips, 60+ days age, health records).

DO $$
DECLARE
  -- Organization IDs
  v_org_muratella uuid := 'a1000000-0000-0000-0000-000000000001';
  v_org_portese   uuid := 'a1000000-0000-0000-0000-000000000002';
  v_org_viterbo   uuid := 'a1000000-0000-0000-0000-000000000003';
  v_org_rieti     uuid := 'a1000000-0000-0000-0000-000000000004';
  v_org_latina    uuid := 'a1000000-0000-0000-0000-000000000005';

  -- Animal IDs
  v_a_luna     uuid := 'b1000000-0000-0000-0000-000000000001';
  v_a_thor     uuid := 'b1000000-0000-0000-0000-000000000002';
  v_a_mia      uuid := 'b1000000-0000-0000-0000-000000000003';
  v_a_rocky    uuid := 'b1000000-0000-0000-0000-000000000004';
  v_a_stella   uuid := 'b1000000-0000-0000-0000-000000000005';
  v_a_oliver   uuid := 'b1000000-0000-0000-0000-000000000006';
  v_a_briciola uuid := 'b1000000-0000-0000-0000-000000000007';
  v_a_cesare   uuid := 'b1000000-0000-0000-0000-000000000008';

  -- Listing IDs
  v_l_luna     uuid := 'c1000000-0000-0000-0000-000000000001';
  v_l_thor     uuid := 'c1000000-0000-0000-0000-000000000002';
  v_l_mia      uuid := 'c1000000-0000-0000-0000-000000000003';
  v_l_rocky    uuid := 'c1000000-0000-0000-0000-000000000004';
  v_l_stella   uuid := 'c1000000-0000-0000-0000-000000000005';
  v_l_oliver   uuid := 'c1000000-0000-0000-0000-000000000006';
  v_l_briciola uuid := 'c1000000-0000-0000-0000-000000000007';
  v_l_cesare   uuid := 'c1000000-0000-0000-0000-000000000008';

BEGIN

  -- ── 1. Organizazioni Partner (Lazio) ──────────────────────────────────────────

  INSERT INTO public.organizations (id, type, name, slug, region, city, description, verification_status)
  VALUES
    (v_org_muratella, 'shelter', 'Rifugio Muratella', 'rifugio-muratella', 'Lazio', 'Roma',
     'Struttura storica di accoglienza per cani e gatti del territorio romano. Promuoviamo adozioni responsabili con percorsi di affiancamento.', 'verified'),
    (v_org_portese, 'association', 'Oasi Felina Porta Portese', 'oasi-felina-porta-portese', 'Lazio', 'Roma',
     'Associazione di volontariato dedicata alla cura, sterilizzazione e adozione di gatti abbandonati o provenienti da colonie feline romane.', 'verified'),
    (v_org_viterbo, 'shelter', 'ENPA Sezione di Viterbo', 'enpa-viterbo', 'Lazio', 'Viterbo',
     'Rifugio canino nella Tuscia. Accogliamo animali in difficoltà offrendo cure veterinarie e percorsi educativi per un corretto inserimento in famiglia.', 'verified'),
    (v_org_rieti, 'association', 'Amici a 4 Zampe Rieti', 'amici-4-zampe-rieti', 'Lazio', 'Rieti',
     'Associazione operante nella provincia di Rieti per il recupero e la riabilitazione di cani randagi e padronali in cerca di una seconda opportunità.', 'verified'),
    (v_org_latina, 'shelter', 'Rifugio San Francesco Latina', 'rifugio-san-francesco-latina', 'Lazio', 'Latina',
     'Canile rifugio dell''Agro Pontino, impegnato nella lotta al randagismo e nell''adozione consapevole di cani di ogni taglia ed età.', 'verified')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    verification_status = EXCLUDED.verification_status;

  -- Dati privati delle organizzazioni (visibili solo ad amministratori e membri)
  INSERT INTO public.organization_private (organization_id, legal_name, registration_number, contact_email, contact_phone)
  VALUES
    (v_org_muratella, 'Associazione Amici del Rifugio Muratella ODV', 'CF 97000000001', 'adozioni@muratella.roma.it', '+39 06 1234567'),
    (v_org_portese, 'Oasi Felina di Porta Portese ETS', 'CF 97000000002', 'gatti@portaportese.it', '+39 06 2345678'),
    (v_org_viterbo, 'ENPA Onlus Sezione Provinciale di Viterbo', 'CF 80000000003', 'viterbo@enpa.org', '+39 0761 345678'),
    (v_org_rieti, 'Associazione Animalista Amici a 4 Zampe ODV', 'CF 90000000004', 'info@amici4zamperieti.org', '+39 0746 456789'),
    (v_org_latina, 'Rifugio San Francesco Agro Pontino APS', 'CF 91000000005', 'adozioni@sanfrancescolatina.it', '+39 0773 567890')
  ON CONFLICT (organization_id) DO NOTHING;

  -- ── 2. Schede Animali ───────────────────────────────────────────────────────

  INSERT INTO public.animals (
    id, organization_id, name, species, breed, sex, birth_date, size,
    good_with_kids, good_with_dogs, good_with_cats, apartment_ok, city, status, story
  )
  VALUES
    (v_a_luna, v_org_muratella, 'Luna', 'dog', 'Meticcio Pastore Maremmano', 'F',
     (CURRENT_DATE - INTERVAL '2 years')::date, 'large',
     true, true, false, false, 'Roma', 'active',
     'Luna è una cucciolona affettuosa e maestosa. Adora correre nei prati e fare lunghe passeggiate. Cerca una famiglia con giardino o spazi verdi vicini.'),

    (v_a_thor, v_org_viterbo, 'Thor', 'dog', 'Segugio Italiano mix', 'M',
     (CURRENT_DATE - INTERVAL '3 years')::date, 'medium',
     true, true, true, true, 'Viterbo', 'active',
     'Thor è un segugietto docile e tranquillo. Bravissimo al guinzaglio, socievole con cani e gatti, ideale anche per famiglie in appartamento.'),

    (v_a_mia, v_org_portese, 'Mia', 'cat', 'Europeo Tigrato', 'F',
     (CURRENT_DATE - INTERVAL '1 year')::date, 'small',
     true, true, true, true, 'Roma', 'active',
     'Mia è una gattina vivace e curiosa. Ama le coccole sul divano e osservare il mondo dalla finestra. Abituata alla vita domestica e alla lettiera.'),

    (v_a_rocky, v_org_rieti, 'Rocky', 'dog', 'Meticcio taglia media', 'M',
     (CURRENT_DATE - INTERVAL '4 years')::date, 'medium',
     true, true, false, true, 'Rieti', 'active',
     'Rocky ha uno sguardo dolce e profondo. Recuperato dopo un abbandono, ora cerca il suo riscatto in una casa accogliente dove ricevere affetto sincero.'),

    (v_a_stella, v_org_latina, 'Stella', 'dog', 'Setter Inglese mix', 'F',
     (CURRENT_DATE - INTERVAL '2 years')::date, 'medium',
     true, true, true, true, 'Latina', 'active',
     'Stella è dolcissima e solare. Compatibile con ogni membro della famiglia, perfetta per persone attive che amano le passeggiate all''aria aperta.'),

    (v_a_oliver, v_org_portese, 'Oliver', 'cat', 'Europeo Certosino mix', 'M',
     (CURRENT_DATE - INTERVAL '2 years')::date, 'small',
     true, false, true, true, 'Roma', 'active',
     'Oliver è un gattone placido dal pelo grigio cenere. Ama la tranquillità, i sonnellini al sole e fusa a non finire. Ideale per ambienti sereni.'),

    (v_a_briciola, v_org_viterbo, 'Briciola', 'dog', 'Volpino mix', 'F',
     (CURRENT_DATE - INTERVAL '1 year')::date, 'small',
     true, true, true, true, 'Viterbo', 'active',
     'Piccola di statura ma dal cuore immenso. Briciola pesa 6 kg ed è la compagna perfetta per qualsiasi appartamento in città. Sempre allegra!'),

    (v_a_cesare, v_org_latina, 'Cesare', 'dog', 'Corso / Meticcio molossoide', 'M',
     (CURRENT_DATE - INTERVAL '5 years')::date, 'large',
     false, false, false, false, 'Latina', 'active',
     'Cesare è un gigante buono con le persone di cui si fida. Richiede adottanti esperti conoscitori della razza e una casa con spazio all''aperto.')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    story = EXCLUDED.story;

  -- Dati sanitari pubblici (vaccinazione, sterilizzazione, note)
  INSERT INTO public.animal_health (animal_id, vaccinated, sterilized, notes)
  VALUES
    (v_a_luna, true, true, 'Vaccinazioni e richiami regolari. Test Leishmania ed Ehrlichia negativo.'),
    (v_a_thor, true, true, 'Sano, esami del sangue perfetti. Microchippato e sverminato.'),
    (v_a_mia, true, true, 'FIV/FeLV negativa. Libretto sanitario completo.'),
    (v_a_rocky, true, true, 'Cardiopatia assente, profilo leishmania negativo. In ottima salute.'),
    (v_a_stella, true, true, 'Sterilizzata a 1 anno, tutti i vaccini in regola.'),
    (v_a_oliver, true, true, 'Test FIV/FeLV negativo. Esame feci negativo, pelo curato.'),
    (v_a_briciola, true, true, 'Dentatura perfetta, trattata con antiparassitario mensile.'),
    (v_a_cesare, true, true, 'Vaccinato regolarmente, lastre anche e gomiti nella norma.')
  ON CONFLICT (animal_id) DO UPDATE SET
    vaccinated = EXCLUDED.vaccinated,
    sterilized = EXCLUDED.sterilized;

  -- Microchip privato (15 cifre standard italiano ISO 11784/11785 - codice paese 380)
  INSERT INTO public.animal_private (animal_id, microchip_number)
  VALUES
    (v_a_luna, '380260000000001'),
    (v_a_thor, '380260000000002'),
    (v_a_mia, '380260000000003'),
    (v_a_rocky, '380260000000004'),
    (v_a_stella, '380260000000005'),
    (v_a_oliver, '380260000000006'),
    (v_a_briciola, '380260000000007'),
    (v_a_cesare, '380260000000008')
  ON CONFLICT (animal_id) DO NOTHING;

  -- ── 3. Annunci Pubblicati ───────────────────────────────────────────────────

  INSERT INTO public.listings (id, animal_id, type, status, slug, published_at, expires_at)
  VALUES
    (v_l_luna, v_a_luna, 'adoption', 'published', 'luna-pastore-maremmano-roma', NOW(), NOW() + INTERVAL '90 days'),
    (v_l_thor, v_a_thor, 'adoption', 'published', 'thor-segugio-italiano-viterbo', NOW(), NOW() + INTERVAL '90 days'),
    (v_l_mia, v_a_mia, 'adoption', 'published', 'mia-gatta-tigrata-roma', NOW(), NOW() + INTERVAL '90 days'),
    (v_l_rocky, v_a_rocky, 'adoption', 'published', 'rocky-meticcio-rieti', NOW(), NOW() + INTERVAL '90 days'),
    (v_l_stella, v_a_stella, 'adoption', 'published', 'stella-setter-latina', NOW(), NOW() + INTERVAL '90 days'),
    (v_l_oliver, v_a_oliver, 'adoption', 'published', 'oliver-certosino-roma', NOW(), NOW() + INTERVAL '90 days'),
    (v_l_briciola, v_a_briciola, 'adoption', 'published', 'briciola-volpino-viterbo', NOW(), NOW() + INTERVAL '90 days'),
    (v_l_cesare, v_a_cesare, 'adoption', 'published', 'cesare-corso-latina', NOW(), NOW() + INTERVAL '90 days')
  ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    published_at = EXCLUDED.published_at;

  -- Foto degli annunci (placeholder con alt text in italiano per accessibilità)
  INSERT INTO public.listing_photos (listing_id, storage_path, position, alt_text)
  VALUES
    (v_l_luna, 'animals/luna-1.webp', 0, 'Luna, cane bianco pastore maremmano seduta sull''erba guardando verso l''obiettivo'),
    (v_l_thor, 'animals/thor-1.webp', 0, 'Thor, segugio dal manto fulvo in posa attenta nel cortile del rifugio'),
    (v_l_mia, 'animals/mia-1.webp', 0, 'Mia, gattina europea tigrata con occhi verdi curiosi mentre gioca'),
    (v_l_rocky, 'animals/rocky-1.webp', 0, 'Rocky, cane meticcio fulvo e nero con orecchie ritte e sguardo vivace'),
    (v_l_stella, 'animals/stella-1.webp', 0, 'Stella, setter bianco e nero con pelo setoso in attesa al guinzaglio'),
    (v_l_oliver, 'animals/oliver-1.webp', 0, 'Oliver, gatto dal fitto pelo grigio disteso comodamente al sole'),
    (v_l_briciola, 'animals/briciola-1.webp', 0, 'Briciola, piccola cagnolina bianca e crema con musetto vispo'),
    (v_l_cesare, 'animals/cesare-1.webp', 0, 'Cesare, imponente cane corso tigrato dal portamento nobile')
  ON CONFLICT (listing_id, position) DO NOTHING;

END $$;
