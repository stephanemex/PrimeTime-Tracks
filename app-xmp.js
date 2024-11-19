document.addEventListener('DOMContentLoaded', function () {
    const fileInputXMP = document.getElementById('input-xmp');
    const uploadLabelXMP = document.querySelector('.file-upload-label-xmp');
    let outputDataXMP = []; // Données de sortie pour les fichiers XMP

    console.log("Chargement de app-xmp.js : Gestion des fichiers XMP activée");

    // Activer l'input de fichiers après l'initialisation
    fileInputXMP.disabled = false;

    // Écouteur pour le changement de fichiers XMP
    fileInputXMP.addEventListener('change', function (event) {
        const files = event.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log("Fichier XMP sélectionné : ", file.name);

            if (file.name.endsWith('.xmp')) {
                console.log("Détection d'un fichier XMP : ", file.name);
                processXMP(file); // Appelle la fonction pour traiter le fichier XMP
            } else {
                console.warn("Fichier non pris en charge : ", file.name);
            }
        }
    });

    // Fonction pour traiter les fichiers XMP
    async function processXMP(file) {
        console.log("Traitement du fichier XMP : ", file.name);

        // Lire le contenu du fichier
        const fileContent = await file.text(); // Lecture du fichier XMP en texte brut
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(fileContent, "application/xml");

        // Vérifier si le fichier est bien parsé
        if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
            console.error("Erreur de parsing dans le fichier XMP :", file.name);
            showMessage(`Erreur de parsing dans le fichier XMP : ${file.name}`, "error");
            return;
        }

        // Extraire les balises pertinentes
        const items = xmlDoc.getElementsByTagName("rdf:li");
        if (items.length === 0) {
            console.warn("Aucune balise <rdf:li> trouvée dans le fichier XMP :", file.name);
            showMessage(`Aucune piste trouvée dans le fichier XMP : ${file.name}`, "warning");
            return;
        }

        console.log(`${items.length} pistes trouvées dans le fichier XMP`);

        const data = [];
        for (let item of items) {
            // Extraire les données des balises
            const filePath = item.getElementsByTagName("stRef:filePath")[0]?.textContent || "Inconnu";
            const fromPart = item.getElementsByTagName("stRef:fromPart")[0]?.textContent || "time:0";
            const toPart = item.getElementsByTagName("stRef:toPart")[0]?.textContent || "time:0";

            console.log("Données brutes extraites :", { filePath, fromPart, toPart });

            // Utiliser les fonctions existantes ou créer de nouvelles pour traiter les données
            const parsedFile = parseFileName(filePath); // Découpe le nom du fichier
            const timecodes = parseTimecodes(fromPart, toPart); // Calcule les timecodes et la durée

            // Ajouter les données à la liste
            data.push({
                ...parsedFile, // Label, Album, Piste, Titre, Artiste
                ...timecodes   // Timecode IN, Timecode OUT, Durée
            });
        }

        console.log("Données extraites pour le fichier XMP :", data);

        // Ajouter au tableau global de données
        globalOutputData.push({
            type: 'XMP', // Identifie le type de fichier
            file: file.name,
            data: data
        });
        

        console.log("OutputData XMP mis à jour :", outputDataXMP);
        showMessage(`Données extraites avec succès pour le fichier XMP : ${file.name}`, "success");
    }


});
