// DOM prêt
document.addEventListener("DOMContentLoaded", function () {
    console.log("Initialisation du gestionnaire de fichiers");

    // Références aux éléments HTML
    const fileInput = document.getElementById("input-files");
    const uploadLabel = document.getElementById("file-upload-label");
    const extractBtn = document.getElementById("extract-btn");
    const toggle = document.getElementById("file-type-toggle");
    const fcpxIcon = document.getElementById("fcpx-icon");
    const xmpIcon = document.getElementById("xmp-icon");

    // Gestion des types de fichiers et des icônes en fonction du toggle
    function updateUIBasedOnToggle() {
        if (toggle.checked) {
            // Mode XMP activé
            uploadLabel.textContent = "Sélectionner les fichiers XMP";
            fileInput.setAttribute("accept", ".xmp");
            fcpxIcon.classList.add("hidden");
            xmpIcon.classList.remove("hidden");
            console.log("Mode sélectionné : XMP");
        } else {
            // Mode FCPXML activé
            uploadLabel.textContent = "Sélectionner les fichiers FCPXML";
            fileInput.setAttribute("accept", ".xml,.fcpxml,.fcpxmld");
            xmpIcon.classList.add("hidden");
            fcpxIcon.classList.remove("hidden");
            console.log("Mode sélectionné : FCPXML");
        }

        resetFileInputState();
    }

    // Réinitialise l'état du champ de fichier
    function resetFileInputState() {
        fileInput.value = ""; // Vide l'input
        uploadLabel.textContent = "Sélectionner les fichiers";
        uploadLabel.classList.remove("uploaded");
        extractBtn.style.display = "none"; // Masque le bouton d'extraction
    }

    // Gestion des fichiers sélectionnés
    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0]; // Premier fichier sélectionné
        const fileName = file ? file.name : "";

        console.log("Fichier sélectionné :", file);
        console.log("Nom du fichier :", fileName);

        if (fileName) {
            uploadLabel.textContent = `Fichier sélectionné : ${fileName}`;
            uploadLabel.classList.add("uploaded");

            // Vérification selon le mode sélectionné
            if (toggle.checked) {
                handleXmpFile(file, fileName); // Mode XMP
            } else {
                handleFcpxmlFile(file, fileName); // Mode FCPXML
            }
        } else {
            console.log("Aucun fichier sélectionné");
            resetFileInputState();
        }
    });

    // Gestion du toggle : met à jour l'interface
    toggle.addEventListener("change", updateUIBasedOnToggle);

    // Initialisation : ajuste l'interface selon l'état initial du toggle
    updateUIBasedOnToggle();

    console.log("Gestionnaire de fichiers FCPXML/XMP prêt.");

    // **Traitement spécifique pour les fichiers FCPXML**
    async function handleFcpxmlFile(file, fileName) {
        if (fileName.endsWith(".fcpxmld") || fileName.endsWith(".fcpxmld.zip")) {
            console.log("Fichier .fcpxmld détecté");
            extractBtn.style.display = "inline-block"; // Affiche le bouton d'extraction
        } else if (fileName.endsWith(".fcpxml")) {
            console.log("Fichier FCPXML détecté");
            extractBtn.style.display = "none";

            try {
                const fileContent = await file.text();
                console.log("Traitement du fichier FCPXML :", fileName);
                handleFcpxml(fileContent); // Appel de la fonction dédiée
            } catch (error) {
                console.error("Erreur lors du traitement FCPXML :", error);
                showMessage("Erreur lors du traitement FCPXML.", "error");
            }
        } else {
            console.warn("Fichier incompatible pour le mode FCPXML :", fileName);
            uploadLabel.textContent = "Fichier incompatible pour le mode FCPXML";
        }
    }

    // **Traitement spécifique pour les fichiers XMP**
    async function handleXmpFile(file, fileName) {
        if (fileName.endsWith(".xmp")) {
            console.log("Fichier XMP détecté");
            extractBtn.style.display = "none"; // Aucune extraction pour les fichiers XMP

            try {
                const fileContent = await file.text();
                console.log("Traitement du fichier XMP :", fileName);
                processXmp(fileContent, fileName); // Appel de la fonction dédiée
            } catch (error) {
                console.error("Erreur lors du traitement XMP :", error);
                showMessage("Erreur lors du traitement XMP.", "error");
            }
        } else {
            console.warn("Fichier incompatible pour le mode XMP :", fileName);
            uploadLabel.textContent = "Fichier incompatible pour le mode XMP";
        }
    }

    // **Gestion du bouton d'extraction**
    extractBtn.addEventListener("click", async function () {
        console.log("Bouton d'extraction cliqué");
        const file = fileInput.files[0];
        if (file && (file.name.endsWith(".fcpxmld") || file.name.endsWith(".fcpxmld.zip"))) {
            console.log("Fichier .fcpxmld valide sélectionné :", file.name);
            try {
                const xmlContent = await extractFcpxmlFromPackage(file);
                if (xmlContent) {
                    console.log("Contenu FCPXML extrait avec succès (premiers 200 caractères) :", xmlContent.substring(0, 200));
                    showMessage("Extraction réussie ! Vous pouvez maintenant générer l'aperçu.", "success");
                    processXml(xmlContent, file.name); // Appelle la fonction de traitement FCPXML
                } else {
                    console.error("Échec de l'extraction du contenu FCPXML");
                    showMessage("Échec de l'extraction du fichier FCPXML. Veuillez vérifier le fichier.", "error");
                }
            } catch (error) {
                console.error("Erreur lors de l'extraction :", error);
                showMessage("Erreur lors de l'extraction du fichier FCPXML : " + error.message, "error");
            }
        } else {
            console.error("Fichier invalide ou non sélectionné :", file ? file.name : "aucun fichier");
            showMessage("Veuillez sélectionner un fichier .fcpxmld ou .fcpxmld.zip valide.", "error");
        }
    });
});

    // **Fusionne toutes les données des fichiers CSV**
    function combineCsvData(importedCsvFiles) {
        return importedCsvFiles.flatMap(file => file.data); // Fusionne les données
    }

    // **Générer l'aperçu du projet**
    if (processBtn) {
        processBtn.addEventListener("click", function () {
            console.log("Génération de l'aperçu demandée.");
            console.log("Données globales actuellement stockées :", globalOutputData);

            if (!importedCsvFiles || importedCsvFiles.length === 0) {
                console.warn("Aucun fichier CSV importé pour enrichir les données.");
            } else {
                const combinedCsvData = combineCsvData(importedCsvFiles); // Combine les données de tous les fichiers CSV
                console.log("Données combinées des CSV :", combinedCsvData);

                // Enrichir les données du projet avec les données CSV combinées
                enrichWithMappings(globalOutputData, combinedCsvData);
            }

            displayPreview(globalOutputData, projectName || "Projet en cours");
        });
    } else {
        console.error("Bouton d'aperçu (processBtn) non trouvé dans le DOM.");
    }
    console.log("Gestionnaire de fichiers FCPXML prêt.");

    // Extraction automatique du contenu FCPXML depuis .fcpxmld
    extractBtn.addEventListener("click", async function () {
        console.log("Bouton d'extraction cliqué");
        const file = fileInput.files[0];
        if (file && (file.name.endsWith(".fcpxmld") || file.name.endsWith(".fcpxmld.zip"))) {
            console.log("Fichier .fcpxmld valide sélectionné :", file.name);
            try {
                const xmlContent = await extractFcpxmlFromPackage(file);
                if (xmlContent) {
                    fcpxmlExtractedContent = xmlContent;
                    console.log("Contenu FCPXML extrait avec succès (premiers 200 caractères) :", fcpxmlExtractedContent.substring(0, 200));
                    showMessage("Extraction réussie ! Vous pouvez maintenant générer l'aperçu.", "success");
                    processXml(fcpxmlExtractedContent, file.name);
                } else {
                    console.error("Échec de l'extraction du contenu FCPXML");
                    showMessage("Échec de l'extraction du fichier FCPXML. Veuillez vérifier le fichier.", "error");
                }
            } catch (error) {
                console.error("Erreur lors de l'extraction :", error);
                showMessage("Erreur lors de l'extraction du fichier FCPXML : " + error.message, "error");
            }
        } else {
            console.error("Fichier invalide ou non sélectionné :", file ? file.name : "aucun fichier");
            showMessage("Veuillez sélectionner un fichier .fcpxmld ou .fcpxmld.zip valide.", "error");
        }
    });

    // Générer l'aperçu du projet
    processBtn.addEventListener("click", function () {
        console.log("Génération de l'aperçu demandée.");
        console.log("Données globales actuellement stockées :", globalOutputData);
        displayPreview(globalOutputData, projectName || "Projet en cours");
    });

    console.log("Gestionnaire de fichiers FCPXML prêt.");

