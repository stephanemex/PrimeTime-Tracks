// Normalise une chaîne pour la rendre comparable
function normalizeString(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/gi, ''); // Supprime les caractères non alphanumériques
}

// Vérifie une correspondance partielle entre deux chaînes
function partialMatch(csvTitle, fcpxmlTitle) {
    const csvWords = csvTitle.split(/[^a-z0-9]+/); // Découpe le titre CSV en mots
    return csvWords.every((word) => fcpxmlTitle.includes(word)); // Vérifie si chaque mot est dans le titre FCPXML
}

/**
 * Enrichissement des données par les fichiers CSV importés.
 * Cette fonction compare les données extraites d'un fichier XML avec les données importées
 * depuis un ou plusieurs fichiers CSV pour compléter les informations manquantes.
 * 
 * @param {Array} outputData - Données extraites des fichiers XML.
 */
function enrichWithMappings(outputData) {
    if (!outputData || outputData.length === 0) {
        console.warn("Aucune donnée de projet pour enrichir.");
        return;
    }

    // Vérifie si des fichiers CSV ont été importés
    if (!importedCsvFiles || importedCsvFiles.length === 0) {
        console.warn("Aucun fichier CSV importé pour enrichir les données.");
        return;
    }

    // Combine tous les fichiers CSV importés en un seul tableau
    const allCsvData = importedCsvFiles.flatMap(file => file.data); // Fusionne toutes les données CSV
    if (allCsvData.length === 0) {
        console.warn("Les fichiers CSV importés ne contiennent aucune donnée.");
        return;
    }

    console.log("Données combinées des fichiers CSV :", allCsvData);

    // Parcours des données extraites pour les enrichir avec les informations des CSV
    outputData.forEach(project => {
        project.data.forEach(track => {
            const normalizedTrackTitle = normalizeString(track.trackTitle || ""); // Normalise le titre du track
            console.log("Recherche de correspondance pour :", normalizedTrackTitle);

            // Recherche une correspondance dans les données CSV combinées
            const csvMatch = allCsvData.find(row => {
                const normalizedCsvTitle = normalizeString(row["Track Title"] || "");
                return partialMatch(normalizedCsvTitle, normalizedTrackTitle);
            });

            if (csvMatch) {
                console.log("Correspondance trouvée dans CSV :", csvMatch);

                // Mise à jour des champs pour le track avec les données du CSV
                track.label = csvMatch["Label"] || "Inconnu";
                track.albumCode = csvMatch["Album Code"] || "Inconnu";
                track.albumTitle = csvMatch["Album Title"] || "Inconnu";
                track.trackTitle = csvMatch["Track Title"] || track.trackTitle; // Si absent, garde l'original
                track.artists = csvMatch["Artist(s)"] || "Inconnu";
                track.composers = csvMatch["Composer(s)"] || "Inconnu";

                // Formate la durée pour tronquer les frames (passage à HH:MM:SS uniquement)
                track.duration = formatDurationToSeconds(track.duration);
            } else {
                console.warn("Pas de correspondance trouvée pour :", normalizedTrackTitle);
            }
        });
    });

    console.log("Données enrichies :", outputData);
}

/**
 * Affichage de l'aperçu des données dans le tableau HTML.
 * Cette fonction crée dynamiquement un tableau pour chaque projet ou fichier importé.
 * 
 * @param {string} projectName - Nom du projet en cours d'affichage.
 */
