// DOM prêt
document.addEventListener("DOMContentLoaded", function () {
    console.log("Initialisation du gestionnaire de projets");

    const inputCsv = document.getElementById("input-csv");
    const btnUploadCsv = document.getElementById("btn-upload-csv");
    const mappingList = document.getElementById("mapping-list");
    const addMappingBtn = document.getElementById("add-mapping-btn");

    // Supprime cette ligne, car importedCsvFiles est déjà globalement défini dans globals.js
    // let importedCsvFiles = []; 

    const diffusionMappings = {}; // Correspondances ajoutées

    // Affiche un message dans l'interface
    function showMessage(message, type = "info") {
        const messageContainer = document.getElementById("message");
        if (!messageContainer) return;
        messageContainer.innerText = message;
        messageContainer.className = `message ${type}`;
    }

    // Parsing du fichier CSV
    function parseCsv(text) {
        const rows = text.trim().split("\n");
        const headers = rows.shift().split(",").map(header => header.replace(/"/g, "").trim());
        return rows.map(row => {
            const values = row.split(",").map(value => value.replace(/"/g, "").trim());
            return headers.reduce((acc, header, index) => {
                acc[header] = values[index] || "Inconnu";
                return acc;
            }, {});
        });
    }

    // Gestionnaire de clic pour le bouton CSV
    btnUploadCsv.addEventListener("click", () => {
        inputCsv.click(); // Simule un clic sur l'input CSV
    });

    // Gestion de l'importation de fichiers CSV
    inputCsv.addEventListener("change", function (event) {
        const files = event.target.files; // Liste des fichiers sélectionnés
        if (!files || files.length === 0) {
            showMessage("Aucun fichier CSV sélectionné.", "warning");
            return;
        }

        // Utilise FileReader pour lire chaque fichier CSV sélectionné
        for (const file of files) {
            const reader = new FileReader();

            reader.onload = function (e) {
                try {
                    const csvData = parseCsv(e.target.result); // Parse le contenu CSV
                    console.log(`Données CSV importées depuis ${file.name} :`, csvData);

                    if (csvData.length > 0) {
                        // Ajoute chaque fichier et ses données dans le tableau global `importedCsvFiles`
                        importedCsvFiles.push({
                            fileName: file.name,
                            data: csvData,
                        });
                        console.log("Fichier CSV ajouté à importedCsvFiles (global) :", file.name, csvData);

                        showMessage(`Fichier "${file.name}" importé avec ${csvData.length} entrées.`, "success");
                    } else {
                        showMessage(`Le fichier "${file.name}" est vide ou invalide.`, "warning");
                    }
                } catch (error) {
                    console.error(`Erreur lors du parsing CSV pour ${file.name} :`, error);
                    showMessage(`Erreur lors de l'importation du fichier "${file.name}".`, "error");
                }
            };

            reader.readAsText(file);
        }

        // Mets à jour le bouton pour indiquer combien de fichiers ont été ajoutés
        btnUploadCsv.textContent = `${files.length} fichier(s) ajouté(s)`;
        btnUploadCsv.classList.add("btn-success");
    });

    // Met à jour la liste des correspondances (projets + CSV associés)
    function updateMappingList() {
        if (!mappingList) return;

        mappingList.innerHTML = ""; // Réinitialise la liste d'affichage

        Object.entries(diffusionMappings).forEach(([subject, mapping]) => {
            const { producerName, showName, broadcastCount, projectDate, csvRows } = mapping;

            const listItem = document.createElement("li");
            listItem.className = "mapping-item";

            // Détails du projet
            const detailsDiv = document.createElement("div");
            detailsDiv.className = "mapping-details";
            detailsDiv.innerHTML = `
                <ul>
                    <li><b>Producteur :</b> ${producerName}</li>
                    <li><b>Émission :</b> ${showName}</li>
                    <li><b>Sujet :</b> ${subject}</li>
                    <li><b>Diffusions :</b> ${broadcastCount}</li>
                    <li><b>Date :</b> ${projectDate}</li>
                </ul>`;

            // Tableau des données CSV associées
            const tableDiv = document.createElement("div");
            tableDiv.className = "mapping-table";
            tableDiv.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Label</th>
                            <th>Album Code</th>
                            <th>Album Title</th>
                            <th>Track Title</th>
                            <th>Artist(s)</th>
                            <th>Composer(s)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${csvRows.map(row => `
                            <tr>
                                <td>${row.Label || "Inconnu"}</td>
                                <td>${row["Album Code"] || "Inconnu"}</td>
                                <td>${row["Album Title"] || "Inconnu"}</td>
                                <td>${row["Track Title"] || "Inconnu"}</td>
                                <td>${row["Artist(s)"] || "Inconnu"}</td>
                                <td>${row["Composer(s)"] || "Inconnu"}</td>
                            </tr>`).join("")}
                    </tbody>
                </table>`;

            // Bouton pour supprimer ce projet (et ses données CSV associées)
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Supprimer";
            deleteBtn.className = "delete-btn";
            deleteBtn.addEventListener("click", () => {
                delete diffusionMappings[subject];
                updateMappingList();
                showMessage(`Correspondance supprimée pour ${subject}`, "info");
            });

            // Assemble les éléments pour ce projet
            listItem.appendChild(detailsDiv);
            listItem.appendChild(tableDiv);
            listItem.appendChild(deleteBtn);

            mappingList.appendChild(listItem);
        });
    }

    // Ajout de correspondance entre les données du projet et les CSV importés
    addMappingBtn.addEventListener("click", () => {
        const producerName = document.getElementById("producer-name").value.trim();
        const showName = document.getElementById("show-name").value.trim();
        const subject = document.getElementById("project-name").value.trim();
        const broadcastCount = parseInt(document.getElementById("broadcast-count").value.trim());
        const projectDate = document.getElementById("project-date").value.trim();

        if (!producerName || !showName || !subject || isNaN(broadcastCount) || !projectDate) {
            showMessage("Veuillez remplir tous les champs.", "error");
            return;
        }

        if (importedCsvFiles.length === 0) {
            showMessage("Aucune donnée CSV disponible. Veuillez importer un fichier CSV.", "error");
            return;
        }

        console.log("Ajout de correspondance pour :", subject);

        // Ajoute la correspondance au tableau `diffusionMappings`
        diffusionMappings[subject] = {
            producerName,
            showName,
            broadcastCount,
            projectDate,
            csvRows: importedCsvFiles.flatMap(file => file.data), // Combine toutes les données CSV pour ce projet
        };

        updateMappingList();
        showMessage(`Correspondance ajoutée pour ${subject}`, "success");
    });

    console.log("Gestionnaire de projets prêt.");
});

/**
 * Combine les données de plusieurs fichiers CSV importés.
 * @param {Array} importedCsvFiles - Liste des fichiers CSV importés (avec leur data).
 * @returns {Array} - Données combinées de tous les fichiers CSV.
 */
function combineCsvData(importedCsvFiles) {
    if (!importedCsvFiles || importedCsvFiles.length === 0) {
        console.warn("Aucun fichier CSV à combiner.");
        return [];
    }

    return importedCsvFiles.reduce((combined, file) => {
        return combined.concat(file.data); // Combine toutes les lignes de données
    }, []);
}