// Fonction pour afficher des messages
function showMessage(message, type = "info") {
    const messageContainer = document.getElementById("message");
    if (!messageContainer) return;
    messageContainer.innerText = message;
    messageContainer.className = `message ${type}`;
}

// Fonction pour extraire le contenu FCPXML
async function extractFcpxmlFromPackage(file) {
    console.log("Début de l'extraction pour le fichier :", file.name);
    try {
        const arrayBuffer = await file.arrayBuffer();
        console.log("Fichier lu comme ArrayBuffer");

        const zip = await JSZip.loadAsync(arrayBuffer);
        console.log("Fichier décompressé avec JSZip");

        const fcpxmlFile = zip.file(/.*Info\.fcpxml$/i)[0];
        if (fcpxmlFile) {
            console.log("Fichier Info.fcpxml trouvé :", fcpxmlFile.name);
            const content = await fcpxmlFile.async("string");
            console.log("Contenu XML extrait (premiers 200 caractères) :", content.substring(0, 200));
            return content;
        } else {
            console.error("Aucun fichier Info.fcpxml trouvé dans le paquet");
            return null;
        }
    } catch (error) {
        console.error("Erreur lors de l'extraction :", error);
        return null;
    }
}

//Fonction de traitement des fichiers FCPCML
function processXml(xmlContent, fileName, fps = 25) {
    console.log("Début du traitement XML pour le fichier :", fileName);

    // 1. Parse le contenu XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "application/xml");

    // Vérification des erreurs de parsing
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        console.error("Erreur de parsing XML :", xmlDoc.getElementsByTagName("parsererror")[0].textContent);
        return;
    }

    // 2. Identifier la durée totale de la séquence
    const sequence = xmlDoc.getElementsByTagName("sequence")[0];
    let sequenceDuration = 0; // En secondes
    if (sequence && sequence.getAttribute("duration")) {
        sequenceDuration = parseFraction(sequence.getAttribute("duration"));
        console.log("Durée totale de la séquence :", sequenceDuration, "secondes");
    } else {
        console.warn("Durée de la séquence introuvable. Aucun filtre basé sur la durée ne sera appliqué.");
    }

    // 3. Recherche des `asset-clip`
    const assetClips = Array.from(xmlDoc.getElementsByTagName("asset-clip"));
    console.log("Nombre de asset-clip dans le fichier :", assetClips.length);

    // 4. Trouver le décalage initial minimal
    const offsets = assetClips.map(clip => parseFraction(clip.getAttribute("offset") || "0/1s"));
    const minOffset = Math.min(...offsets); // Décalage minimum trouvé
    console.log("Décalage initial minimal trouvé :", minOffset, "secondes");

    const data = []; // Contiendra les données extraites

    // 5. Traitement de chaque `asset-clip`
    for (let assetClip of assetClips) {
        const name = cleanText(assetClip.getAttribute("name") || "");
        console.log("Traitement de l'asset :", name);

        // Vérification si c'est une musique
        const isMusic = couldBeMusicAsset(name);
        if (!isMusic) {
            console.log("Asset ignoré (non musical) :", name);
            continue;
        }

        // Extraction des attributs
        const rawOffset = parseFraction(assetClip.getAttribute("offset") || "0/1s");
        const offsetSeconds = rawOffset - minOffset; // Ajuste l'offset
        const durationSeconds = parseFraction(assetClip.getAttribute("duration") || "0/1s");

        // Filtrer les clips hors séquence
        if (sequenceDuration > 0 && offsetSeconds > sequenceDuration) {
            console.warn(`Clip ignoré car hors séquence (offset : ${offsetSeconds}s, durée : ${sequenceDuration}s) :`, name);
            continue;
        }

        // Logs détaillés pour debug
        console.log(`Nom : ${name}`);
        console.log(`Offset brut : ${rawOffset}s | Offset ajusté : ${offsetSeconds}s`);
        console.log(`Durée : ${durationSeconds}s`);

        try {
            // Calcul des TC IN, TC OUT, et de la durée
            const tcIn = convertFramesToTimecode(Math.round(offsetSeconds * fps), fps);
            const tcOut = convertFramesToTimecode(Math.round((offsetSeconds + durationSeconds) * fps), fps);
            const durationTimecode = convertFramesToTimecode(Math.round(durationSeconds * fps), fps);

            console.log("Extraction des timecodes pour :", name);
            console.log("TC IN:", tcIn, "TC OUT:", tcOut, "Durée:", durationTimecode);

            // Extraction des informations musicales
            const { label, album, trackName, artists } = extractMusicInfo(name, fileName.endsWith(".fcpxmld"));

            // Ajout des données au tableau
            data.push({
                label: label || "Inconnu",
                albumCode: "Inconnu",
                albumTitle: album || "Inconnu",
                trackTitle: trackName || "Inconnu",
                artists: artists || "Inconnu",
                composers: "Inconnu",
                tcin: tcIn,
                tcout: tcOut,
                duration: durationTimecode,
            });
        } catch (error) {
            console.error("Erreur lors du traitement de l'asset :", name, error);
        }
    }

    // 6. Ajout des données à la sortie globale
    if (data.length > 0) {
        globalOutputData.push({ file: fileName, data });
        console.log("Données extraites et ajoutées :", data);
    } else {
        console.warn("Aucune donnée musicale détectée.");
    }
}

