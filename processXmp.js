/**
 * Fonction principale pour traiter un fichier XMP
 */
function processXmp(xmlContent, fileName, fps = 25) {
    console.log("Début du traitement XMP pour le fichier :", fileName);

    // Vérification si ce n'est pas un FCPXML
    if (xmlContent.includes("<fcpxml")) {
        console.error("Le fichier semble être un FCPXML, mais processXmp a été appelé.");
        return;
    }

    // 1. Parser le contenu XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "application/xml");

    // Vérification des erreurs de parsing
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        console.error("Erreur de parsing XML :", xmlDoc.getElementsByTagName("parsererror")[0].textContent);
        return;
    }

    // 2. Récupérer les clips dans le fichier XMP
    const xmpClips = xmlDoc.getElementsByTagName("rdf:li");
    console.log("Nombre de clips détectés dans le fichier XMP :", xmpClips.length);

    if (xmpClips.length === 0) {
        console.warn("Aucun clip détecté dans le fichier XMP :", fileName);
        return;
    }

    // 3. Extensions audio autorisées
    const allowedExtensions = [".aif", ".wav", ".mp3", ".diff"]; // Extensions autorisées

    // 4. Traiter chaque clip
    const data = []; // Stocke les données extraites
    for (let clip of xmpClips) {
        // Lecture du chemin du fichier audio
        const filePath = clip.getElementsByTagName("stRef:filePath")[0]?.textContent || "";
        if (!filePath) {
            console.warn("Aucun chemin de fichier trouvé pour un clip. Ignoré.");
            continue;
        }

        // Vérification de l'extension
        const extension = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            console.log("Fichier ignoré (non audio) :", filePath);
            continue;
        }

        // Lecture des autres métadonnées
        const title = filePath.substring(filePath.lastIndexOf("/") + 1); // Nom du fichier sans chemin
        const fromPart = clip.getElementsByTagName("stRef:fromPart")[0]?.textContent || "";
        const toPart = clip.getElementsByTagName("stRef:toPart")[0]?.textContent || "";

        if (!fromPart || !toPart) {
            console.warn("fromPart ou toPart manquant pour le fichier :", filePath);
            continue;
        }

        // Analyse des segments
        const fromSegments = fromPart.split(/f/i);
        const toSegments = toPart.split(/f/i);

        console.log("Segments de fromPart :", fromSegments);
        console.log("Segments de toPart :", toSegments);

       // Décoder le décalage temporel (TC IN) depuis `fromPart`
        const offsetSegment = fromSegments[0]; // Premier segment de fromPart (time:...)
        const offsetData = decodeOffset(offsetSegment, fps); // Décodage du décalage
        const offsetFrames = offsetData.frames; // Frames calculées
        const offsetSeconds = offsetData.seconds; // Secondes calculées
        const tcIn = convertFramesToTimecode(offsetFrames, fps); // Conversion en timecode humain

        console.log("TC IN calculé :", tcIn);

        // Décoder la durée (segment avec `d`) depuis `toPart`
        const durationSegment = toSegments.find((seg) => seg.includes("d"));
        const durationData = decodeDuration(durationSegment, fps);
        const durationFrames = durationData?.frames || 0;
        const durationSeconds = durationData?.seconds || 0;

        // Calculer TC OUT à partir de TC IN et de la durée
        const tcOut = convertFramesToTimecode(offsetFrames + durationFrames, fps);
        const durationTimecode = convertFramesToTimecode(durationFrames, fps);

        console.log("TC OUT calculé :", tcOut);
        console.log("Durée en timecode :", durationTimecode);


        console.log("Extraction des timecodes pour :", title);
        console.log("TC IN:", tcIn, "TC OUT:", tcOut, "Duration:", durationTimecode);

        // Ajouter au tableau
        data.push({
            label: "Inconnu",
            albumCode: "Inconnu",
            albumTitle: "Inconnu",
            trackTitle: title || "Inconnu",
            artists: "Inconnu",
            composers: "Inconnu",
            tcin: tcIn || "00:00:00:00",
            tcout: tcOut || "00:00:00:00",
            duration: durationTimecode || "00:00:00:00",
        });
    }

    // Ajout des données extraites
    if (data.length > 0) {
        globalOutputData.push({ file: fileName, data });
        console.log("Données XMP extraites et ajoutées :", data);
        console.table(data);
    } else {
        console.warn("Aucune donnée musicale détectée dans le fichier XMP.");
    }
}

/**
 * Décoder un segment représentant un décalage temporel
 */
/**
 * Décoder un segment représentant un décalage temporel (TC IN)
 */
function decodeOffset(segment, fps = 25) {
    try {
        // Nettoyer le segment pour extraire la valeur après "time:"
        const cleanSegment = segment.replace(/^time:/i, "");
        const rawValue = BigInt("0x" + cleanSegment); // Convertir la valeur hexadécimale en BigInt
        console.log(`Décalage brut extrait pour "${segment}" :`, rawValue.toString());

        // Calcul des frames
        const ticksPerFrame = BigInt(2736477746812); // Ticks par frame pour 25 fps
        const frames = rawValue / ticksPerFrame; // Diviser par le nombre de ticks par frame
        const seconds = Number(frames) / fps; // Convertir les frames en secondes

        console.log("Frames calculées pour le décalage :", frames.toString());
        console.log("Décalage en secondes :", seconds);

        return { frames: Number(frames), seconds };
    } catch (error) {
        console.error("Erreur lors du décodage du décalage temporel :", error);
        return { frames: 0, seconds: 0 }; // Retourner des valeurs par défaut en cas d'erreur
    }
}

/**
 * Décoder un segment représentant une durée
 */
function decodeDuration(segment, fps = 25) {
    try {
        const match = segment.match(/d([0-9a-f]+)/i);
        if (!match) {
            console.warn(`Aucune durée détectée dans le segment "${segment}"`);
            return null;
        }

        const rawValue = BigInt("0x" + match[1]);
        const ticksPerFrame = BigInt(2736477746812);
        const frames = rawValue / ticksPerFrame;
        const seconds = Number(frames) / fps;

        return { frames: Number(frames), seconds };
    } catch (error) {
        console.error("Erreur lors du décodage de la durée :", error);
        return null;
    }
}

/**
 * Convertir des frames en timecode humain (HH:MM:SS:FF)
 */
function convertFramesToTimecode(frames, fps = 25) {
    const totalSeconds = Math.floor(frames / fps);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const frameRemainder = frames % fps;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${frameRemainder.toString().padStart(2, "0")}`;
}
