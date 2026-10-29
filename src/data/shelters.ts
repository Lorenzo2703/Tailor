import type { Shelter } from "@/lib/types";

export const shelters: Shelter[] = [
    {
        id: "rifugio-nuvole-di-latta",
        name: "Rifugio Nuvole di Latta",
        city: "Torino",
        region: "Piemonte",
        description:
            "Un rifugio immaginario tra sentieri tranquilli e cucce colorate, nato per raccontare le storie di animali in cerca di casa.",
        adoptionsCompleted: 128,
        verified: true,
    },
    {
        id: "porto-dei-baffi-blu",
        name: "Porto dei Baffi Blu",
        city: "Bologna",
        region: "Emilia-Romagna",
        description:
            "Una piccola casa di fantasia dove ogni musetto ha il suo spazio, i suoi tempi e una scheda tutta da scoprire.",
        adoptionsCompleted: 76,
        verified: true,
    },
    {
        id: "giardino-code-stellate",
        name: "Giardino delle Code Stellate",
        city: "Roma",
        region: "Lazio",
        description:
            "Un luogo inventato con un giardino ombreggiato e tante personalità diverse, pronto a far incontrare animali e famiglie.",
        adoptionsCompleted: 54,
        verified: false,
    },
    {
        id: "casa-bosco-tascabile",
        name: "Casa del Bosco Tascabile",
        city: "Firenze",
        region: "Toscana",
        description:
            "Un rifugio immaginario ispirato ai boschi toscani, con passeggiate lente, finestre al sole e nuove storie da iniziare.",
        adoptionsCompleted: 91,
        verified: true,
    },
];