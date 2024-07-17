import * as path from 'path';
import * as fse from 'fs-extra';

// *** UTILS VARIABLES
const JOIN = path.join;
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg'];
const MAX_IMAGE_COPIES = 1000;
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

// *** FOLDER STRUCTURE VARIABLES
const ASSETS_PATH = JOIN(__dirname, 'assets');
const OUTPUT_PATH = JOIN(__dirname, 'NFTS');

// *** Chunk calculation VARIABLES
let imageCount = 1;
let numberOfChunks: number = 0;
let extraImagesLeftToMatchCount: number = 0;
let extraChunksCount: number = 0;


/**
 * @description
 * Helper function that cheks if a path contains
 * allowed image types
 */
function filterOutUnwantedImageExtensions(found_images: any) {
    return found_images.filter((element: any) => {
        const imageExtension = path.extname(element.name).toLowerCase();
        return element.isFile() && ALLOWED_IMAGE_EXTENSIONS.includes(imageExtension);
    });
}

/**
 * @description
 * Helmper method that takes care of calculating the number of copies per chunk
 * based on the number of images, and the desired number of copies
 */
function getChunksData(imageFiles: any) {
    numberOfChunks = Math.floor(MAX_IMAGE_COPIES / imageFiles.length);
    extraImagesLeftToMatchCount = MAX_IMAGE_COPIES - (numberOfChunks * imageFiles.length);
    extraChunksCount = Math.ceil(extraImagesLeftToMatchCount / imageFiles.length);

    console.log("\x1b[32m", "------------------------");
    console.log("\x1b[32m", "      Images Status");
    console.log("\x1b[32m", "------------------------");
    console.log("\x1b[32m", "Total Images:", imageFiles.length);
    console.log("\x1b[32m", "-->", numberOfChunks, "chunks of", imageFiles.length, "image(s) each");
    if (extraImagesLeftToMatchCount > 0)
        console.log("\x1b[32m", "-->", extraImagesLeftToMatchCount, "additional images needed to match total count. (", extraChunksCount, "extra chunks)");
    console.log("\x1b[32m", "------------------------");
}

/**
 * @description
 * Helmper method that takes care of displaying the info message
 * and waiting for user confirmation
 */
async function displayImagesStatus(imageFiles: any) {

    getChunksData(imageFiles);

    const question = 'Press Enter to continue (other key to cancel): ';

    await new Promise<void>((resolve, reject) => {
        readline.question(question, (answer: any) => {
            if (answer.toLowerCase() === '') resolve();
            else reject(new Error('User cancelled copying'));
            readline.close();
        });
    });
}


// *** ===============================================
// *** ================ MAIN FUNCTIONS ===============
// *** ===============================================

function generateCopies(imageFiles: any) {

    const copyOneImage = async (imageFile: any, SOURCE_PATH: any) => {
        const imageExtension = imageFile.name.endsWith('.jpg') ? '.jpg' : '.jpeg';

        const DESTINATION_PATH = JOIN(OUTPUT_PATH, `${imageCount}${imageExtension}`);

        console.log("\x1b[34m", `--> Copying Image: ${imageFile.name} (copy ${imageCount})`, "\x1b[0m");

        imageCount++;
        await fse.copy(SOURCE_PATH, DESTINATION_PATH);
    }

    for (let chunk = 0; chunk < numberOfChunks; chunk++) {
        console.log("\x1b[32m", "----------------------------------------");
        console.log("\x1b[32m", "Exploring CHUNK -", (chunk + 1), "of", numberOfChunks);
        console.log("\x1b[32m", "----------------------------------------");

        for (const imageFile of imageFiles) {
            const SOURCE_PATH = JOIN(ASSETS_PATH, imageFile.name);
            copyOneImage(imageFile, SOURCE_PATH);
        }
    }

    if (extraImagesLeftToMatchCount > 0) {
        for (let chunk = 0; chunk < extraChunksCount; chunk++) {
            console.log("\x1b[32m", "----------------------------------------");
            console.log("\x1b[32m", "Exploring EXTRA CHUNK -", (chunk + 1), "of", extraChunksCount);
            console.log("\x1b[32m", "----------------------------------------");

            for (let i = 0; i < extraImagesLeftToMatchCount; i++) {
                const imageFile = imageFiles[i];
                const SOURCE_PATH = JOIN(ASSETS_PATH, imageFile.name);
                copyOneImage(imageFile, SOURCE_PATH);
            }
        }
    }

    console.log("\x1b[32m", "------------------------");
    console.log("\x1b[32m", "Copies Completed");
    console.log("\x1b[32m", "------------------------");
}


// ** MAIN FUNCTION **
(async function () {

    const found_images = fse.readdirSync(ASSETS_PATH, { withFileTypes: true });

    const imageFiles = filterOutUnwantedImageExtensions(found_images);

    displayImagesStatus(imageFiles)
        .then(async () => await generateCopies(imageFiles))
})();