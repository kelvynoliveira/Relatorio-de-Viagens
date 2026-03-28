export interface Coordinate {
    lat: number;
    lng: number;
}

export const CITY_COORDINATES: Record<string, Coordinate> = {
    // Nordeste
    'RECIFE': { lat: -8.0539, lng: -34.8811 },
    'JOAO PESSOA': { lat: -7.1195, lng: -34.8450 },
    'CAMPINA GRANDE': { lat: -7.2247, lng: -35.8771 },
    'MACEIO': { lat: -9.6658, lng: -35.7353 },
    'ARACAJU': { lat: -10.9472, lng: -37.0731 },
    'SALVADOR': { lat: -12.9714, lng: -38.5014 },
    'NATAL': { lat: -5.7945, lng: -35.2110 },
    'FORTALEZA': { lat: -3.7172, lng: -38.5433 },
    'SAO LUIS': { lat: -2.5307, lng: -44.3068 },
    'TERESINA': { lat: -5.0920, lng: -42.8038 },
    'PARIPIRANGA': { lat: -10.6861, lng: -37.8571 },
    'FEIRA DE SANTANA': { lat: -12.2667, lng: -38.9667 },
    'CONQUISTA': { lat: -14.8611, lng: -40.8444 },
    'ITABUNA': { lat: -14.7900, lng: -39.2797 },
    'ILHEUS': { lat: -14.7889, lng: -39.0494 },
    'PETROLINA': { lat: -9.3983, lng: -40.5008 },
    'JUAZEIRO': { lat: -9.4121, lng: -40.5034 },
    'CARUARU': { lat: -8.2833, lng: -35.9667 },
    'MOSSORO': { lat: -5.1833, lng: -37.3500 },
    'JACOBINA': { lat: -11.1811, lng: -40.5181 },
    'SENHOR DO BONFIM': { lat: -10.4614, lng: -40.1878 },
    'IRECE': { lat: -11.3042, lng: -41.8558 },

    // Sudeste
    'SAO PAULO': { lat: -23.5505, lng: -46.6333 },
    'RIO DE JANEIRO': { lat: -22.9068, lng: -43.1729 },
    'BELO HORIZONTE': { lat: -19.9167, lng: -43.9345 },
    'CAMPINAS': { lat: -22.9056, lng: -47.0608 },
    'SANTOS': { lat: -23.9608, lng: -46.3339 },
    'SOROCABA': { lat: -23.5015, lng: -47.4521 },
    'RIBEIRAO PRETO': { lat: -21.1775, lng: -47.8103 },
    'VITORIA': { lat: -20.3155, lng: -40.3128 },
    'VILA VELHA': { lat: -20.3297, lng: -40.2922 },

    // Sul
    'CURITIBA': { lat: -25.4290, lng: -49.2671 },
    'FLORIANOPOLIS': { lat: -27.5954, lng: -48.5480 },
    'PORTO ALEGRE': { lat: -30.0346, lng: -51.2177 },

    // Centro-Oeste
    'BRASILIA': { lat: -15.7801, lng: -47.9292 },
    'GOIANIA': { lat: -16.6869, lng: -49.2648 },
    'CUIABA': { lat: -15.6014, lng: -56.0979 },
    'CAMPO GRANDE': { lat: -20.4697, lng: -54.6201 },

    // Norte
    'MANAUS': { lat: -3.1190, lng: -60.0217 },
    'BELEM': { lat: -1.4558, lng: -48.4902 },
    'PALMAS': { lat: -10.1844, lng: -48.3336 },
    'PORTO VELHO': { lat: -8.7612, lng: -63.9039 },
    'BOA VISTA': { lat: 2.8235, lng: -60.6758 },
    'MACAPA': { lat: 0.0347, lng: -51.0666 },
    'RIO BRANCO': { lat: -9.9747, lng: -67.8111 },

    // Aeroportos / Pontos Comuns / IATA
    'SSA': { lat: -12.9714, lng: -38.5014 }, // Salvador
    'REC': { lat: -8.0539, lng: -34.8811 },   // Recife
    'AEROPORTO': { lat: -8.1264, lng: -34.9230 }, // Default para Guararapes se for genérico
    'BASE': { lat: -8.0539, lng: -34.8811 },
};

export function getCoordinates(location: string): Coordinate | null {
    const normalized = location.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return CITY_COORDINATES[normalized] || null;
}
