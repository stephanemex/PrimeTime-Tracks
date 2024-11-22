/**
 * Analyse un chemin de fichier et extrait les informations principales.
 * @param {string} filePath - Chemin ou nom du fichier.
 * @returns {Object} - Objet contenant les informations extraites ou indiquant que le fichier est ignoré.
 */
function parseFileName(filePath) {
    if (!filePath || typeof filePath !== "string") {
        console.warn("Chemin ou nom de fichier invalide :", filePath);
        return {
            label: "Inconnu",
            album: "Inconnu",
            track: "Inconnu",
            title: "Inconnu",
            artist: "Inconnu",
        };
    }

    // Définir les extensions supportées et ignorées
    const supportedExtensions = [".aif", ".aiff", ".wav", ".mp3"];
    const ignoredExtensions = [".mp4", ".mov", ".mxf"];

    // Identifier l'extension du fichier
    const extension = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();

    if (ignoredExtensions.includes(extension)) {
        console.warn("Fichier ignoré (extension non prise en charge) :", filePath);
        return {
            label: "Ignoré",
            album: "",
            track: "",
            title: "",
            artist: "",
        };
    }

    if (!supportedExtensions.includes(extension)) {
        console.warn("Extension inconnue ou non supportée :", extension);
        return {
            label: "Extension inconnue",
            album: "",
            track: "",
            title: "",
            artist: "",
        };
    }

    // Supprimer l'extension pour traiter le nom du fichier
    const fileName = filePath.replace(/\.[^/.]+$/, "");

    // Découper le nom en parties basées sur les séparateurs (adapté à vos conventions de nommage)
    const parts = fileName.split("_");

    return {
        label: parts[0] || "Inconnu",
        album: parts[1] || "Inconnu",
        track: parts[2] || "Inconnu",
        title: parts.slice(3, -1).join(" ") || "Inconnu",
        artist: parts[parts.length - 1] || "Inconnu",
    };
}

/**
 * Décoder une valeur XMP brute pour extraire un temps en secondes.
 * @param {string} value - Valeur XMP brute (exemple : "time:63567504000f254016000000").
 * @returns {number} - Temps en secondes, ou 0 si le format est invalide.
 */
function decodeXMPTimeValue(value) {
    if (!value.startsWith("time:")) {
        console.warn("Format de timecode invalide :", value);
        return 0;
    }

    const hexTimecode = value.slice(5).split(/[a-f]+/i)[0]; // Séparer les parties hexadécimales des suffixes
    if (hexTimecode.length > 12) { // 12 caractères suffisent pour les plages réalistes
        console.warn("Timecode trop long ou hors limites :", value);
        return 0;
    }

    const seconds = parseInt(hexTimecode, 16);
    if (isNaN(seconds) || seconds < 0 || seconds > 3153600000) {
        console.warn("Timecode hors limites ou invalide :", value);
        return 0;
    }

    return seconds;
}


/**
 * Convertir un temps en secondes en timecode au format HH:MM:SS:FF.
 * @param {number} seconds - Temps en secondes.
 * @param {number} fps - Nombre d'images par seconde (par défaut 25).
 * @returns {string} - Timecode au format HH:MM:SS:FF.
 */
function convertSecondsToTimecode(seconds, fps = 25) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * fps);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}

/**
 * Fonction principale pour extraire les timecodes et la durée depuis des valeurs XMP.
 * @param {string} fromPart - Valeur brute XMP du début.
 * @param {string} toPart - Valeur brute XMP de fin.
 * @returns {Object} - Objet contenant `timecodeIn`, `timecodeOut`, et `duration`.
 */
function parseTimecodesForXMP(fromPart, toPart) {
    const startSeconds = decodeXMPTimeValue(fromPart);
    const endSeconds = decodeXMPTimeValue(toPart);

    const timecodeIn = convertSecondsToTimecode(startSeconds);
    const timecodeOut = convertSecondsToTimecode(endSeconds);
    const duration = convertSecondsToTimecode(Math.max(endSeconds - startSeconds, 0));

    return { timecodeIn, timecodeOut, duration };
}

// Exposer les fonctions via un objet global
window.utils = {
    parseFileName,
    convertSecondsToTimecode,
    parseTimecodesForXMP,
    decodeXMPTimeValue,
};