//Nouveaux ajouts 
function handleFcpxml(xmlContent) {
    console.log("Début du traitement FCPXML");

    // Parser le contenu FCPXML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "application/xml");

    // Exemple d'utilisation d'offsetSeconds
    const clips = xmlDoc.getElementsByTagName("clip");
    for (let clip of clips) {
        const offset = clip.getAttribute("offset");
        if (!offset) continue;

        const offsetSeconds = convertFcpxmlOffsetToSeconds(offset);
        console.log("Offset en secondes :", offsetSeconds);

        // Traitement des clips avec offsetSeconds...
    }
}
//Nouveau convert
function convertFcpxmlOffsetToSeconds(offset, fps = 25) {
    const match = offset.match(/(\d+)s/); // Exemple : "3600s" => 3600 secondes
    if (match) {
        return parseInt(match[1], 10);
    }

    console.warn("Format d'offset FCPXML non reconnu :", offset);
    return 0;
}

// Nettoie les noms
function cleanText(text) {
    return text.replace(/_/g, " ").trim();
}

// Vérifie si un asset est musical
function couldBeMusicAsset(name) {
    const musicKeywords = ["Main", "Track", "TK", "OSMOSIS", "Music"];
    return musicKeywords.some((keyword) => name.toLowerCase().includes(keyword.toLowerCase()));
}

