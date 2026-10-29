export const reportReasons = [
    "suspected_scam",
    "commercial_sale_prohibited",
    "underage_animal",
    "illegal_import_or_no_microchip",
    "animal_welfare_concern",
    "inappropriate_content",
    "other",
] as const;

export type ReportReason = (typeof reportReasons)[number];

export const reportStatuses = [
    "pending",
    "investigating",
    "resolved_takedown",
    "dismissed",
] as const;

export type ReportStatus = (typeof reportStatuses)[number];

export const reportContent = {
    modal: {
        title: "Segnala questo annuncio",
        subtitle:
            "Aiutaci a mantenere la piattaforma sicura e rispettosa del benessere animale. Tutte le segnalazioni vengono esaminate dal nostro team di moderazione.",
        triggerButton: "Segnala annuncio",
        reasonLabel: "Motivo della segnalazione",
        detailsLabel: "Dettagli o prove a supporto (almeno 10 caratteri)",
        detailsPlaceholder: "Descrivi il problema in modo dettagliato...",
        submitButton: "Invia segnalazione",
        cancelButton: "Annulla",
        success: "Segnalazione inviata con successo. La esamineremo al più presto.",
    },
    reasons: {
        suspected_scam: "Sospetta truffa o richiesta di denaro non consentita",
        commercial_sale_prohibited: "Vendita a scopo di lucro non autorizzata",
        underage_animal: "Cucciolo di età inferiore a 60 giorni",
        illegal_import_or_no_microchip: "Assenza di microchip obbligatorio o importazione illecita",
        animal_welfare_concern: "Preoccupazione per il benessere o condizioni dell'animale",
        inappropriate_content: "Contenuto o foto inappropriati / offensivi",
        other: "Altro motivo",
    } satisfies Record<ReportReason, string>,
    statuses: {
        pending: "In attesa",
        investigating: "In revisione",
        resolved_takedown: "Rimosso",
        dismissed: "Archiviato",
    } satisfies Record<ReportStatus, string>,
    admin: {
        title: "Coda di Moderazione & Segnalazioni",
        subtitle: "Revisiona le segnalazioni degli utenti e applica takedown immediati se violano le policy.",
        empty: "Nessuna segnalazione aperta al momento.",
        takedownAction: "Rimuovi annuncio (Takedown)",
        dismissAction: "Archivia segnalazione",
        notesPlaceholder: "Note di risoluzione per l'audit log...",
        confirmPrompt: "Sei sicuro di voler rimuovere definitivamente questo annuncio?",
    },
    errors: {
        unauthenticated: "Devi aver effettuato l'accesso per inviare una segnalazione.",
        unauthorized: "Non hai i permessi per eseguire questa operazione di moderazione.",
        invalidListing: "Annuncio non valido.",
        invalidReason: "Seleziona un motivo valido tra quelli indicati.",
        detailsTooShort: "I dettagli della segnalazione devono contenere almeno 10 caratteri.",
        detailsTooLong: "I dettagli non possono superare 2000 caratteri.",
        generic: "Si è verificato un errore imprevisto. Riprova più tardi.",
    },
};
