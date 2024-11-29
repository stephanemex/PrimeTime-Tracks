// Normalise une chaîne pour la rendre comparable
function normalizeString(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/gi, '') // Supprime les caractères spéciaux
        .replace(/\s+/g, ' ') // Remplace les espaces multiples par un seul espace
        .trim(); // Supprime les espaces en début/fin
}

// Vérifie une correspondance partielle entre deux chaînes
function partialMatch(csvTitle, fcpxmlTitle) {
    const csvWords = csvTitle.split(/[^a-z0-9]+/); // Découpe le titre CSV en mots
    console.log(`Comparaison des mots du CSV : ${csvWords} avec le titre FCPXML : ${fcpxmlTitle}`);
    const result = csvWords.every((word) => fcpxmlTitle.includes(word)); // Vérifie si chaque mot est présent
    console.log(`Résultat de la correspondance pour "${csvTitle}" : ${result}`);
    return result;
}

// --- Fonction pour préparer les métadonnées ---
function getProjectMeta() {
    // Log pour vérifier l'état actuel de diffusionMappings
    console.log("diffusionMappings (global) :", diffusionMappings);

    // Récupère dynamiquement le sujet depuis un champ texte (exemple : un champ <input id="project-name">)
    const selectedSubject = document.getElementById("project-name").value.trim();

    // Vérifie si le champ texte est vide
    if (!selectedSubject) {
        console.error("Le champ 'Sujet' (project-name) est vide.");
        alert("Erreur : Veuillez saisir un sujet dans le champ correspondant.");
        return null;
    }

    // Log pour confirmer le sujet sélectionné
    console.log("Sujet sélectionné :", selectedSubject);

    // Récupère les métadonnées associées au sujet dans diffusionMappings
    const mapping = diffusionMappings[selectedSubject]; // Recherche la correspondance

    // Si aucune correspondance n'est trouvée, afficher une erreur
    if (!mapping) {
        console.error(`Aucune correspondance trouvée pour le sujet : "${selectedSubject}"`);
        alert(`Erreur : Aucune correspondance trouvée pour le sujet "${selectedSubject}".`);
        return null;
    }

    // Log pour confirmer les métadonnées récupérées
    console.log(`Métadonnées trouvées pour "${selectedSubject}" :`, mapping);

    // Retourne les métadonnées au format attendu
    return {
        producer: mapping.producerName || "Non spécifié", // Producteur
        show: mapping.showName || "Non spécifié", // Émission
        subject: selectedSubject, // Sujet (issu du champ utilisateur)
        broadcastCount: mapping.broadcastCount || 0, // Nombre de diffusions
        date: mapping.projectDate || "Non spécifié", // Date du projet
    };
}

/**
 * Enrichissement des données par les fichiers CSV importés.
 * Cette fonction compare les données extraites d'un fichier XML avec les données importées
 * depuis un ou plusieurs fichiers CSV pour compléter les informations manquantes.
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
    const allCsvData = importedCsvFiles.flatMap(file => file.data);
    if (allCsvData.length === 0) {
        console.warn("Les fichiers CSV importés ne contiennent aucune donnée.");
        return;
    }

    console.log("Données combinées des fichiers CSV :", allCsvData);

    // Parcours des données extraites pour les enrichir avec les informations des CSV
    outputData.forEach(project => {
        project.data.forEach(track => {
            const normalizedTrackTitle = normalizeString(track.trackTitle || "");
            const csvMatch = allCsvData.find(row => {
                const normalizedCsvTitle = normalizeString(row["Track Title"] || "");
                return partialMatch(normalizedCsvTitle, normalizedTrackTitle);
            });

            if (csvMatch) {
                track.label = csvMatch["Label"] || "Inconnu";
                track.albumCode = csvMatch["Album Code"] || "Inconnu";
                track.albumTitle = csvMatch["Album Title"] || "Inconnu";
                track.trackTitle = csvMatch["Track Title"] || track.trackTitle;
                track.artists = csvMatch["Artist(s)"] || "Inconnu";
                track.composers = csvMatch["Composer(s)"] || "Inconnu";
                track.duration = formatDurationToSeconds(track.duration);
            }
        });
    });

    console.log("Données enrichies :", outputData);
}

/**
 * Permet l'édition des cellules dans le tableau d'aperçu.
 * Les modifications sont sauvegardées directement dans `globalOutputData`.
 */