function displayPreview(projectName) {
    console.log("Affichage de l'aperçu pour le projet :", projectName);
    const previewContainer = document.getElementById("preview");
    previewContainer.innerHTML = ""; // Réinitialise le contenu du conteneur

    // Vérifie si des données sont disponibles
    if (!globalOutputData || globalOutputData.length === 0) {
        const noDataMessage = document.createElement("p");
        noDataMessage.innerText = "Aucune donnée disponible pour l'aperçu.";
        previewContainer.appendChild(noDataMessage);
        return;
    }
    console.log("Données reçues pour l'affichage :", globalOutputData);

    // Création de sections pour chaque fichier projet
    globalOutputData.forEach((item) => {
        const projectSection = document.createElement("div");
        projectSection.className = "project-section";

        // Titre du fichier projet
        const projectTitle = document.createElement("h3");
        projectTitle.innerText = `Fichier : ${item.file}`;
        projectSection.appendChild(projectTitle);

        const table = document.createElement("table");
        table.className = "preview-table";

        // Ajout des en-têtes du tableau
        const headers = [
            "Label",
            "Album Code",
            "Album Title",
            "Track Title",
            "Artist(s)",
            "Composer(s)",
            "TC IN",
            "TC OUT",
            "Durée",
        ];
        const headerRow = table.insertRow();
        headers.forEach((header) => {
            const th = document.createElement("th");
            th.innerText = header;
            headerRow.appendChild(th);
        });

        // Ajout des données dans le tableau
        item.data.forEach((row) => {
            console.log("Données de la ligne :", row);
            const dataRow = table.insertRow();
            const mappings = {
                "Label": "label",
                "Album Code": "albumCode",
                "Album Title": "albumTitle",
                "Track Title": "trackTitle",
                "Artist(s)": "artists",
                "Composer(s)": "composers",
                "TC IN": "tcin",
                "TC OUT": "tcout",
                "Durée": "duration"
            };

            headers.forEach((header) => {
                const cell = dataRow.insertCell();

                // Pour les durées, appliquer le formatage HH:MM:SS si ce n'est pas encore fait
                if (header === "Durée") {
                    cell.innerText = formatDurationToSeconds(row[mappings[header]] || "00:00:00:00");
                } else {
                    cell.innerText = row[mappings[header]] || "Inconnu";
                }
            });
        });

        // Ajoute le tableau à la section projet
        projectSection.appendChild(table);
        previewContainer.appendChild(projectSection);
    });

    // Affiche le bouton de téléchargement si des données sont présentes
    document.getElementById("download-btn").style.display = "inline-block";
}

/**
 * Convertit une durée en HH:MM:SS en supprimant les frames
 * @param {string} timecode - Durée au format HH:MM:SS:FF
 * @returns {string} - Durée tronquée au format HH:MM:SS
 */
function formatDurationToSeconds(timecode) {
    const [hh, mm, ss] = timecode.split(":"); // Ignore les frames (FF)
    return `${hh}:${mm}:${ss}`; // Retourne uniquement HH:MM:SS
}

// Génération du fichier Excel
async function generateExcel(projectName) {
    console.log("Génération du fichier Excel pour :", projectName);
    console.log("Données dans globalOutputData :", globalOutputData);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Droits Musicaux");

    worksheet.mergeCells("A1:C1");
    worksheet.getCell("A1").value = "Droits Musicaux - Aperçu";
    worksheet.getCell("A1").font = { bold: true, size: 16 };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    const headers = ["Label", "Album Code", "Album Title", "Track Title", "Artist(s)", "Composer(s)", "TC IN", "TC OUT", "Durée"];
    worksheet.addRow(headers).font = { bold: true };

    globalOutputData.forEach((item) => {
        worksheet.addRow([`Fichier : ${item.file}`]).font = { italic: true };

        item.data.forEach((row) => {
            worksheet.addRow(headers.map((header) => row[header.toLowerCase()] || "Inconnu"));
        });

        worksheet.addRow([]); // Ligne vide entre les sections
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}

// Gestion des boutons
document.getElementById("process-btn").addEventListener("click", function () {
    console.log("Génération de l'aperçu demandée.");
    enrichWithMappings(globalOutputData, globalCsvData);
    displayPreview("Projet en cours");
});

document.getElementById("download-btn").addEventListener("click", function () {
    console.log("Téléchargement du fichier Excel demandé.");
    generateExcel("Projet en cours");
});
