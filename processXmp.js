function processXmp(xmlContent, fileName, fps = 25) {
    console.log("Début du traitement XMP pour le fichier :", fileName);

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "application/xml");
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        console.error("Erreur de parsing XML :", xmlDoc.getElementsByTagName("parsererror")[0].textContent);
        return;
    }

    // Sélection des clips
    const xmpClips = xmlDoc.getElementsByTagName("rdf:li");
    console.log("Nombre de clips détectés dans le fichier XMP :", xmpClips.length);

    const data = [];
    const allowedExtensions = [".aif", ".wav", ".mp3", ".diff"]; // Extensions autorisées

    for (let clip of xmpClips) {
        const filePath = clip.getElementsByTagName("stRef:filePath")[0]?.textContent || "";
        const extension = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();

        // Filtrage des fichiers non-audio
        if (!allowedExtensions.includes(extension)) {
            console.log("Fichier ignoré (non audio) :", filePath);
            continue;
        }

        // Lecture des autres métadonnées nécessaires
        const title = filePath.substring(filePath.lastIndexOf("/") + 1); // Nom du fichier sans le chemin
        const fromPart = clip.getElementsByTagName("stRef:fromPart")[0]?.textContent || "";
        const toPart = clip.getElementsByTagName("stRef:toPart")[0]?.textContent || "";

        const offsetSeconds = parseTimecode(fromPart);
        const toPartSeconds = parseTimecode(toPart);
        const durationSeconds = toPartSeconds - offsetSeconds;

        // Conversion en frames
        const offsetFrames = Math.round(offsetSeconds * fps);
        const durationFrames = Math.round(durationSeconds * fps);

        // Calcul des timecodes
        const tcIn = convertFramesToTimecode(offsetFrames, fps);
        const tcOut = convertFramesToTimecode(offsetFrames + durationFrames, fps);
        const durationTimecode = convertFramesToTimecode(durationFrames, fps);

        console.log("Extraction des timecodes pour :", title);
        console.log("TC IN:", tcIn, "TC OUT:", tcOut, "Duration:", durationTimecode);

        data.push({
            label: "Inconnu",
            albumCode: "Inconnu",
            albumTitle: "Inconnu",
            trackTitle: title,
            artists: "Inconnu",
            composers: "Inconnu",
            tcin: tcIn,
            tcout: tcOut,
            duration: durationTimecode,
        });
    }

    if (data.length > 0) {
        globalOutputData.push({ file: fileName, data });
        console.log("Données XMP extraites et ajoutées :", data);
    } else {
        console.warn("Aucune donnée musicale détectée dans le fichier XMP.");
    }
    console.log("Extraction des informations du fichier audio :");
    console.log("Nom du fichier :", filePath);
    console.log("fromPart (TC IN brut) :", fromPart);
    console.log("toPart (TC OUT brut) :", toPart);

}

// Fonction pour parser les timecodes dans le format XMP
function parseTimecode(timecode) {
    // Recherche du nombre après "time:"
    const match = timecode.match(/time:(\d+)/);
    if (!match) {
        console.warn("Timecode introuvable ou mal formaté :", timecode);
        return 0;
    }

    try {
        // Utilisation de BigInt pour éviter les erreurs de précision
        const rawValue = BigInt(match[1]); // Nombre brut extrait
        const fullSeconds = rawValue / BigInt(1e12); // Conversion en secondes
        return Number(fullSeconds); // Conversion en nombre normal
    } catch (error) {
        console.error("Erreur lors de la conversion du timecode :", error);
        return 0;
    }
}