function enableTableEditing(table, projectIndex) {
    table.querySelectorAll("td").forEach((cell, cellIndex) => {
        cell.contentEditable = true; // Rendre chaque cellule éditable
        cell.addEventListener("blur", () => {
            const rowIndex = cell.parentElement.rowIndex - 1; // Ajuste pour ignorer la ligne d'en-tête
            const headers = ["label", "albumCode", "albumTitle", "trackTitle", "artists", "composers", "tcin", "tcout", "duration"];
            const key = headers[cellIndex];

            // Met à jour globalOutputData avec la nouvelle valeur
            globalOutputData[projectIndex].data[rowIndex][key] = cell.innerText.trim();
        });
    });
}

/**
 * Affichage de l'aperçu des données dans le tableau HTML.
 */
function displayPreview(projectName) {
    console.log("Affichage de l'aperçu pour le projet :", projectName);
    const previewContainer = document.getElementById("preview");
    previewContainer.innerHTML = "";

    if (!globalOutputData || globalOutputData.length === 0) {
        const noDataMessage = document.createElement("p");
        noDataMessage.innerText = "Aucune donnée disponible pour l'aperçu.";
        previewContainer.appendChild(noDataMessage);
        return;
    }

    globalOutputData.forEach((item, projectIndex) => {
        const projectSection = document.createElement("div");
        projectSection.className = "project-section";

        const projectTitle = document.createElement("h3");
        projectTitle.innerText = `Fichier : ${item.file}`;
        projectSection.appendChild(projectTitle);

        const table = document.createElement("table");
        table.className = "preview-table";

        const headers = [
            "Label", "Album Code", "Album Title", "Track Title", "Artist(s)", "Composer(s)", "TC IN", "TC OUT", "Durée"
        ];
        const headerRow = table.insertRow();
        headers.forEach((header) => {
            const th = document.createElement("th");
            th.innerText = header;
            headerRow.appendChild(th);
        });

        item.data.forEach((row) => {
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
            
                // Vérifie si la valeur a été enrichie
                const value = row[mappings[header]] || "Inconnu";
                cell.innerText = header === "Durée" ? formatDurationToSeconds(value) : value;
            });
        });

        enableTableEditing(table, projectIndex); // Rendre le tableau éditable
        projectSection.appendChild(table);
        previewContainer.appendChild(projectSection);
    });

    document.getElementById("download-btn").style.display = "inline-block";
}

/**
 * Convertit une durée en HH:MM:SS en supprimant les frames.
 * @param {string} timecode - Durée au format HH:MM:SS:FF.
 * @returns {string} - Durée tronquée au format HH:MM:SS.
 */
function formatDurationToSeconds(timecode) {
    const [hh, mm, ss] = timecode.split(":"); // Ignore les frames (FF)
    return `${hh}:${mm}:${ss}`; // Retourne uniquement HH:MM:SS
}

