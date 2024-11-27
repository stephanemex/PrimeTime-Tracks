// Normalise une chaîne pour la rendre comparable
function normalizeString(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/gi, '');
}

// Vérifie une correspondance partielle entre deux chaînes
function partialMatch(csvTitle, fcpxmlTitle) {
    const csvWords = csvTitle.split(/[^a-z0-9]+/); // Découpe le titre CSV en mots
    return csvWords.every((word) => fcpxmlTitle.includes(word)); // Vérifie si chaque mot est dans le titre FCPXML
}

// Enrichissement des données par le CSV
function enrichWithMappings(outputData, csvData) {
    if (!csvData || csvData.length === 0) {
        console.warn("Aucune donnée CSV fournie pour enrichir.");
        return;
    }

    if (!outputData || outputData.length === 0) {
        console.warn("Aucune donnée de projet pour enrichir.");
        return;
    }

    outputData.forEach((project) => {
        project.data.forEach((track) => {
            const normalizedTrackTitle = normalizeString(track.trackTitle || ""); // Sécurité ajoutée
            console.log("Recherche de correspondance pour :", normalizedTrackTitle);

            const csvMatch = csvData.find((row) => {
                const normalizedCsvTitle = normalizeString(row["Track Title"] || "");
                return partialMatch(normalizedCsvTitle, normalizedTrackTitle);
            });

            if (csvMatch) {
                console.log("Correspondance partielle trouvée :", csvMatch);

                // Mise à jour uniforme des champs
                track.label = csvMatch["Label"] || "Inconnu";
                track.albumCode = csvMatch["Album Code"] || "Inconnu";
                track.albumTitle = csvMatch["Album Title"] || "Inconnu";
                track.trackTitle = csvMatch["Track Title"] || track.trackTitle; // Si absent, garde l'original
                track.artists = csvMatch["Artist(s)"] || "Inconnu";
                track.composers = csvMatch["Composer(s)"] || "Inconnu";

                // Ajout d'un log pour chaque champ
                console.log(`Mise à jour du track :`, track);
            } else {
                console.warn("Pas de correspondance pour :", normalizedTrackTitle);
            }
        });
    });
}

// Affichage de l'aperçu
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
    console.log("Données reçues pour l'affichage :", globalOutputData);


    globalOutputData.forEach((item) => {
        const projectSection = document.createElement("div");
        projectSection.className = "project-section";

        const projectTitle = document.createElement("h3");
        projectTitle.innerText = `Fichier : ${item.file}`;
        projectSection.appendChild(projectTitle);

        const table = document.createElement("table");
        table.className = "preview-table";

        // Ajout des en-têtes
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

        // Ajout des données
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
                cell.innerText = row[mappings[header]] || "Inconnu";
            });
        });
        
        projectSection.appendChild(table);
        previewContainer.appendChild(projectSection);
    });

    document.getElementById("download-btn").style.display = "inline-block";
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
