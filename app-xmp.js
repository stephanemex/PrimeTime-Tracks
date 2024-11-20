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
    console.log("Traitement du fichier XMP :", file.name);

    try {
        // Lire le contenu du fichier XMP en texte brut
        const fileContent = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(fileContent, "application/xml");

        // Vérifier si le fichier est bien parsé
        if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
            console.error("Erreur de parsing dans le fichier XMP :", file.name);
            showMessage(`Erreur de parsing dans le fichier XMP : ${file.name}`, "error");
            return;
        }

        // Extraire les balises <rdf:li> pertinentes
        const items = xmlDoc.getElementsByTagName("rdf:li");
        if (items.length === 0) {
            console.warn("Aucune balise <rdf:li> trouvée dans le fichier XMP :", file.name);
            showMessage(`Aucune piste trouvée dans le fichier XMP : ${file.name}`, "warning");
            return;
        }

        console.log(`${items.length} pistes trouvées dans le fichier XMP`);

        const audioData = [];
        for (let item of items) {
            // Extraire les données nécessaires
            const filePath = item.getElementsByTagName("stRef:filePath")[0]?.textContent || "Inconnu";
            const fromPart = item.getElementsByTagName("stRef:fromPart")[0]?.textContent || "time:0";
            const toPart = item.getElementsByTagName("stRef:toPart")[0]?.textContent || "time:0";

            console.log("Données brutes extraites :", { filePath, fromPart, toPart });

            // Vérifier le chemin du fichier et filtrer par extension audio
            if (filePath === "Inconnu") {
                console.warn("Chemin de fichier inconnu trouvé dans le fichier XMP :", item);
                continue; // Ignore cet élément
            }
            const extension = filePath.split('.').pop().toLowerCase();
            if (!['aiff', 'wav', 'mp3'].includes(extension)) {
                console.warn(`Fichier ignoré (extension non audio) : ${filePath}`);
                continue; // Ignore les fichiers non audio
            }

            // Calculer les timecodes à l'aide de parseTimecodes
            const timecodes = parseTimecodes(fromPart, toPart);

            // Ajouter les données structurées
            audioData.push({
                filePath,
                ...timecodes
            });
        }

        console.log("Fichiers audio extraits et traités :", audioData);

        // Ajouter au tableau global des données
        globalOutputData.push({
            file: file.name,
            data: audioData
        });

        console.log("Données ajoutées à globalOutputData :", globalOutputData);
        showMessage(`Données audio extraites avec succès pour le fichier XMP : ${file.name}`, "success");
    } catch (error) {
        console.error("Erreur lors du traitement du fichier XMP :", error);
        showMessage(`Erreur lors du traitement du fichier XMP : ${error.message}`, "error");
    }
}

});