// Extraire des informations musicales d'un nom d'asset
function extractMusicInfo(name, isFcpxmld) {
    // Nettoyage des caractères indésirables
    name = name.replace(/_/g, " ").trim();

    // Expression régulière pour détecter des informations structurées (ex. Label - Album - TrackName - Artists)
    const regex = /^(.*?)\s-\s(.*?)\s-\s(.*?)\s-\s(.*?)$/;

    // Si le nom correspond à la structure, extraire les parties
    const match = name.match(regex);
    if (match) {
        return {
            label: match[1] || "Inconnu",
            album: match[2] || "Inconnu",
            trackName: match[3] || "Inconnu",
            artists: match[4] || "Inconnu",
        };
    }

    // Sinon, utiliser un découpage basique
    const parts = name.split(isFcpxmld ? "_" : "-");
    return {
        label: parts[0] || "Inconnu",
        album: parts[1] || "Inconnu",
        trackNumber: parts[2] || "Inconnu",
        trackName: parts[3] || name,
        artists: parts.slice(4).join(" ") || "Inconnu",
    };
}


// Convertit des frames en timecode (HH:MM:SS:Frames)
function convertFramesToTimecode(totalFrames, fps = 25) {
    const hours = Math.floor(totalFrames / (fps * 3600));
    const minutes = Math.floor((totalFrames % (fps * 3600)) / (fps * 60));
    const seconds = Math.floor((totalFrames % (fps * 60)) / fps);
    const frames = totalFrames % fps;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}

// Calcule les frames à partir d'une fraction
function parseFraction(fraction) {
    const [numerator, denominator] = fraction.replace(/s$/, "").split("/").map(Number);
    return !isNaN(numerator) && !isNaN(denominator) && denominator !== 0 ? numerator / denominator : 0;
}

