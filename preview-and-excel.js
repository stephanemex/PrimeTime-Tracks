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


/**
 * Génération du fichier Excel basé sur le tableau enrichi et édité.
 */
async function generateExcel(projectName) {
    console.log("Génération du fichier Excel pour :", projectName);
    console.log("Données dans globalOutputData :", globalOutputData);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Droits Musicaux");

    // Titre principal du fichier Excel
    worksheet.mergeCells("A1:C1");
    worksheet.getCell("A1").value = "Droits Musicaux - Aperçu";
    worksheet.getCell("A1").font = { bold: true, size: 16 };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    // En-têtes du tableau
    const headers = ["Label", "Album Code", "Album Title", "Track Title", "Artist(s)", "Composer(s)", "TC IN", "TC OUT", "Durée"];
    worksheet.addRow(headers).font = { bold: true };

    // Parcours de chaque projet/fichier dans `globalOutputData`
    globalOutputData.forEach((item) => {
        // Ajout du titre du fichier en tant que section
        worksheet.addRow([`Fichier : ${item.file}`]).font = { italic: true };

        // Ajout des données de chaque track
        item.data.forEach((row) => {
            // Récupère les données pour chaque colonne en s'assurant qu'elles correspondent à l'affichage HTML
            worksheet.addRow([
                row.label || "Inconnu",
                row.albumCode || "Inconnu",
                row.albumTitle || "Inconnu",
                row.trackTitle || "Inconnu",
                row.artists || "Inconnu",
                row.composers || "Inconnu",
                row.tcin || "Inconnu",
                row.tcout || "Inconnu",
                row.duration || "Inconnu"
            ]);
        });

        // Ajoute une ligne vide entre chaque fichier pour une meilleure lisibilité
        worksheet.addRow([]);
    });

    // Génération et téléchargement du fichier Excel
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
    enrichWithMappings(globalOutputData);
    displayPreview("Projet en cours");
});

document.getElementById("download-btn").addEventListener("click", function () {
    generateExcel("Projet en cours");
});
