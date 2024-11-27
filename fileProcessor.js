// DOM prêt
document.addEventListener("DOMContentLoaded", function () {
    console.log("Initialisation du gestionnaire de fichiers");

    // Références aux éléments HTML
    const fileInput = document.getElementById("input-files");
    const uploadLabel = document.querySelector(".file-upload-label");
    const extractBtn = document.getElementById("extract-btn");
    const processBtn = document.getElementById("process-btn");
    const toggle = document.getElementById("file-type-toggle");
    const fcpxIcon = document.getElementById("fcpx-icon");
    const xmpIcon = document.getElementById("xmp-icon");

    // Mode sélectionné (par défaut : FCPXML)
    let selectedMode = "fcpxml";

    // **Gestion du changement de mode avec l'interrupteur**
    toggle.addEventListener("change", () => {
        if (toggle.checked) {
            selectedMode = "xmp"; // Mode XMP sélectionné
            fileInput.accept = ".xmp"; // Types de fichiers acceptés
            fcpxIcon.classList.add("hidden");
            xmpIcon.classList.remove("hidden");
            console.log("Mode sélectionné : XMP");
        } else {
            selectedMode = "fcpxml"; // Mode FCPXML sélectionné
            fileInput.accept = ".xml,.fcpxml,.fcpxmld"; // Types de fichiers acceptés
            xmpIcon.classList.add("hidden");
            fcpxIcon.classList.remove("hidden");
            console.log("Mode sélectionné : FCPXML");
        }

        // Réinitialiser l'état des fichiers
        resetFileInputState();
    });

    // **Réinitialise l'état du champ de fichier**
    function resetFileInputState() {
        fileInput.value = "";
        uploadLabel.textContent = "Sélectionner les fichiers";
        uploadLabel.classList.remove("uploaded");
        extractBtn.style.display = "none"; // Masque le bouton d'extraction
    }

    // **Gestion de la sélection de fichier**
    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        const fileName = file ? file.name : "";

        console.log("Fichier sélectionné :", file);
        console.log("Nom du fichier :", fileName);

        if (fileName) {
            uploadLabel.textContent = `Fichier sélectionné : ${fileName}`;
            uploadLabel.classList.add("uploaded");

            // Vérification selon le mode sélectionné
            if (selectedMode === "fcpxml") {
                handleFcpxmlFile(file, fileName);
            } else if (selectedMode === "xmp") {
                handleXmpFile(file, fileName);
            } else {
                console.warn("Mode sélectionné inconnu :", selectedMode);
                uploadLabel.textContent = "Mode inconnu ou fichier incompatible";
            }
        } else {
            console.log("Aucun fichier sélectionné");
            resetFileInputState();
        }
    });

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

    // **Extraction automatique du contenu FCPXML depuis .fcpxmld**
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
});

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

// Fonction de traitement XML
function processXml(xmlContent, fileName, fps = 25) {
    console.log("Début du traitement XML pour le fichier :", fileName);

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "application/xml");
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        console.error("Erreur de parsing XML :", xmlDoc.getElementsByTagName("parsererror")[0].textContent);
        return;
    }

    const assetClips = xmlDoc.getElementsByTagName("asset-clip");
    console.log("Nombre de asset-clip dans le fichier :", assetClips.length);

    const data = [];
    for (let assetClip of assetClips) {
        const name = cleanText(assetClip.getAttribute("name") || "");
        console.log("Traitement de l'asset :", name);

        // Vérification si c'est une musique
        const isMusic = couldBeMusicAsset(name);
        if (!isMusic) {
            console.log("Asset ignoré (non musical) :", name);
            continue;
        }

        console.log("Asset musical détecté :", name);

        try {
            // Extraction des timecodes
            const offsetSeconds = parseFraction(assetClip.getAttribute("offset") || "0/1s");
            const durationSeconds = parseFraction(assetClip.getAttribute("duration") || "0/1s");

            // Conversion en frames
            const offsetFrames = Math.round(offsetSeconds * fps);
            const durationFrames = Math.round(durationSeconds * fps);

            // Calcul des timecodes
            const tcIn = convertFramesToTimecode(offsetFrames, fps);
            const tcOut = convertFramesToTimecode(offsetFrames + durationFrames, fps);
            const durationTimecode = convertFramesToTimecode(durationFrames, fps);

            console.log("Extraction des timecodes pour :", name);
            console.log("Offset (seconds):", offsetSeconds);
            console.log("Duration (frames):", durationFrames);
            console.log("TC IN:", tcIn, "TC OUT:", tcOut, "Duration:", durationTimecode);

            // Extraction des informations musicales basiques
            const { label, album, trackNumber, trackName, artists } = extractMusicInfo(name, fileName.endsWith(".fcpxmld"));

            data.push({
                label: label || "Inconnu",
                albumCode: "Inconnu",
                albumTitle: "Inconnu",
                trackTitle: trackName || "Inconnu",
                artists: artists || "Inconnu",
                composers: "Inconnu",
                tcin: tcIn,
                tcout: tcOut,
                duration: durationTimecode,
            });
            console.log("Ligne ajoutée dans les données :", data[data.length - 1]);
        } catch (error) {
            console.error(`Erreur lors de l'extraction des timecodes pour : ${name}`, error);
        }
    }

    if (data.length > 0) {
        globalOutputData.push({ file: fileName, data });
        console.log("Données musicales extraites et ajoutées :", data);
        console.log("Données complètes après traitement :", globalOutputData);
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