//Fonction Pour créer le ficheir Excel 
async function generateExcel(projectName, projectMeta) {
    console.log("Génération du fichier Excel pour :", projectName);
    console.log("Données dans globalOutputData :", globalOutputData);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Musiques Utilisées");

    // --- MÉTADONNÉES ---
    const metaEntries = [
        ["Producteur", projectMeta.producer],
        ["Émission", projectMeta.show],
        ["Sujet", projectMeta.subject],
        ["Diffusions", projectMeta.broadcastCount],
        ["Date", projectMeta.date],
    ];

    metaEntries.forEach(([key, value], index) => {
        const titleCell = worksheet.getCell(`A${index + 1}`);
        titleCell.value = `${key}:`;
        titleCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6c8cb7" } };
        titleCell.alignment = { horizontal: "left" };

        const valueCell = worksheet.getCell(`B${index + 1}`);
        valueCell.value = value || "Non spécifié";
        valueCell.font = { color: { argb: "FFFFFFFF" } };
        valueCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6c8cb7" } };
        valueCell.alignment = { horizontal: "left" };
    });

    worksheet.addRow([]);

    // --- TITRE PRINCIPAL ---
    const title = `Musiques Utilisées pour le projet ${projectMeta.show} - ${projectMeta.subject}`;
    worksheet.mergeCells(`A${metaEntries.length + 2}:I${metaEntries.length + 2}`);
    const titleCell = worksheet.getCell(`A${metaEntries.length + 2}`);
    titleCell.value = title;
    titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    titleCell.alignment = { horizontal: "center" };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003366" } };

    // --- EN-TÊTES ---
    const headers = ["Label", "Album Code", "Album Title", "Track Title", "Artist(s)", "Composer(s)", "TC IN", "TC OUT", "Durée"];
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 25;

    headerRow.eachCell({ includeEmpty: false }, (cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6c8cb7" } };
        cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        };
    });

    // --- DONNÉES ---
    globalOutputData.forEach((item) => {
        item.data.forEach((row) => {
            const trackRow = worksheet.addRow([
                row.label || "Inconnu",
                row.albumCode || "Inconnu",
                row.albumTitle || "Inconnu",
                row.trackTitle || "Inconnu",
                row.artists || "Inconnu",
                row.composers || "Inconnu",
                row.tcin || "Inconnu",
                row.tcout || "Inconnu",
                row.duration || "Inconnu",
            ]);

            trackRow.eachCell((cell) => {
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
            });
        });

        worksheet.addRow([]);
    });

    // --- FOOTER ---
    const footerMessage1 = "Document extrait de l'application PrimeTime Tracks";
    const footerMessage2 = "Développée par Stéphane Mex - Contact : stephane.mex@lemanbleu.ch";

    worksheet.addRow([]);

    const footerRow1 = worksheet.addRow([footerMessage1]);
    worksheet.mergeCells(`A${footerRow1.number}:H${footerRow1.number}`);
    const footerCell1 = worksheet.getCell(`A${footerRow1.number}`);
    footerCell1.font = { italic: true, color: { argb: "FF6c8cb7" } };
    footerCell1.alignment = { horizontal: "center", vertical: "middle" };

    const footerRow2 = worksheet.addRow([footerMessage2]);
    worksheet.mergeCells(`A${footerRow2.number}:H${footerRow2.number}`);
    const footerCell2 = worksheet.getCell(`A${footerRow2.number}`);
    footerCell2.font = { italic: true, color: { argb: "FF6c8cb7" } };
    footerCell2.alignment = { horizontal: "center", vertical: "middle" };

    // --- TÉLÉCHARGEMENT ---
    const formattedEmission = projectMeta.show.replace(/\s+/g, "_");
    const formattedSubject = projectMeta.subject.replace(/\s+/g, "_");
    const generationDate = new Date().toISOString().slice(0, 10);
    const fileName = `Rapport_${formattedEmission}_${formattedSubject}_${generationDate}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName; // Utilise le nouveau nom de fichier
    a.click();
    URL.revokeObjectURL(url);
}

// Gestion des boutons
document.getElementById("process-btn").addEventListener("click", function () {
    enrichWithMappings(globalOutputData);
    displayPreview("Projet en cours");
});

document.getElementById("download-btn").addEventListener("click", function () {
    const projectMeta = getProjectMeta(); // Récupère les métadonnées

    if (!projectMeta) {
        console.error("Impossible de générer le fichier Excel sans métadonnées.");
        return;
    }

    generateExcel("Projet en cours", projectMeta); // Passe les métadonnées à la fonction
});

