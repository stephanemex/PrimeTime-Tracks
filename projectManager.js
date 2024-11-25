// DOM prêt
document.addEventListener("DOMContentLoaded", function () {
    console.log("Initialisation du gestionnaire de projets");

    const inputCsv = document.getElementById("input-csv");
    const btnUploadCsv = document.getElementById("btn-upload-csv");
    const mappingList = document.getElementById("mapping-list");
    const addMappingBtn = document.getElementById("add-mapping-btn");

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

    // Gestion de l'importation CSV
    inputCsv.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (!file) {
            showMessage("Aucun fichier CSV sélectionné.", "warning");
            return;
        }

        btnUploadCsv.textContent = `Fichier ajouté : ${file.name}`;
        btnUploadCsv.classList.add("btn-success");

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                globalCsvData = parseCsv(e.target.result);
                console.log("Données CSV importées :", globalCsvData); // Log pour vérifier les données importées
                if (globalCsvData.length > 0) {
                    showMessage(`CSV importé avec ${globalCsvData.length} entrées.`, "success");
                } else {
                    showMessage("Le fichier CSV est vide ou invalide.", "warning");
                }
            } catch (error) {
                console.error("Erreur lors du parsing CSV :", error);
                showMessage("Erreur lors de l'importation du CSV.", "error");
            }
        };
        reader.readAsText(file);
    });

    // Met à jour la liste des correspondances
    function updateMappingList() {
        if (!mappingList) return;
        mappingList.innerHTML = "";
    
        Object.entries(diffusionMappings).forEach(([subject, mapping]) => {
            const { producerName, showName, broadcastCount, projectDate, csvRows } = mapping;
    
            const listItem = document.createElement("li");
            listItem.className = "mapping-item";
    
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
    
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Supprimer";
            deleteBtn.className = "delete-btn";
            deleteBtn.addEventListener("click", () => {
                delete diffusionMappings[subject];
                updateMappingList();
                showMessage(`Correspondance supprimée pour ${subject}`, "info");
            });
    
            listItem.appendChild(detailsDiv);
            listItem.appendChild(tableDiv); // Ajoute le tableau en dessous des détails
            listItem.appendChild(deleteBtn);
    
            mappingList.appendChild(listItem);
        });
    }
    
    // Ajout de correspondance
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
    
        if (globalCsvData.length === 0) {
            showMessage("Aucune donnée CSV disponible. Veuillez importer un fichier CSV.", "error");
            return;
        }
    
        console.log("Clés disponibles dans une ligne CSV :", Object.keys(globalCsvData[0])); // Vérifie les clés
        console.log("Sujet recherché :", subject.toLowerCase());
    
        const csvRows = globalCsvData; // Associe toutes les lignes du CSV sans filtrer

        console.log("Lignes CSV correspondantes :", csvRows); // Vérifie les résultats filtrés
    
        diffusionMappings[subject] = {
            producerName,
            showName,
            broadcastCount,
            projectDate,
            csvRows,
        };
    
        updateMappingList();
        showMessage(`Correspondance ajoutée pour ${subject}`, "success");
    });
    
    console.log("Gestionnaire de projets prêt.");
});
